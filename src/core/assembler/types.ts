export type TokenKind =
  | 'MNEMONIC'
  | 'REGISTER'
  | 'IMMEDIATE'   // # 付き即値: #5, #0x10
  | 'NUMBER'      // 裸の数値: [R1 + 4] のオフセット部分
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
