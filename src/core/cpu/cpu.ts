import type {
  CpuSnapshot,
  Registers,
  Flags,
  Instruction,
  InstructionType,
  ParseError,
  ExecutionResult,
  AnyRegisterName,
} from './types.ts'
import { Memory } from './memory.ts'
import { executeInstruction } from './instructions.ts'
import type { MutableCpuState } from './instructions.ts'
import { tokenize } from '../assembler/lexer.ts'
import { parse } from '../assembler/parser.ts'

/**
 * 巻き戻し用に保持するスナップショットの上限件数。
 * 上限到達後は古いものから捨てる（≒ 直近 1000 ステップは戻れる）。
 */
const MAX_HISTORY = 1000

/** 汎用レジスタを 0 初期化したオブジェクトを返す。 */
function createInitialRegisters(): Registers {
  return { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0 }
}

/** フラグを全て false に初期化する。 */
function createInitialFlags(): Flags {
  return { N: false, Z: false, C: false, V: false }
}

/**
 * 命令内で PC を直接書き換える命令の集合。
 * これに含まれる命令の後は PC を自動インクリメントしない（命令自身が次の PC を決める）。
 */
const JUMP_INSTRUCTIONS: Set<InstructionType> = new Set([
  'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET',
])

/** 2つのスナップショットを比較して、値が変わったレジスタ名のリストを返す。 */
function diffRegisters(before: CpuSnapshot, after: CpuSnapshot): AnyRegisterName[] {
  const changed: AnyRegisterName[] = []
  const regNames: AnyRegisterName[] = ['R0', 'R1', 'R2', 'R3', 'R4']
  for (const name of regNames) {
    if (before.registers[name] !== after.registers[name]) {
      changed.push(name)
    }
  }
  if (before.lr !== after.lr) changed.push('LR')
  if (before.sp !== after.sp) changed.push('SP')
  if (before.pc !== after.pc) changed.push('PC')
  return changed
}

/** 2つのスナップショットを比較して、状態が変わったフラグ名のリストを返す。 */
function diffFlags(before: CpuSnapshot, after: CpuSnapshot): (keyof Flags)[] {
  const changed: (keyof Flags)[] = []
  for (const flag of ['N', 'Z', 'C', 'V'] as (keyof Flags)[]) {
    if (before.flags[flag] !== after.flags[flag]) {
      changed.push(flag)
    }
  }
  return changed
}

/**
 * 2つのスナップショットを比較して、値が変わったメモリアドレスのリストを返す。
 * 全ワード走査する素朴な実装（64K 程度なら 1 ステップ毎に走らせても許容範囲）。
 */
function diffMemory(before: CpuSnapshot, after: CpuSnapshot): number[] {
  const changed: number[] = []
  for (let i = 0; i < before.memory.length; i++) {
    if (before.memory[i] !== after.memory[i]) {
      changed.push(i)
    }
  }
  return changed
}

/**
 * ARCH-0 CPU の中核クラス。
 *
 * 命令ストリーム（`Instruction[]`）と実行状態（レジスタ・フラグ・メモリ・PC/SP/LR）を保持し、
 * `stepForward()` / `stepBackward()` で 1 ステップ単位の前進・巻き戻しを提供する。
 *
 * 設計上の重要点：
 * - PC は **命令インデックス**（0始まり）であり、バイトアドレスではない。
 * - 命令メモリと `LOAD`/`STORE` 用のデータメモリは分離している（`_instructions` と `_memory`）。
 * - 履歴は最大 `MAX_HISTORY` 件で、巻き戻し後に `stepForward()` するとそれより未来の履歴は破棄される。
 */
export class Cpu {
  private _instructions: Instruction[] = []
  private _labels: Map<string, number> = new Map()
  private _parseErrors: ParseError[] = []

  private _memory: Memory
  private _registers: Registers
  private _flags: Flags
  private _pc: number
  private _sp: number
  private _lr: number
  private _halted: boolean

  /** 履歴本体。`_history[_historyIndex]` が「いま」の状態。 */
  private _history: CpuSnapshot[]
  private _historyIndex: number
  /** ステージのクリア判定 `instruction_used` のため、実行した命令種別を集合で保持。 */
  private _instructionsUsed: Set<InstructionType>

  constructor() {
    this._memory = new Memory()
    this._registers = createInitialRegisters()
    this._flags = createInitialFlags()
    this._pc = 0
    // SP の初期位置はメモリ末尾近辺。PUSH 時に先にデクリメントするため奇数アライメントを避けて 0xFFFE。
    this._sp = 0xFFFE
    this._lr = 0
    this._halted = false
    this._history = []
    this._historyIndex = -1
    this._instructionsUsed = new Set()
  }

