import type { Token } from './types.ts'
import type {
  InstructionType,
  Instruction,
  Operand,
  ParseResult,
  ParseError,
  AnyRegisterName,
} from '../cpu/types.ts'

// タイポ修正候補を探すため編集距離（Levenshtein）を計算
function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  return dp[m][n]
}

const KNOWN_MNEMONICS: InstructionType[] = [
  'MOV', 'ADD', 'SUB',
  'LOAD', 'STORE',
  'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP',
  'CALL', 'RET', 'PUSH', 'POP',
  'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR',
  'HALT',
]

function findSuggestion(typo: string): string | null {
  let best: string | null = null
  let bestDist = Infinity
  for (const m of KNOWN_MNEMONICS) {
    const d = editDistance(typo, m)
    if (d < bestDist) {
      bestDist = d
      best = m
    }
  }
  return bestDist <= 2 ? best : null
}

function isRegisterName(value: string): value is AnyRegisterName {
  return ['R0', 'R1', 'R2', 'R3', 'R4', 'LR', 'SP', 'PC'].includes(value)
}

// トークン列をパースするためのカーソル
class TokenCursor {
  private pos: number = 0
  constructor(private readonly tokens: Token[]) {}

  peek(): Token {
    return this.tokens[this.pos] ?? { kind: 'EOF', value: '', line: 0, column: 0 }
  }

  advance(): Token {
    const t = this.peek()
    if (t.kind !== 'EOF') this.pos++
    return t
  }

  // 現在行のトークンを全て取得してカーソルを NEWLINE/EOF の次に進める
  consumeLine(): Token[] {
    const line: Token[] = []
    while (this.peek().kind !== 'NEWLINE' && this.peek().kind !== 'EOF') {
      line.push(this.advance())
    }
    if (this.peek().kind === 'NEWLINE') this.advance() // NEWLINE を消費
    return line
  }
}

// 行内トークン列からオペランドを取り出す小さなパーサー
class LineParser {
  private pos: number = 0
  constructor(
    private readonly tokens: Token[],
    private readonly errors: ParseError[],
  ) {}

  peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  advance(): Token | undefined {
    return this.tokens[this.pos++]
  }

  expectRegister(): AnyRegisterName | null {
    const t = this.peek()
    if (!t) {
      // エラーは呼び出し元が追加
      return null
    }
    if (t.kind !== 'REGISTER') return null
    this.advance()
    return t.value as AnyRegisterName
  }

  expectComma(lineNum: number): boolean {
    const t = this.peek()
    if (!t || t.kind !== 'COMMA') {
      const col = t?.column ?? 0
      this.errors.push({
        line: lineNum,
        column: col,
        message: {
          ja: 'カンマが必要です。例: MOV R1, 2',
          en: 'A comma is required. Example: MOV R1, 2',
        },
      })
      return false
    }
    this.advance()
    return true
  }

  parseOperand(lineNum: number, allowLabel = false): Operand | null {
    const t = this.peek()
    if (!t) return null

    if (t.kind === 'REGISTER') {
      this.advance()
      return { type: 'register', name: t.value as AnyRegisterName }
    }

    if (t.kind === 'IMMEDIATE') {
      this.advance()
      const value = parseInt(t.value, 10)
      if (value < -32768 || value > 65535) {
        this.errors.push({
          line: lineNum,
          column: t.column,
          message: {
            ja: `即値が範囲外です (${value})。16ビット整数 (0〜65535 または -32768〜32767) を使用してください。`,
            en: `Immediate value out of range (${value}). Use a 16-bit integer (0–65535 or -32768–32767).`,
          },
        })
        return null
      }
      const masked = value < 0 ? (value + 65536) & 0xFFFF : value & 0xFFFF
      return { type: 'immediate', value: masked }
    }

    if (t.kind === 'LBRACKET') {
      this.advance() // '['
      const next = this.peek()

      // [imm] — 直接アドレス指定: LOAD R1, [0x10]
      if (next?.kind === 'IMMEDIATE') {
        this.advance()
        const addr = parseInt(next.value, 10)
        const rbracket = this.peek()
        if (!rbracket || rbracket.kind !== 'RBRACKET') {
          this.errors.push({
            line: lineNum,
            column: rbracket?.column ?? 0,
            message: { ja: '] が必要です', en: 'Expected ]' },
          })
          return null
        }
        this.advance()
        return { type: 'memory_direct', address: addr & 0xFFFF }
      }

      const reg = this.expectRegister()
      if (reg === null) {
        const regNext = this.peek()
        this.errors.push({
          line: lineNum,
          column: regNext?.column ?? t.column,
          message: {
            ja: '[ の後にレジスタまたは即値アドレスが必要です。例: [R1] または [0x10]',
            en: 'A register or immediate address is required after [. Example: [R1] or [0x10]',
          },
        })
        return null
      }
      // オフセットあり: [Rs + n]
      if (this.peek()?.kind === 'PLUS') {
        this.advance() // '+'
        const offsetTok = this.peek()
        if (!offsetTok || offsetTok.kind !== 'IMMEDIATE') {
          this.errors.push({
            line: lineNum,
            column: offsetTok?.column ?? 0,
            message: {
              ja: '+ の後に即値オフセットが必要です。例: [R1 + 4]',
              en: 'An immediate offset is required after +. Example: [R1 + 4]',
            },
          })
          return null
        }
        this.advance()
        const offset = parseInt(offsetTok.value, 10)
        const rbracket = this.peek()
        if (!rbracket || rbracket.kind !== 'RBRACKET') {
          this.errors.push({
            line: lineNum,
            column: rbracket?.column ?? 0,
            message: { ja: '] が必要です', en: 'Expected ]' },
          })
          return null
        }
        this.advance()
        return { type: 'memory_register', register: reg, offset }
      }
      // オフセットなし: [Rs]
      const rbracket = this.peek()
      if (!rbracket || rbracket.kind !== 'RBRACKET') {
        this.errors.push({
          line: lineNum,
          column: rbracket?.column ?? 0,
          message: { ja: '] が必要です', en: 'Expected ]' },
        })
        return null
      }
      this.advance()
      return { type: 'memory_register', register: reg, offset: 0 }
    }

    // ニーモニック名（add, subなど）もラベル名として使える
    if (allowLabel && (t.kind === 'LABEL_REF' || t.kind === 'MNEMONIC')) {
      this.advance()
      return { type: 'label', name: t.value }
    }

    // 数値は lexer が IMMEDIATE として処理するので、ここには来ない
    return null
  }

