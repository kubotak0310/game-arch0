/**
 * アセンブラ（lexer / parser）の内部専用型定義。
 *
 * これらは CPU 実行時には登場しない。ソース文字列 → `Instruction[]` への変換途中で
 * 一時的に使うトークン表現と、レックス段階のエラーを表す。
 */

/**
 * トークンの種別。
 *
 * - `MNEMONIC`: `MOV` `ADD` などの命令名
 * - `REGISTER`: `R0` `LR` `SP` など
 * - `IMMEDIATE`: 数値リテラル（`5` `0x10` `0b101` `-3`）
 * - `COMMA` / `LBRACKET` / `RBRACKET` / `PLUS`: 記号
 * - `LABEL_DEF`: `loop:` のようなラベル宣言
 * - `LABEL_REF`: 参照側のラベル名（ジャンプ先など）
 * - `NEWLINE`: 行終端（複数連続は 1 トークンにまとめる）
 * - `EOF`: ソース末端
 */
export type TokenKind =
  | 'MNEMONIC'
  | 'REGISTER'
  | 'IMMEDIATE'
  | 'COMMA'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'PLUS'
  | 'LABEL_DEF'
  | 'LABEL_REF'
  | 'NEWLINE'
  | 'EOF'

/**
 * レックス結果の 1 トークン。
 * `line` / `column` は 1 始まり。エラーメッセージや UI 表示で使うため必ず保持する。
 */
export interface Token {
  kind: TokenKind
  value: string
  line: number
  column: number
}

/**
 * レックス段階のエラー。日英のメッセージを持つ点は `ParseError` と同じ。
 * Cpu.load() 側で `ParseError` 形式に詰め直して扱う。
 */
export interface LexerError {
  line: number
  column: number
  message: { ja: string; en: string }
}