  /**
   * レジスタ・メモリ・フラグ・履歴を初期状態に戻す。
   * `initialMemory` `initialRegisters` でステージ固有の初期値を与えられる。
   */
  private resetState(
    initialMemory?: Array<{ address: number; value: number }>,
    initialRegisters?: Partial<Registers>,
  ): void {
    this._memory = new Memory()
    if (initialMemory) {
      for (const { address, value } of initialMemory) {
        this._memory.write(address, value)
      }
    }
    this._registers = createInitialRegisters()
    if (initialRegisters) {
      const keys = Object.keys(initialRegisters) as Array<keyof typeof initialRegisters>
      for (const key of keys) {
        const value = initialRegisters[key]
        if (value !== undefined) this._registers[key] = value & 0xFFFF
      }
    }
    this._flags = createInitialFlags()
    this._pc = 0
    this._sp = 0xFFFE
    this._lr = 0
    this._halted = false
    this._history = []
    this._historyIndex = -1
    this._instructionsUsed = new Set()
  }

  /**
   * 現在の状態を完全コピーしたスナップショットを生成する。
   * `memory` は `clone()` で新しい配列を作るため、過去の履歴が後の書き込みで壊れない。
   */
  private captureSnapshot(stepIndex: number): CpuSnapshot {
    return {
      registers: { ...this._registers },
      memory: this._memory.clone(),
      flags: { ...this._flags },
      pc: this._pc,
      sp: this._sp,
      lr: this._lr,
      halted: this._halted,
      stepIndex,
      instructionsUsed: [...this._instructionsUsed],
    }
  }

  /**
   * スナップショットから状態を復元する（巻き戻し用）。
   * `memory` は配列の内容だけを書き戻すため、`_memory` の参照は変えない。
   */
  private restoreSnapshot(snap: CpuSnapshot): void {
    this._registers = { ...snap.registers }
    this._memory.loadSnapshot(snap.memory)
    this._flags = { ...snap.flags }
    this._pc = snap.pc
    this._sp = snap.sp
    this._lr = snap.lr
    this._halted = snap.halted
    this._instructionsUsed = new Set(snap.instructionsUsed)
  }

  /**
   * 履歴へ新しいスナップショットを追加する。
   *
   * 巻き戻し後に新しいステップを実行した場合、それより先の未来履歴は破棄する
   * （タイムラインが分岐しても保持しない方針）。最大件数を超えたら古い方から落とす。
   */
  private pushHistory(snap: CpuSnapshot): void {
    if (this._historyIndex < this._history.length - 1) {
      this._history.splice(this._historyIndex + 1)
    }
    this._history.push(snap)
    this._historyIndex++

    if (this._history.length > MAX_HISTORY) {
      this._history.shift()
      this._historyIndex--
    }
  }

  /**
   * ソースコードをパース・ロードして CPU を実行準備状態にする。
   *
   * @param source              アセンブラのソース文字列。
   * @param allowedInstructions 章ごとに開放された命令の集合（未指定なら全許可）。
   * @param initialMemory       ステージ固有の初期メモリ値。
   * @param initialRegisters    ステージ固有の初期レジスタ値（基本的には `MOV` で書く方針）。
   */
  load(
    source: string,
    allowedInstructions?: InstructionType[],
    initialMemory?: Array<{ address: number; value: number }>,
    initialRegisters?: Partial<Registers>,
  ): void {
    const { tokens, errors: lexErrors } = tokenize(source)
    const { instructions, labels, errors: parseErrors } = parse(tokens, allowedInstructions)

    this._instructions = instructions
    this._labels = labels
    this._parseErrors = [
      ...lexErrors.map(e => ({ line: e.line, column: e.column, message: e.message })),
      ...parseErrors,
    ]

    this.resetState(initialMemory, initialRegisters)
    const initialSnap = this.captureSnapshot(0)
    this._history = [initialSnap]
    this._historyIndex = 0
  }

  /** 現在の CPU 状態を新しいスナップショットとして返す。 */
  get snapshot(): CpuSnapshot {
    return this.captureSnapshot(this._historyIndex)
  }

  /** 1ステップ前のスナップショット。冒頭ステップでは null。差分ハイライト表示用。 */
  get previousSnapshot(): CpuSnapshot | null {
    if (this._historyIndex <= 0) return null
    return this._history[this._historyIndex - 1]
  }

  /** ロード時に検出されたパース／レックスエラーの一覧。 */
  get errors(): ParseError[] {
    return this._parseErrors
  }

