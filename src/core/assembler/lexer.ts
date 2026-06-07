/**
 * ARCH-0 アセンブラのレキサー（字句解析器）。
 *
 * ソース文字列を 1 文字ずつ走査して `Token[]` に変換する。コメント（`;` 以降）と
 * 行内空白を除去し、ニーモニック・レジスタ名・ラベル名はすべて **大文字に正規化**して返す。
 * `loop:` と `LOOP:` を同一視するための仕様。
 */
import type { Token, TokenKind, LexerError } from './types.ts'

/** 全ニーモニック集合。識別子がこれに含まれれば `MNEMONIC` トークンとする。 */
const ALL_MNEMONICS = new Set([
  'MOV', 'ADD', 'SUB',
  'LOAD', 'STORE',
  'CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE', 'JMP',
  'CALL', 'RET', 'PUSH', 'POP',
  'AND', 'OR', 'XOR', 'NOT', 'SHL', 'SHR',
  'HALT',
])

/** 全レジスタ名集合（汎用 + 制御）。識別子がこれに含まれれば `REGISTER` トークンとする。 */
const ALL_REGISTERS = new Set([
  'R0', 'R1', 'R2', 'R3', 'R4',
  'LR', 'SP', 'PC',
])

/**
 * 全角文字かを判定する。
 * IME が ON のままコードを書いた際の典型的なエラー検出に使う（記号類と半角カナ範囲）。
 */
function isFullWidth(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0
  return (cp >= 0xFF01 && cp <= 0xFF60) || (cp >= 0xFF65 && cp <= 0xFF9F)
}

/**
 * 即値リテラル文字列を数値に変換する。
 * `0x` `0X` 接頭辞で16進、`0b` `0B` 接頭辞で2進、それ以外は10進と解釈する。
 * パース不能なら null。
 */
function parseImmediate(raw: string): number | null {
  if (raw.startsWith('0x') || raw.startsWith('0X')) {
    const n = parseInt(raw.slice(2), 16)
    return isNaN(n) ? null : n
  }
  if (raw.startsWith('0b') || raw.startsWith('0B')) {
    const n = parseInt(raw.slice(2), 2)
    return isNaN(n) ? null : n
  }
  const n = parseInt(raw, 10)
  return isNaN(n) ? null : n
}

/** `tokenize()` の返り値。トークン列とレックス段階で見つかったエラー。 */
export interface TokenizeResult {
  tokens: Token[]
  errors: LexerError[]
}

/**
 * ソース文字列をトークン列に変換する。
 *
 * - コメント（`;` 以降）は最初に除去する。
 * - 全角文字はエラーとして報告するが、トークン化処理は続行する（複数エラーをまとめて返すため）。
 * - 識別子は大文字に正規化する。後ろに `:` が続けばラベル定義、それ以外は
 *   ニーモニック → レジスタ → ラベル参照 の順で分類する。
 * - 中身が空の行（空行・コメントだけの行）には `NEWLINE` を出さない（パーサーの分岐数削減のため）。
 */
