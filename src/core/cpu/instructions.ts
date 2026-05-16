import type { Instruction, Registers, Flags, AnyRegisterName, RuntimeError } from './types.ts'
import type { Memory } from './memory.ts'

export const USER_MEM_MAX = 0x3F

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

function readRegister(state: MutableCpuState, name: AnyRegisterName): number {
  switch (name) {
    case 'R0': return 0
    case 'R1': return state.registers.R1
    case 'R2': return state.registers.R2
    case 'R3': return state.registers.R3
    case 'R4': return state.registers.R4
    case 'R5': return state.registers.R5
    case 'LR': return state.lr
    case 'SP': return state.sp
    case 'PC': return state.pc
  }
}

export function setRegister(state: MutableCpuState, name: AnyRegisterName, value: number): void {
  const masked = value & 0xFFFF
  switch (name) {
    case 'R0': return // 書き込み破棄
    case 'R1': state.registers.R1 = masked; return
    case 'R2': state.registers.R2 = masked; return
    case 'R3': state.registers.R3 = masked; return
    case 'R4': state.registers.R4 = masked; return
    case 'R5': state.registers.R5 = masked; return
    case 'LR': state.lr = masked; return
    case 'SP': state.sp = masked; return
    case 'PC': state.pc = masked; return
  }
}

function updateFlagsAdd(state: MutableCpuState, a: number, b: number, result: number, full: number): void {
  const aSign = (a & 0x8000) !== 0
  const bSign = (b & 0x8000) !== 0
  const rSign = (result & 0x8000) !== 0

  state.flags.Z = result === 0
  state.flags.N = rSign
  state.flags.C = full > 0xFFFF
  state.flags.V = (!aSign && !bSign && rSign) || (aSign && bSign && !rSign)
}

function updateFlagsSub(state: MutableCpuState, a: number, b: number, result: number): void {
  const aSign = (a & 0x8000) !== 0
  const bSign = (b & 0x8000) !== 0
  const rSign = (result & 0x8000) !== 0

  state.flags.Z = result === 0
  state.flags.N = rSign
  state.flags.C = a < b // ボロー発生
  state.flags.V = (aSign && !bSign && !rSign) || (!aSign && bSign && rSign)
}

function updateFlagsLogic(state: MutableCpuState, result: number): void {
  state.flags.Z = result === 0
  state.flags.N = (result & 0x8000) !== 0
  state.flags.C = false
  state.flags.V = false
}

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
      const b = op2.type === 'immediate' ? op2.value : readRegister(state, op2.name as AnyRegisterName)
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
      const b = op2.type === 'immediate' ? op2.value : readRegister(state, op2.name as AnyRegisterName)
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
      const b = op2.type === 'immediate' ? op2.value : readRegister(state, op2.name as AnyRegisterName)
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
      const target = instr.operands[0].type === 'immediate' ? instr.operands[0].value : state.pc
      state.lr = state.pc + 1 // 次の命令アドレス（命令インデックスベース）
      state.pc = target
      break
    }

    case 'RET':
      state.pc = state.lr
      break

    case 'PUSH': {
      const [src] = instr.operands
      if (src.type !== 'register') break
      state.sp = (state.sp - 2) & 0xFFFF
      state.memory.write(state.sp, readRegister(state, src.name))
      break
    }

    case 'POP': {
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