  remaining(): number {
    return this.tokens.length - this.pos
  }
}

type RawInstruction = {
  type: InstructionType
  operands: Operand[]
  sourceLine: number
  sourceText: string
}

function parseLine(
  lineTokens: Token[],
  errors: ParseError[],
  allowedSet: Set<InstructionType> | null,
): RawInstruction | null {
  if (lineTokens.length === 0) return null

  const first = lineTokens[0]
  const lineNum = first.line

  // 最初のトークンはニーモニックか LABEL_DEF のはず
  // LABEL_DEF はカーソル層で消費済みのはずだが、行がラベルのみだった場合は空になる
  if (first.kind !== 'MNEMONIC') {
    errors.push({
      line: lineNum,
      column: first.column,
      message: {
        ja: `命令が必要な場所に '${first.value}' があります。`,
        en: `Expected an instruction mnemonic, but found '${first.value}'.`,
      },
    })
    return null
  }

  const mnemonicStr = first.value as InstructionType
  const sourceText = lineTokens.map(t => t.value).join(' ')

  // 未解放命令チェック
  if (allowedSet !== null && !allowedSet.has(mnemonicStr)) {
    errors.push({
      line: lineNum,
      column: first.column,
      message: {
        ja: `この命令はまだ使えません: ${mnemonicStr}`,
        en: `This instruction is not yet available: ${mnemonicStr}`,
      },
    })
    return null
  }

  const lp = new LineParser(lineTokens.slice(1), errors)

  const operands: Operand[] = []

  const parseResult = parseOperands(mnemonicStr, lp, lineNum, operands, errors, sourceText)
  if (!parseResult) return null

  return { type: mnemonicStr, operands, sourceLine: lineNum, sourceText }
}

