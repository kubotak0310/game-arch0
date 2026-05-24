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

const MAX_HISTORY = 1000

function createInitialRegisters(): Registers {
  return { R0: 0, R1: 0, R2: 0, R3: 0, R4: 0 }
}

function createInitialFlags(): Flags {
  return { N: false, Z: false, C: false, V: false }
}

// ジャンプ系命令かどうか（PC を命令内で書き換えるもの）
const JUMP_INSTRUCTIONS: Set<InstructionType> = new Set([
  'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP', 'CALL', 'RET',
])

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

function diffFlags(before: CpuSnapshot, after: CpuSnapshot): (keyof Flags)[] {
  const changed: (keyof Flags)[] = []
  for (const flag of ['N', 'Z', 'C', 'V'] as (keyof Flags)[]) {
    if (before.flags[flag] !== after.flags[flag]) {
      changed.push(flag)
    }
  }
  return changed
}

function diffMemory(before: CpuSnapshot, after: CpuSnapshot): number[] {
  const changed: number[] = []
  for (let i = 0; i < before.memory.length; i++) {
    if (before.memory[i] !== after.memory[i]) {
      changed.push(i)
    }
  }
  return changed
}

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

  private _history: CpuSnapshot[]
  private _historyIndex: number
  private _instructionsUsed: Set<InstructionType>

  constructor() {
    this._memory = new Memory()
    this._registers = createInitialRegisters()
    this._flags = createInitialFlags()
    this._pc = 0
    this._sp = 0xFFFE
    this._lr = 0
    this._halted = false
    this._history = []
    this._historyIndex = -1
    this._instructionsUsed = new Set()
  }

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

  private pushHistory(snap: CpuSnapshot): void {
    // 現在位置より先の履歴を破棄（巻き戻し後の分岐）
    if (this._historyIndex < this._history.length - 1) {
      this._history.splice(this._historyIndex + 1)
    }
    this._history.push(snap)
    this._historyIndex++

    // 最大履歴数を超えたら先頭を削除
    if (this._history.length > MAX_HISTORY) {
      this._history.shift()
      this._historyIndex--
    }
  }

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

  get snapshot(): CpuSnapshot {
    return this.captureSnapshot(this._historyIndex)
  }

  get previousSnapshot(): CpuSnapshot | null {
    if (this._historyIndex <= 0) return null
    return this._history[this._historyIndex - 1]
  }

  get errors(): ParseError[] {
    return this._parseErrors
  }

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

  stepForward(): ExecutionResult {
    // HALT済みまたは命令列の終端ならそのまま返す
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

    // 命令を実行するための可変状態ビュー
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

    // ジャンプ命令以外はPCをインクリメント
    // 条件付き分岐が成立しなかった場合（PCが変わらなかった場合）もインクリメント
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

  stepBackward(): CpuSnapshot | null {
    if (this._historyIndex <= 0) return null

    this._historyIndex--
    const snap = this._history[this._historyIndex]
    this.restoreSnapshot(snap)
    return snap
  }

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

  reset(): void {
    if (this._history.length === 0) return
    const initial = this._history[0]
    this.restoreSnapshot(initial)
    this._historyIndex = 0
  }
}

export function execute(source: string, allowedInstructions?: InstructionType[]): ExecutionResult {
  const cpu = new Cpu()
  cpu.load(source, allowedInstructions)
  return cpu.runAll()
}
