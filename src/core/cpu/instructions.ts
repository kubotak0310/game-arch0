import type { Instruction, Operand, Registers, Flags, AnyRegisterName, RuntimeError } from './types.ts'
import type { Memory } from './memory.ts'

/**
 * ステージで操作対象になる「ユーザー領域」のメモリ末尾アドレス。
 * 0x40 以降は SP の初期位置（スタック領域）として暗黙に使うため、ユーザーが
 * `LOAD` / `STORE` で触る想定の上限を区切る目的で公開している。
 */
export const USER_MEM_MAX = 0x3F

/**
 * 1ステップの実行中に破壊的に更新される CPU 状態。
 *
 * `executeInstruction()` は副作用を `state` に書き込み、呼び出し側（Cpu クラス）が
 * スナップショットを取得して履歴に積む構成。`error` がセットされると以降の実行は停止する。
 */
export interface MutableCpuState {
  registers: Registers
  flags: Flags
  memory: Memory
  pc: number
  sp: number
  lr: number
  halted: boolean
  error?: RuntimeError
}

/** レジスタ名から現在値を取得する内部ヘルパー。 */
function readRegister(state: MutableCpuState, name: AnyRegisterName): number {
  switch (name) {
    case 'R0': return state.registers.R0
    case 'R1': return state.registers.R1
    case 'R2': return state.registers.R2
    case 'R3': return state.registers.R3
    case 'R4': return state.registers.R4
    case 'LR': return state.lr
    case 'SP': return state.sp
    case 'PC': return state.pc
  }
}

// ADD/SUB/CMP 等の演算系第2/3オペランド（register または immediate）から値を取り出す。
// パーサーが型を保証しているが、型ガードで安全に分岐する。
function readRegOrImm(state: MutableCpuState, op: Operand): number {
  if (op.type === 'immediate') return op.value
  if (op.type === 'register') return readRegister(state, op.name)
  return 0
}

/**
 * レジスタに値を書き込む。値は必ず 16bit にマスクする（仕様：オーバーフローは下位 16bit のみ保持）。
 * PC / SP / LR の書き換えもここで一元化することで「次の PC」を任意に操作可能。
 */
export function setRegister(state: MutableCpuState, name: AnyRegisterName, value: number): void {
  const masked = value & 0xFFFF
  switch (name) {
    case 'R0': state.registers.R0 = masked; return
    case 'R1': state.registers.R1 = masked; return
    case 'R2': state.registers.R2 = masked; return
    case 'R3': state.registers.R3 = masked; return
    case 'R4': state.registers.R4 = masked; return
    case 'LR': state.lr = masked; return
    case 'SP': state.sp = masked; return
    case 'PC': state.pc = masked; return
  }
}

/**
 * ADD 命令後のフラグ更新。
 *
 * - C（キャリー）：マスク前の `full` が 0xFFFF を超えていれば桁あふれ発生。
 * - V（オーバーフロー）：符号なし演算と違い、両オペランドの符号が一致しているのに
 *   結果の符号が反転した場合のみ「符号付きのはみ出し」が起きる。
 */
function updateFlagsAdd(state: MutableCpuState, a: number, b: number, result: number, full: number): void {
  const aSign = (a & 0x8000) !== 0
  const bSign = (b & 0x8000) !== 0
  const rSign = (result & 0x8000) !== 0

  state.flags.Z = result === 0
  state.flags.N = rSign
  state.flags.C = full > 0xFFFF
  state.flags.V = (!aSign && !bSign && rSign) || (aSign && bSign && !rSign)
}

/**
 * SUB / CMP 命令後のフラグ更新。
 *
 * - C：ARM 系と同じく「ボローの否定」ではなく素直に `a < b` をセット。学習用に挙動を単純化。
 * - V：符号が逆のオペランド同士で、結果が a の符号と逆になったとき発生。
 */
function updateFlagsSub(state: MutableCpuState, a: number, b: number, result: number): void {
  const aSign = (a & 0x8000) !== 0
  const bSign = (b & 0x8000) !== 0
  const rSign = (result & 0x8000) !== 0

  state.flags.Z = result === 0
  state.flags.N = rSign
  state.flags.C = a < b
  state.flags.V = (aSign && !bSign && !rSign) || (!aSign && bSign && rSign)
}

/** 論理演算（AND/OR/XOR/NOT/SHL/SHR）後のフラグ更新。C と V はクリア固定。 */
function updateFlagsLogic(state: MutableCpuState, result: number): void {
  state.flags.Z = result === 0
  state.flags.N = (result & 0x8000) !== 0
  state.flags.C = false
  state.flags.V = false
}

/**
 * 1 命令を実行して `state` を破壊的に更新する。
 *
 * PC のインクリメントはここでは行わない（呼び出し側 `Cpu.stepForward()` が
 * ジャンプ系命令以外について +1 する）。ジャンプ系（BEQ/BNE/BLT/BGT/BLE/BGE/JMP/CALL/RET）は
 * ここで直接 `state.pc` を書き換える。
 *
 * 命令のオペランド型は本来パーサーが保証しているが、命令種別ごとに `if (... .type !== ...)` で
 * 型ガードすることで判別共用体の絞り込みと、想定外データへの安全弁を兼ねている。
 */
