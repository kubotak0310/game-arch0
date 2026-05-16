export interface CpuSnapshot {
  registers: Registers
  memory: Uint16Array
  flags: Flags
  pc: number
  sp: number
  lr: number
  halted: boolean
  stepIndex: number
}

export interface Registers {
  R0: 0
  R1: number
  R2: number
  R3: number
  R4: number
  R5: number
}

export interface Flags {
  N: boolean
  Z: boolean
  C: boolean
  V: boolean
}

export type InstructionType =
  | 'MOV' | 'ADD' | 'SUB'
  | 'LOAD' | 'STORE'
  | 'CMP' | 'BEQ' | 'BNE' | 'BLT' | 'BGT' | 'BLE' | 'BGE' | 'JMP'
  | 'CALL' | 'RET' | 'PUSH' | 'POP'
  | 'AND' | 'OR' | 'XOR' | 'NOT' | 'SHL' | 'SHR'
  | 'HALT'

export type RegisterName = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
export type ControlRegisterName = 'LR' | 'SP' | 'PC'
export type AnyRegisterName = RegisterName | ControlRegisterName

export type Operand =
  | { type: 'register'; name: AnyRegisterName }
  | { type: 'immediate'; value: number }
  | { type: 'memory_direct'; address: number }
  | { type: 'memory_register'; register: AnyRegisterName; offset: number }
  | { type: 'label'; name: string }

export interface Instruction {
  type: InstructionType
  operands: Operand[]
  sourceLine: number
  sourceText: string
}

export interface ParseResult {
  instructions: Instruction[]
  labels: Map<string, number>
  errors: ParseError[]
}

export interface ParseError {
  line: number
  column?: number
  message: { ja: string; en: string }
  suggestion?: { ja: string; en: string }
}

export interface ExecutionResult {
  snapshot: CpuSnapshot
  changedRegisters: AnyRegisterName[]
  changedMemoryAddresses: number[]
  changedFlags: (keyof Flags)[]
  executedType?: InstructionType
  error?: RuntimeError
}

export interface RuntimeError {
  type: 'infinite_loop' | 'stack_overflow' | 'invalid_address' | 'division_by_zero'
  message: { ja: string; en: string }
  line?: number
}