  /** ラベル名（大文字正規化済み）→ 命令インデックスのマップ。 */
  get labels(): Map<string, number> {
    return this._labels
  }

  /** 次に実行される命令のソース行番号（1始まり）。なければ null */
  get currentSourceLine(): number | null {
    return this._instructions[this._pc]?.sourceLine ?? null
  }

  /** ソース行番号（1始まり）→ 命令インデックス（PC値） のマップ */
  get lineToPc(): Map<number, number> {
    const map = new Map<number, number>()
    this._instructions.forEach((instr, idx) => {
      map.set(instr.sourceLine, idx)
    })
    return map
  }

  /**
   * 1 命令を実行する。
   *
   * 流れ：
   * 1. HALT 済み・命令列終端なら何もせず差分なしの結果を返す。
   * 2. 現在状態をスナップショットして「実行前」を保存。
   * 3. ジャンプ系命令かを判定し、`MutableCpuState` を作って `executeInstruction()` を呼ぶ。
   * 4. ジャンプ系で PC を変えなかった場合（条件分岐不成立）、または非ジャンプ命令の場合は PC を +1。
   * 5. 「実行後」スナップショットを履歴に積み、差分情報を返す。
   */
  stepForward(): ExecutionResult {
    if (this._halted || this._pc >= this._instructions.length) {
      const snap = this.captureSnapshot(this._historyIndex)
      return {
        snapshot: snap,
        changedRegisters: [],
        changedMemoryAddresses: [],
        changedFlags: [],
      }
    }

    const before = this.captureSnapshot(this._historyIndex)
    const instr = this._instructions[this._pc]
    const isJump = JUMP_INSTRUCTIONS.has(instr.type)
    const pcBeforeExec = this._pc

    // executeInstruction に渡す可変ビュー。参照型（memory）と値型（pc/sp/lr/halted）を1箇所に束ねる。
    const state: MutableCpuState = {
      registers: this._registers,
      flags: this._flags,
      memory: this._memory,
      pc: this._pc,
      sp: this._sp,
      lr: this._lr,
      halted: this._halted,
    }

    this._instructionsUsed.add(instr.type)
    executeInstruction(instr, state)

    // state への変更を反映
    this._registers = state.registers
    this._flags = state.flags
    this._pc = state.pc
    this._sp = state.sp
    this._lr = state.lr
    this._halted = state.halted

    // ジャンプ命令以外、または条件分岐が不成立（PC が動かなかった）ケースは PC を進める。
    // HALT 状態なら次の命令には進ませない。
    if (!this._halted && (!isJump || this._pc === pcBeforeExec)) {
      this._pc++
    }

    const after = this.captureSnapshot(this._historyIndex + 1)
    this.pushHistory(after)

    return {
      snapshot: after,
      changedRegisters: diffRegisters(before, after),
      changedMemoryAddresses: diffMemory(before, after),
      changedFlags: diffFlags(before, after),
      executedType: instr.type,
      error: state.error,
    }
  }

  /**
   * 1 ステップ巻き戻す。
   * 履歴の先頭にいる場合は null を返す。これ以上戻れないことを UI に伝えるため。
   */
  stepBackward(): CpuSnapshot | null {
    if (this._historyIndex <= 0) return null

    this._historyIndex--
    const snap = this._history[this._historyIndex]
    this.restoreSnapshot(snap)
    return snap
  }

  /**
   * HALT または命令列終端、あるいは `maxSteps` 回に達するまで連続実行する。
   * 上限ステップ数は無限ループ保護のため必須。
   */
  runAll(maxSteps = 10000): ExecutionResult {
    let last: ExecutionResult = {
      snapshot: this.captureSnapshot(this._historyIndex),
      changedRegisters: [],
      changedMemoryAddresses: [],
      changedFlags: [],
    }

    for (let i = 0; i < maxSteps; i++) {
      if (this._halted || this._pc >= this._instructions.length) break
      last = this.stepForward()
    }

    return last
  }

  /**
   * 履歴の先頭（ロード直後の状態）に戻す。
   * 命令列・ラベル・パースエラーはロード時のまま保持し、ステップだけリセットする。
   */
  reset(): void {
    if (this._history.length === 0) return
    const initial = this._history[0]
    this.restoreSnapshot(initial)
    this._historyIndex = 0
  }
}

/**
 * ソースをロードして最後まで実行し、最終結果を返す便利関数。
 * テストやスナップショット用途で多用するため公開している。
 */
export function execute(source: string, allowedInstructions?: InstructionType[]): ExecutionResult {
  const cpu = new Cpu()
  cpu.load(source, allowedInstructions)
  return cpu.runAll()
}
