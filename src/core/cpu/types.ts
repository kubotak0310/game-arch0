/**
 * ARCH-0 CPU の全共有型を定義するモジュール。
 *
 * このファイルは Vue にも UI にも依存しない純粋型定義のみを置く。
 * CPU 本体・アセンブラ・ストア・UI のいずれもここを参照する。
 */

/**
 * CPU の実行状態を「ある瞬間」で完全にキャプチャしたスナップショット。
 *
 * stepBackward での巻き戻し履歴として使うため、`memory` は必ずコピーを保持し、
 * 参照渡しによる過去状態の破壊を防ぐ。
 */
export interface CpuSnapshot {
  registers: Registers
  memory: Uint16Array
  flags: Flags
  /** プログラムカウンタ。命令インデックス（0 始まり）であり、バイトアドレスではない。 */
  pc: number
  /** スタックポインタ。PUSH/POP/CALL/RET でメモリ末尾側を上下する。 */
  sp: number
  /** リンクレジスタ。CALL の戻り先 PC を保持する。 */
  lr: number
  halted: boolean
  /** スナップショットを取った時点までに実行したステップ数。履歴管理用。 */
  stepIndex: number
  /** ステージのクリア判定 `instruction_used` を満たすために使用済み命令を蓄積する。 */
  instructionsUsed: readonly InstructionType[]
}

/**
 * 汎用レジスタ R0〜R4 の値。
 *
 * Phase 4 で R0=0 ルールを廃止したため、R0 も通常の書き込み可能レジスタとなる。
 * 呼び出し規約は `ARCH0_SPEC.md` §3-4 を参照。
 */
export interface Registers {
  R0: number
  R1: number
  R2: number
  R3: number
  R4: number
}

/** ALU 演算結果から導出される状態フラグ。N=Negative, Z=Zero, C=Carry, V=oVerflow。 */
export interface Flags {
  N: boolean
  Z: boolean
  C: boolean
  V: boolean
}

/** ARCH-0 が解釈する全ニーモニック。章ごとに段階開放される。 */
export type InstructionType =
  | 'MOV' | 'ADD' | 'SUB'
  | 'LOAD' | 'STORE'
  | 'CMP' | 'BEQ' | 'BNE' | 'BLT' | 'BGT' | 'BLE' | 'BGE' | 'JMP'
  | 'CALL' | 'RET' | 'PUSH' | 'POP'
  | 'AND' | 'OR' | 'XOR' | 'NOT' | 'SHL' | 'SHR'
  | 'HALT'

export type RegisterName = 'R0' | 'R1' | 'R2' | 'R3' | 'R4'
export type ControlRegisterName = 'LR' | 'SP' | 'PC'
export type AnyRegisterName = RegisterName | ControlRegisterName

/**
 * 命令のオペランドを表す判別共用体。
 *
 * - `register`: `R0` / `LR` など
 * - `immediate`: `#42` / `0x1F` など即値
 * - `memory_direct`: `[0x20]` 形式の直接アドレス参照（第2章以降）
 * - `memory_register`: `[R1]` / `[R1 + 2]` のレジスタ間接参照
 * - `label`: `loop` / `main` などジャンプ先のラベル名
 */
export type Operand =
  | { type: 'register'; name: AnyRegisterName }
  | { type: 'immediate'; value: number }
  | { type: 'memory_direct'; address: number }
  | { type: 'memory_register'; register: AnyRegisterName; offset: number }
  | { type: 'label'; name: string }

/**
 * パース済みの単一命令。エラー表示や巻き戻し時のハイライトに使うため、
 * 元のソース行番号とソーステキストを保持する。
 */
export interface Instruction {
  type: InstructionType
  operands: Operand[]
  sourceLine: number
  sourceText: string
}

/**
 * アセンブラの最終出力。`labels` のキーは常に大文字に正規化済み（`loop` と `LOOP` は同一）。
 */
export interface ParseResult {
  instructions: Instruction[]
  labels: Map<string, number>
  errors: ParseError[]
}

/**
 * パース／レックス段階のエラー。多言語対応のため `message` は必ず日英両方を持つ。
 * `suggestion` は「もしかして〜？」のような訂正案を示す任意フィールド。
 */
export interface ParseError {
  line: number
  column?: number
  message: { ja: string; en: string }
  suggestion?: { ja: string; en: string }
}

/**
 * 1ステップ実行後に CPU が返す差分情報。
 * UI 側はこれを使ってハイライトや戻り値バッジを表示する。
 */
export interface ExecutionResult {
  snapshot: CpuSnapshot
  changedRegisters: AnyRegisterName[]
  changedMemoryAddresses: number[]
  changedFlags: (keyof Flags)[]
  executedType?: InstructionType
  error?: RuntimeError
}

/** 実行時に発生する致命的エラー。命令の構文エラーは `ParseError` 側で扱う。 */
export interface RuntimeError {
  type: 'infinite_loop' | 'stack_overflow' | 'invalid_address' | 'division_by_zero'
  message: { ja: string; en: string }
  line?: number
}
