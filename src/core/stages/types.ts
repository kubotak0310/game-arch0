/**
 * ステージ定義の型。
 *
 * 各ステージは 1 つの `Stage` オブジェクトで完結し、
 * src/data/stages/chapter*\/ 配下のファイルからエクスポートされる。
 * ストア層はこの型を読み取って CPU の初期化・クリア判定・ヒント表示を駆動する。
 */
import type { InstructionType, AnyRegisterName, Flags, Registers } from '../cpu/types.ts'

/** 日英の両言語テキスト。UI のテキストは原則これを使う。 */
export interface I18nText {
  ja: string
  en: string
}

/**
 * 段階的に開示するヒント／答え。
 * `kind: 'hint'` は通常のヒント、`kind: 'answer'` は最終ヒント（≒ 正答例）。
 */
export interface Hint extends I18nText {
  kind: 'hint' | 'answer'
}

/** インタールード本文に挿入できる図解の種別。`note/Diagram*.vue` と対応する。 */
export type DiagramType = 'registers' | 'flags' | 'alu' | 'chain' | 'swap' | 'loop'

/**
 * インタールードのページ。1ページ＝モーダル内で 1 セクション。
 * - `date`: 任意。表示すると「ノートの一節」感を強化できる（章・物語上の節目で使う）。
 * - `body`: 本文。改行は段落区切りとしてレンダリングされる。
 * - `diagram`: 任意。挿絵を本文末に挿入したい場合に指定。
 */
export interface NotePage {
  date?: string
  body: string
  diagram?: DiagramType
}

/** ステージクリア時に表示される、章をまたぐストーリー要素。 */
export interface NoteInterlude {
  ja: NotePage[]
  en: NotePage[]
}

/**
 * ステージクリア判定の条件式。AND 結合で全て満たす必要がある。
 *
 * - `register` / `memory` / `flag`: 実行後の値が `expected` と一致するか
 * - `instruction_used`: 実行中にその命令を 1 度でも使ったか（最適解誘導用）
 */
export type SuccessCondition =
  | { type: 'register'; target: AnyRegisterName; expected: number }
  | { type: 'memory'; address: number; expected: number }
  | { type: 'flag'; flag: keyof Flags; expected: boolean }
  | { type: 'instruction_used'; op: InstructionType }

/**
 * 任意の最適化目標（命令数・サイクル数・メモリ使用量）。
 * クリアの必須条件ではなく「★」「★★」表示に使う想定。
 */
export interface OptimizationGoal {
  type: 'instruction_count' | 'cycle_count' | 'memory_usage'
  threshold: number
  label: I18nText
}

/**
 * 1 ステージの全情報。
 *
 * - `initialRegisters`: 任意。R0 は除外する型になっているのは R0=0 ルール時代の名残で、
 *   現状は **`initialSource` 内で `MOV` を書く** 方針を推奨する（学習目的での明示化）。
 * - `initialMemory`: アドレスと初期値の組を列挙する。
 * - `initialSource`: エディタに最初から入っているテンプレートコード。空欄スタートにしたい場合は省略。
 * - `unlockedInstructions`: そのステージで使える命令の集合（章ごとの段階開放に対応）。
 * - `hints`: 順に開示。配列末尾に `kind: 'answer'` を置く慣例。
 * - `interlude`: クリア後モーダルで表示するノートページ群（物語要素）。
 */
export interface Stage {
  id: string
  chapter: number
  order: number
  title: I18nText
  objective: I18nText

  initialRegisters?: Partial<Omit<Registers, 'R0'>>
  initialMemory?: Array<{ address: number; value: number }>
  initialSource?: string

  successConditions: SuccessCondition[]
  unlockedInstructions?: InstructionType[]
  optimizationGoals?: OptimizationGoal[]
  hints: Hint[]
  interlude?: NoteInterlude
}