export function executeInstruction(instr: Instruction, state: MutableCpuState): void {
  switch (instr.type) {
    case 'MOV': {
      const [dst, src] = instr.operands
      if (dst.type !== 'register') break
      const value = src.type === 'immediate'
        ? src.value
        : src.type === 'register'
          ? readRegister(state, src.name)
          : 0
      setRegister(state, dst.name, value)
      break
    }

    case 'ADD': {
      const [dst, op1, op2] = instr.operands
      if (dst.type !== 'register' || op1.type !== 'register') break
      const a = readRegister(state, op1.name)
      const b = readRegOrImm(state, op2)
      const full = a + b
      const result = full & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsAdd(state, a, b, result, full)
      break
    }

    case 'SUB': {
      const [dst, op1, op2] = instr.operands
      if (dst.type !== 'register' || op1.type !== 'register') break
      const a = readRegister(state, op1.name)
      const b = readRegOrImm(state, op2)
      const result = (a - b) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsSub(state, a, b, result)
      break
    }

    case 'LOAD': {
      const [dst, src] = instr.operands
      if (dst.type !== 'register') break
      let address = 0
      if (src.type === 'memory_direct') address = src.address
      else if (src.type === 'memory_register') address = readRegister(state, src.register) + src.offset
      setRegister(state, dst.name, state.memory.read(address))
      break
    }

    case 'STORE': {
      const [src, dst] = instr.operands
      if (src.type !== 'register') break
      let address = 0
      if (dst.type === 'memory_direct') address = dst.address
      else if (dst.type === 'memory_register') address = readRegister(state, dst.register) + dst.offset
      state.memory.write(address, readRegister(state, src.name))
      break
    }

    case 'CMP': {
      const [op1, op2] = instr.operands
      if (op1.type !== 'register') break
      const a = readRegister(state, op1.name)
      const b = readRegOrImm(state, op2)
      const result = (a - b) & 0xFFFF
      updateFlagsSub(state, a, b, result)
      break
    }

    case 'BEQ':
      if (state.flags.Z) state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break
    case 'BNE':
      if (!state.flags.Z) state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break
    case 'BLT':
      if (state.flags.N && !state.flags.V) state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break
    case 'BGT':
      if (!state.flags.Z && state.flags.N === state.flags.V) state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break
    case 'BLE':
      if (state.flags.Z || state.flags.N !== state.flags.V) state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break
    case 'BGE':
      if (state.flags.N === state.flags.V) state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break
    case 'JMP':
      state.pc = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      break

    case 'CALL': {
      // LR には「呼び出し命令の次の命令インデックス」を入れる。RET でここに戻る。
      // ネストした関数呼び出しでは LR が上書きされるため、上位の関数が手動で PUSH/POP する必要がある。
      const target = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      state.lr = state.pc + 1
      state.pc = target
      break
    }

    case 'RET':
      state.pc = state.lr
      break

    case 'PUSH': {
      // 先にデクリメントしてから書く（フルディセンディングスタック）。
      // SP を 2 ずつ動かすのは仕様上の取り決め（1 ワードは 16bit だが byte 換算の流儀を踏襲）。
      const [src] = instr.operands
      if (src.type !== 'register') break
      state.sp = (state.sp - 2) & 0xFFFF
      state.memory.write(state.sp, readRegister(state, src.name))
      break
    }

    case 'POP': {
      // 先に読んでからインクリメント。PUSH と対称になる。
      const [dst] = instr.operands
      if (dst.type !== 'register') break
      const value = state.memory.read(state.sp)
      state.sp = (state.sp + 2) & 0xFFFF
      setRegister(state, dst.name, value)
      break
    }

    case 'AND': {
      const [dst, op1, op2] = instr.operands
      if (dst.type !== 'register' || op1.type !== 'register' || op2.type !== 'register') break
      const result = (readRegister(state, op1.name) & readRegister(state, op2.name)) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsLogic(state, result)
      break
    }

    case 'OR': {
      const [dst, op1, op2] = instr.operands
      if (dst.type !== 'register' || op1.type !== 'register' || op2.type !== 'register') break
      const result = (readRegister(state, op1.name) | readRegister(state, op2.name)) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsLogic(state, result)
      break
    }

    case 'XOR': {
      const [dst, op1, op2] = instr.operands
      if (dst.type !== 'register' || op1.type !== 'register' || op2.type !== 'register') break
      const result = (readRegister(state, op1.name) ^ readRegister(state, op2.name)) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsLogic(state, result)
      break
    }

    case 'NOT': {
      const [dst, src] = instr.operands
      if (dst.type !== 'register' || src.type !== 'register') break
      const result = (~readRegister(state, src.name)) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsLogic(state, result)
      break
    }

    case 'SHL': {
      const [dst, src, n] = instr.operands
      if (dst.type !== 'register' || src.type !== 'register' || n.type !== 'immediate') break
      const result = (readRegister(state, src.name) << n.value) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsLogic(state, result)
      break
    }

    case 'SHR': {
      const [dst, src, n] = instr.operands
      if (dst.type !== 'register' || src.type !== 'register' || n.type !== 'immediate') break
      const result = (readRegister(state, src.name) >>> n.value) & 0xFFFF
      setRegister(state, dst.name, result)
      updateFlagsLogic(state, result)
      break
    }

    case 'HALT':
      state.halted = true
      break

    default: {
      const _: never = instr.type
      throw new Error(`Unimplemented instruction: ${String(_)}`)
    }
  }
}
