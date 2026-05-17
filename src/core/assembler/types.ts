export type TokenKind =
  | 'MNEMONIC'
  | 'REGISTER'
  | 'IMMEDIATE'   // 数値リテラル: 5, 0x10, 0b101, -3
  | 'COMMA'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'PLUS'
  | 'LABEL_DEF'
  | 'LABEL_REF'
  | 'NEWLINE'
  | 'EOF'

export interface Token {
  kind: TokenKind
  value: string
  line: number
  column: number
}

export interface LexerError {
  line: number
  column: number
  message: { ja: string; en: string }
}