export function tokenize(source: string): TokenizeResult {
  const tokens: Token[] = []
  const errors: LexerError[] = []
  const lines = source.split('\n')

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1
    let raw = lines[lineIdx]

    // コメント除去
    const commentIdx = raw.indexOf(';')
    if (commentIdx !== -1) {
      raw = raw.slice(0, commentIdx)
    }

    // 全角文字チェック（コメント除去後に行うのでコメント内の日本語は無視）
    for (let ci = 0; ci < raw.length; ci++) {
      if (isFullWidth(raw[ci])) {
        errors.push({
          line: lineNum,
          column: ci + 1,
          message: {
            ja: `全角文字が含まれています。IMEがONになっていませんか? (列 ${ci + 1})`,
            en: `Full-width character detected. Is your IME turned on? (column ${ci + 1})`,
          },
        })
      }
    }

    const lineTokens: Token[] = []
    let pos = 0

    while (pos < raw.length) {
      // 空白スキップ
      if (raw[pos] === ' ' || raw[pos] === '\t' || raw[pos] === '\r') {
        pos++
        continue
      }

      const col = pos + 1

      // 単一文字トークン
      if (raw[pos] === ',') {
        lineTokens.push({ kind: 'COMMA', value: ',', line: lineNum, column: col })
        pos++
        continue
      }
      if (raw[pos] === '[') {
        lineTokens.push({ kind: 'LBRACKET', value: '[', line: lineNum, column: col })
        pos++
        continue
      }
      if (raw[pos] === ']') {
        lineTokens.push({ kind: 'RBRACKET', value: ']', line: lineNum, column: col })
        pos++
        continue
      }
      if (raw[pos] === '+') {
        lineTokens.push({ kind: 'PLUS', value: '+', line: lineNum, column: col })
        pos++
        continue
      }

      // 負の即値 (-n, -0x10, -0b101)
      if (raw[pos] === '-' && pos + 1 < raw.length && /[0-9]/.test(raw[pos + 1])) {
        pos++ // '-' を消費
        let numStr = ''
        if (raw[pos] === '0' && pos + 1 < raw.length && (raw[pos + 1] === 'x' || raw[pos + 1] === 'X')) {
          numStr = raw.slice(pos, pos + 2); pos += 2
          while (pos < raw.length && /[0-9A-Fa-f]/.test(raw[pos])) numStr += raw[pos++]
        } else if (raw[pos] === '0' && pos + 1 < raw.length && (raw[pos + 1] === 'b' || raw[pos + 1] === 'B')) {
          numStr = raw.slice(pos, pos + 2); pos += 2
          while (pos < raw.length && /[01]/.test(raw[pos])) numStr += raw[pos++]
        } else {
          while (pos < raw.length && /[0-9]/.test(raw[pos])) numStr += raw[pos++]
        }
        const parsed = parseImmediate(numStr)
        if (parsed === null) {
          errors.push({ line: lineNum, column: col, message: { ja: `不正な数値です: -${numStr}`, en: `Invalid number: -${numStr}` } })
          continue
        }
        lineTokens.push({ kind: 'IMMEDIATE', value: String(-parsed), line: lineNum, column: col })
        continue
      }

      // 識別子（ニーモニック / レジスタ / ラベル）
      if (/[A-Za-z_]/.test(raw[pos])) {
        const start = pos
        while (pos < raw.length && /[A-Za-z0-9_]/.test(raw[pos])) {
          pos++
        }
        const word = raw.slice(start, pos).toUpperCase()
        const originalWord = raw.slice(start, pos)

        // ラベル定義 (word:)
        if (pos < raw.length && raw[pos] === ':') {
          pos++ // ':' を消費
          lineTokens.push({ kind: 'LABEL_DEF', value: word, line: lineNum, column: col })
          continue
        }

        let kind: TokenKind
        if (ALL_MNEMONICS.has(word)) {
          kind = 'MNEMONIC'
        } else if (ALL_REGISTERS.has(word)) {
          kind = 'REGISTER'
        } else {
          kind = 'LABEL_REF'
        }
        lineTokens.push({ kind, value: word, line: lineNum, column: col })
        continue
      }

      // 数値（即値: 10進 / 0x16進 / 0b2進）
      if (/[0-9]/.test(raw[pos])) {
        let numStr = ''
        if (raw[pos] === '0' && pos + 1 < raw.length && (raw[pos + 1] === 'x' || raw[pos + 1] === 'X')) {
          numStr = raw.slice(pos, pos + 2); pos += 2
          while (pos < raw.length && /[0-9A-Fa-f]/.test(raw[pos])) numStr += raw[pos++]
        } else if (raw[pos] === '0' && pos + 1 < raw.length && (raw[pos + 1] === 'b' || raw[pos + 1] === 'B')) {
          numStr = raw.slice(pos, pos + 2); pos += 2
          while (pos < raw.length && /[01]/.test(raw[pos])) numStr += raw[pos++]
        } else {
          while (pos < raw.length && /[0-9]/.test(raw[pos])) numStr += raw[pos++]
        }
        if (numStr === '' || numStr === '0x' || numStr === '0b') {
          errors.push({ line: lineNum, column: col, message: { ja: '数値が必要です。', en: 'A number is required.' } })
          continue
        }
        const parsed = parseImmediate(numStr)
        if (parsed === null) {
          errors.push({ line: lineNum, column: col, message: { ja: `不正な数値です: ${numStr}`, en: `Invalid number: ${numStr}` } })
          continue
        }
        lineTokens.push({ kind: 'IMMEDIATE', value: String(parsed), line: lineNum, column: col })
        continue
      }

      // 未知の文字
      errors.push({
        line: lineNum,
        column: col,
        message: {
          ja: `認識できない文字です: '${raw[pos]}'`,
          en: `Unrecognized character: '${raw[pos]}'`,
        },
      })
      pos++
    }

    // 意味のあるトークンがある行のみ NEWLINE を追加
    if (lineTokens.length > 0) {
      tokens.push(...lineTokens)
      tokens.push({ kind: 'NEWLINE', value: '\n', line: lineNum, column: raw.length + 1 })
    }
  }

  tokens.push({ kind: 'EOF', value: '', line: lines.length, column: 0 })
  return { tokens, errors }
}
