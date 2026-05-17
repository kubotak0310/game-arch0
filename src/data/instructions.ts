import type { InstructionType } from '../core/cpu/types.ts'

export interface InstructionInfo {
  syntax: string
  desc: string
}

export const INSTRUCTION_INFO: Record<InstructionType, InstructionInfo> = {
  MOV:   { syntax: 'MOV Rd, Rs / Rd, imm',  desc: 'レジスタに値をコピー' },
  ADD:   { syntax: 'ADD Rd, Rs1, Rs2',       desc: '加算: Rd = Rs1 + Rs2' },
  SUB:   { syntax: 'SUB Rd, Rs1, Rs2',       desc: '減算: Rd = Rs1 - Rs2' },
  LOAD:  { syntax: 'LOAD Rd, [addr]',        desc: 'メモリから読み込み: Rd = mem[addr]' },
  STORE: { syntax: 'STORE Rs, [addr]',       desc: 'メモリに書き込み: mem[addr] = Rs' },
  CMP:   { syntax: 'CMP Rs1, Rs2',           desc: 'Rs1 - Rs2 を計算しフラグを更新（等しければ Z=1）' },
  BEQ:   { syntax: 'BEQ label',              desc: '等しければ(Z==1) label へジャンプ' },
  BNE:   { syntax: 'BNE label',              desc: '等しくなければ(Z==0) label へジャンプ' },
  BLT:   { syntax: 'BLT label',              desc: 'より小さければ label へジャンプ' },
  BGT:   { syntax: 'BGT label',              desc: 'より大きければ label へジャンプ' },
  BLE:   { syntax: 'BLE label',              desc: '以下なら label へジャンプ' },
  BGE:   { syntax: 'BGE label',              desc: '以上なら label へジャンプ' },
  JMP:   { syntax: 'JMP label',              desc: '無条件で label へジャンプ' },
  CALL:  { syntax: 'CALL label',             desc: 'サブルーチン呼び出し（戻り先を LR に保存）' },
  RET:   { syntax: 'RET',                    desc: 'サブルーチンから返る（LR へジャンプ）' },
  PUSH:  { syntax: 'PUSH Rs',                desc: 'スタックに Rs を積む' },
  POP:   { syntax: 'POP Rd',                 desc: 'スタックから取り出して Rd に格納' },
  AND:   { syntax: 'AND Rd, Rs1, Rs2',       desc: 'ビット AND: Rd = Rs1 & Rs2' },
  OR:    { syntax: 'OR Rd, Rs1, Rs2',        desc: 'ビット OR: Rd = Rs1 | Rs2' },
  XOR:   { syntax: 'XOR Rd, Rs1, Rs2',       desc: 'ビット XOR: Rd = Rs1 ^ Rs2' },
  NOT:   { syntax: 'NOT Rd, Rs',             desc: 'ビット反転: Rd = ~Rs' },
  SHL:   { syntax: 'SHL Rd, Rs, n',          desc: '左シフト: Rd = Rs << n' },
  SHR:   { syntax: 'SHR Rd, Rs, n',          desc: '右シフト: Rd = Rs >> n' },
  HALT:  { syntax: 'HALT',                   desc: 'プログラムを停止' },
}

export function getInstructionInfo(op: string): InstructionInfo {
  return INSTRUCTION_INFO[op as InstructionType] ?? { syntax: op, desc: '' }
}