function parseOperands(
  mnemonic: InstructionType,
  lp: LineParser,
  lineNum: number,
  operands: Operand[],
  errors: ParseError[],
  sourceText: string,
): boolean {
  switch (mnemonic) {
    case 'HALT':
    case 'RET':
      return true

    case 'MOV': {
      // MOV Rd, Rs  OR  MOV Rd, imm
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `MOV の第1オペランドにレジスタが必要です。例: MOV R1, 2`,
            en: `MOV requires a register as the first operand. Example: MOV R1, 2`,
          },
        })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const src = lp.parseOperand(lineNum)
      if (!src) {
        errors.push({
          line: lineNum, message: {
            ja: `MOV の第2オペランドにレジスタまたは即値が必要です。例: MOV R1, 2`,
            en: `MOV requires a register or immediate as the second operand. Example: MOV R1, 2`,
          },
        })
        return false
      }
      if (src.type !== 'register' && src.type !== 'immediate') {
        errors.push({
          line: lineNum, message: {
            ja: `MOV の第2オペランドはレジスタか即値である必要があります。`,
            en: `MOV's second operand must be a register or immediate.`,
          },
        })
        return false
      }
      operands.push(rd, src)
      return true
    }

    case 'ADD':
    case 'SUB': {
      // OP Rd, Rs1, Rs2  OR  OP Rd, Rs, imm
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `${mnemonic} の第1オペランドにレジスタが必要です。例: ${mnemonic} R1, R2, R3`,
            en: `${mnemonic} requires a register as the first operand. Example: ${mnemonic} R1, R2, R3`,
          },
        })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs1 = lp.parseOperand(lineNum)
      if (!rs1 || rs1.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `${mnemonic} の第2オペランドにレジスタが必要です。`,
            en: `${mnemonic} requires a register as the second operand.`,
          },
        })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs2 = lp.parseOperand(lineNum)
      if (!rs2 || (rs2.type !== 'register' && rs2.type !== 'immediate')) {
        errors.push({
          line: lineNum, message: {
            ja: `${mnemonic} の第3オペランドにレジスタまたは即値が必要です。`,
            en: `${mnemonic} requires a register or immediate as the third operand.`,
          },
        })
        return false
      }
      operands.push(rd, rs1, rs2)
      return true
    }

    case 'LOAD': {
      // LOAD Rd, [addr]  OR  LOAD Rd, [Rs]  OR  LOAD Rd, [Rs + n]
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `LOAD の第1オペランドにレジスタが必要です。例: LOAD R1, [R2]`,
            en: `LOAD requires a register as the first operand. Example: LOAD R1, [R2]`,
          },
        })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const mem = lp.parseOperand(lineNum)
      if (!mem || (mem.type !== 'memory_direct' && mem.type !== 'memory_register')) {
        errors.push({
          line: lineNum, message: {
            ja: `LOAD の第2オペランドにメモリアドレス ([...]) が必要です。例: LOAD R1, [R2]`,
            en: `LOAD requires a memory address ([...]) as the second operand. Example: LOAD R1, [R2]`,
          },
        })
        return false
      }
      operands.push(rd, mem)
      return true
    }

    case 'STORE': {
      const rs = lp.parseOperand(lineNum)
      if (!rs || rs.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `STORE の第1オペランドにレジスタが必要です。例: STORE R1, [R2]`,
            en: `STORE requires a register as the first operand. Example: STORE R1, [R2]`,
          },
        })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const mem = lp.parseOperand(lineNum)
      if (!mem || (mem.type !== 'memory_direct' && mem.type !== 'memory_register')) {
        errors.push({
          line: lineNum, message: {
            ja: `STORE の第2オペランドにメモリアドレス ([...]) が必要です。`,
            en: `STORE requires a memory address ([...]) as the second operand.`,
          },
        })
        return false
      }
      operands.push(rs, mem)
      return true
    }

    case 'CMP': {
      // CMP Rs1, Rs2  OR  CMP Rs, imm
      const rs1 = lp.parseOperand(lineNum)
      if (!rs1 || rs1.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `CMP の第1オペランドにレジスタが必要です。例: CMP R1, R2`,
            en: `CMP requires a register as the first operand. Example: CMP R1, R2`,
          },
        })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs2 = lp.parseOperand(lineNum)
      if (!rs2 || (rs2.type !== 'register' && rs2.type !== 'immediate')) {
        errors.push({
          line: lineNum, message: {
            ja: `CMP の第2オペランドにレジスタまたは即値が必要です。`,
            en: `CMP requires a register or immediate as the second operand.`,
          },
        })
        return false
      }
      operands.push(rs1, rs2)
      return true
    }

    case 'BEQ':
    case 'BNE':
    case 'BLT':
    case 'BGT':
    case 'BLE':
    case 'BGE':
    case 'JMP':
    case 'CALL': {
      const label = lp.parseOperand(lineNum, true)
      if (!label || label.type !== 'label') {
        errors.push({
          line: lineNum, message: {
            ja: `${mnemonic} にはラベルが必要です。例: ${mnemonic} loop_start`,
            en: `${mnemonic} requires a label. Example: ${mnemonic} loop_start`,
          },
        })
        return false
      }
      operands.push(label)
      return true
    }

    case 'PUSH': {
      const rs = lp.parseOperand(lineNum)
      if (!rs || rs.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `PUSH にはレジスタが必要です。例: PUSH R1`,
            en: `PUSH requires a register. Example: PUSH R1`,
          },
        })
        return false
      }
      operands.push(rs)
      return true
    }

    case 'POP': {
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({
          line: lineNum, message: {
            ja: `POP にはレジスタが必要です。例: POP R1`,
            en: `POP requires a register. Example: POP R1`,
          },
        })
        return false
      }
      operands.push(rd)
      return true
    }

    case 'AND':
    case 'OR':
    case 'XOR': {
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `${mnemonic} の第1オペランドにレジスタが必要です。`, en: `${mnemonic} requires a register as first operand.` } })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs1 = lp.parseOperand(lineNum)
      if (!rs1 || rs1.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `${mnemonic} の第2オペランドにレジスタが必要です。`, en: `${mnemonic} requires a register as second operand.` } })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs2 = lp.parseOperand(lineNum)
      if (!rs2 || rs2.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `${mnemonic} の第3オペランドにレジスタが必要です。`, en: `${mnemonic} requires a register as third operand.` } })
        return false
      }
      operands.push(rd, rs1, rs2)
      return true
    }

    case 'NOT': {
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `NOT の第1オペランドにレジスタが必要です。`, en: `NOT requires a register as first operand.` } })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs = lp.parseOperand(lineNum)
      if (!rs || rs.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `NOT の第2オペランドにレジスタが必要です。`, en: `NOT requires a register as second operand.` } })
        return false
      }
      operands.push(rd, rs)
      return true
    }

    case 'SHL':
    case 'SHR': {
      const rd = lp.parseOperand(lineNum)
      if (!rd || rd.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `${mnemonic} の第1オペランドにレジスタが必要です。`, en: `${mnemonic} requires a register as first operand.` } })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const rs = lp.parseOperand(lineNum)
      if (!rs || rs.type !== 'register') {
        errors.push({ line: lineNum, message: { ja: `${mnemonic} の第2オペランドにレジスタが必要です。`, en: `${mnemonic} requires a register as second operand.` } })
        return false
      }
      if (!lp.expectComma(lineNum)) return false
      const n = lp.parseOperand(lineNum)
      if (!n || n.type !== 'immediate') {
        errors.push({ line: lineNum, message: { ja: `${mnemonic} の第3オペランドに即値が必要です。例: ${mnemonic} R1, R2, 3`, en: `${mnemonic} requires an immediate shift amount as third operand.` } })
        return false
      }
      operands.push(rd, rs, n)
      return true
    }

    default: {
      // 型安全な網羅チェック
      const _: never = mnemonic
      errors.push({
        line: lineNum, message: {
          ja: `未実装の命令: ${String(_)}`,
          en: `Unimplemented instruction: ${String(_)}`,
        },
      })
      return false
    }
  }
}

export function parse(
  tokens: Token[],
  allowedInstructions?: InstructionType[],
): ParseResult {
  const allowedSet: Set<InstructionType> | null = allowedInstructions
    ? new Set(allowedInstructions)
    : null

  const instructions: Instruction[] = []
  const labels = new Map<string, number>()
  const errors: ParseError[] = []

  const cursor = new TokenCursor(tokens)

  // Pass 1: ラベル収集 + 命令リスト構築
  const rawInstructions: Array<RawInstruction | null> = []

  while (cursor.peek().kind !== 'EOF') {
    const lineTokens = cursor.consumeLine()
    if (lineTokens.length === 0) continue

    // ラベル定義を先頭から収集（複数ラベルも対応）
    let i = 0
    while (i < lineTokens.length && lineTokens[i].kind === 'LABEL_DEF') {
      labels.set(lineTokens[i].value, rawInstructions.length)
      i++
    }

    const rest = lineTokens.slice(i)
    if (rest.length === 0) continue // ラベルのみの行

    // 未知ニーモニックのチェック
    if (rest[0].kind === 'LABEL_REF') {
      const typo = rest[0].value
      const suggestion = findSuggestion(typo)
      const err: ParseError = {
        line: rest[0].line,
        column: rest[0].column,
        message: {
          ja: `'${typo}' は認識できません。`,
          en: `'${typo}' is not recognized.`,
        },
      }
      if (suggestion) {
        err.suggestion = {
          ja: `${suggestion} のことですか?`,
          en: `Did you mean ${suggestion}?`,
        }
      }
      errors.push(err)
      rawInstructions.push(null)
      continue
    }

    const raw = parseLine(rest, errors, allowedSet)
    rawInstructions.push(raw)
  }

  // Pass 2: ラベル参照を命令インデックスに解決
  for (const raw of rawInstructions) {
    if (!raw) continue
    const resolved: Operand[] = raw.operands.map(op => {
      if (op.type === 'label') {
        const idx = labels.get(op.name)
        if (idx === undefined) {
          errors.push({
            line: raw.sourceLine,
            message: {
              ja: `ラベル '${op.name}' が定義されていません。`,
              en: `Label '${op.name}' is not defined.`,
            },
          })
          return op // そのまま残す（エラー済み）
        }
        return { type: 'immediate', value: idx } as Operand
      }
      return op
    })
    instructions.push({
      type: raw.type,
      operands: resolved,
      sourceLine: raw.sourceLine,
      sourceText: raw.sourceText,
    })
  }

  return { instructions, labels, errors }
}

export { isRegisterName }
