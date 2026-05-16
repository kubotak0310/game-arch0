# ARCH-0 開発仕様書
## Claude Code 引き継ぎドキュメント

---

## 1. プロジェクト概要

### 何を作るか

**ARCH-0**（アーチゼロ）は、独自設計の教育用CPUアーキテクチャを使ってアセンブラプログラミングを学ぶ、ブラウザで動作する無料の教育ゲームです。

### コンセプト

「大学の地下倉庫で見つかった、ある教員の未完の教材ノート」をモチーフにした物語と、アセンブラプログラミングの学習が融合した教育コンテンツ。プレイヤーは1980年代後半に書かれた教材ノートの演習問題を解きながら、現代CPUの動作原理を体得する。

### ターゲット層

- 情報系の大学生（計算機アーキテクチャの補助教材）
- 低レイヤ未経験の現役エンジニア

### 設計方針

- 完走を前提とした難易度設計（全員が最終章まで到達できる）
- 「観察可能な失敗」：エラーは責める演出ではなく、観察の機会として提示
- 物語はオプション（読み飛ばし可能）、ステージは単体で完結
- 日本語ファースト、英語版も並行で構造設計（i18n対応）

---

## 2. 技術スタック

| 領域 | 採用技術 | 備考 |
|---|---|---|
| フレームワーク | Vue 3 + Composition API | 開発者のメイン経験 |
| ビルドツール | Vite | Vue公式推奨 |
| 状態管理 | Pinia | Composition APIと記法一致 |
| コードエディタ | CodeMirror 6 | カスタム言語定義が容易 |
| ルーティング | Vue Router 4 | 標準選択 |
| i18n | vue-i18n v9 | 最初から組み込む |
| 言語 | TypeScript | CPUコアのバグ防止 |
| スタイリング | Tailwind CSS + scoped CSS | 設計が固まっているため |
| テスト | Vitest | Viteとの統合 |
| フォント | Google Fonts（Klee One, Caveat） | ノートUI用 |

---

## 3. ARCH-0 アーキテクチャ仕様

### 3-1. レジスタ構成

#### 汎用レジスタ（6本）

| 名前 | 特性 | 備考 |
|---|---|---|
| R0 | 常に0、書き換え不可 | RISC-Vのx0と同じ思想。書き込み命令は実行されるが結果は破棄される |
| R1 | 汎用 | |
| R2 | 汎用 | |
| R3 | 汎用 | |
| R4 | 汎用 | |
| R5 | 汎用 | |

#### 制御レジスタ（3本）

| 名前 | 役割 | 備考 |
|---|---|---|
| LR | Link Register（戻りアドレス） | CALL命令実行時に自動的に戻り先アドレスが格納される |
| SP | Stack Pointer | PUSH/POP命令で自動更新 |
| PC | Program Counter | 現在実行中の命令アドレス |

#### フラグ（4ビット）

| 名前 | 意味 | セットされる条件 |
|---|---|---|
| N | Negative | 演算結果が負 |
| Z | Zero | 演算結果が0 |
| C | Carry | 加算でキャリー発生、減算でボロー発生 |
| V | Overflow | 符号付き演算でオーバーフロー |

### 3-2. データ幅とアドレス空間

- データ幅：16ビット
- アドレス空間：16ビット（64KB、0x0000〜0xFFFF）
- スタック：メモリの上位アドレスから下方向に伸びる（SP初期値: 0xFFFE）

**実装モデル（インタープリタ方式）：**  
命令はパース済みオブジェクトとして保持し、メモリ空間（0x0000〜0xFFFF）にはロードしない。  
PCは **命令インデックス（0始まり）** を保持する。メモリ空間はデータアクセス（`LOAD`/`STORE`）にのみ使用される。  
これはバイナリエンコードを持たない教育用シミュレータとしての設計判断であり、実際のCPUとは異なる。

### 3-3. 命令セット

#### データ移動

```
MOV  Rd, Rs        ; Rdに Rsの値をコピー
MOV  Rd, #imm      ; Rdに即値immを代入
LOAD  Rd, [addr]   ; メモリアドレスaddrの値をRdに読み込む
LOAD  Rd, [Rs]     ; Rsが示すアドレスの値をRdに読み込む
LOAD  Rd, [Rs + n] ; Rs+nのアドレスの値をRdに読み込む
STORE Rd, [addr]   ; Rdの値をメモリアドレスaddrに書き込む
STORE Rd, [Rs]     ; Rdの値をRsが示すアドレスに書き込む
STORE Rd, [Rs + n] ; Rdの値をRs+nのアドレスに書き込む
```

#### 算術演算

```
ADD  Rd, Rs1, Rs2  ; Rd = Rs1 + Rs2
ADD  Rd, Rs, #imm  ; Rd = Rs + imm
SUB  Rd, Rs1, Rs2  ; Rd = Rs1 - Rs2
SUB  Rd, Rs, #imm  ; Rd = Rs - imm
```

#### 論理演算（第4章で追加）

```
AND  Rd, Rs1, Rs2  ; Rd = Rs1 & Rs2
OR   Rd, Rs1, Rs2  ; Rd = Rs1 | Rs2
XOR  Rd, Rs1, Rs2  ; Rd = Rs1 ^ Rs2
NOT  Rd, Rs        ; Rd = ~Rs
SHL  Rd, Rs, #n    ; Rd = Rs << n（論理左シフト）
SHR  Rd, Rs, #n    ; Rd = Rs >> n（論理右シフト）
```

#### 比較・分岐（第3章で追加）

```
CMP  Rs1, Rs2      ; Rs1とRs2を比較してフラグを更新（結果は保存しない）
CMP  Rs, #imm      ; Rsと即値を比較してフラグを更新
BEQ  label         ; Z=1なら labelへジャンプ
BNE  label         ; Z=0なら labelへジャンプ
BLT  label         ; N=1かつV=0 なら labelへジャンプ（符号付き）
BGT  label         ; Z=0かつN=V なら labelへジャンプ（符号付き）
BLE  label         ; Z=1またはN≠V なら labelへジャンプ（符号付き）
BGE  label         ; N=V なら labelへジャンプ（符号付き）
JMP  label         ; 無条件ジャンプ
```

#### サブルーチン・スタック（第3章で追加）

```
CALL label         ; LRに次の命令アドレスを保存し labelへジャンプ
RET                ; PCにLRの値を設定（サブルーチンから戻る）
PUSH Rs            ; Rsの値をスタックに積む（SPを2減らしてメモリに書き込む）
POP  Rd            ; スタックから値を取り出しRdに格納（SPを2増やす）
```

#### その他

```
HALT               ; プログラムの実行を停止
```

### 3-4. 呼び出し規約（Calling Convention）

#### レジスタの役割分担

| レジスタ | 種別 | 役割 |
|---|---|---|
| R0 | — | 常に0（書き込み不可） |
| R1, R2 | Caller-saved（引数・戻り値） | 呼び出し元が必要なら CALL 前に保存する。関数は自由に使ってよい |
| R3, R4, R5 | Callee-saved | 関数が使う場合は先頭で PUSH、RET 前に POP して元の値に戻す義務がある |
| LR | 戻りアドレス | ネスト呼び出しをする関数は先頭で `PUSH LR`、RET 前に `POP LR` する |
| SP | スタックポインタ | 関数終了時に CALL 前と同じ値に戻す（PUSH/POP の対称性を保つ） |

#### 引数・戻り値の渡し方

- 引数は R1（第1引数）、R2（第2引数）で渡す
- 戻り値は R1 に入れて返す
- 引数が3つ以上になる場合はスタックを使う（第3章後半の発展課題）

#### コード例

```asm
; 呼び出し元
MOV  R1, #10       ; 第1引数
MOV  R2, #20       ; 第2引数
CALL add_r1_r2     ; 関数呼び出し（LR に戻りアドレスが入る）
; R1 に戻り値（30）が入っている
HALT

; 関数本体（R3 を使うので Callee-saved として保存）
add_r1_r2:
  PUSH R3          ; R3 を保存（Callee-saved）
  ADD  R3, R1, R2  ; R3 = R1 + R2
  MOV  R1, R3      ; 戻り値を R1 にセット
  POP  R3          ; R3 を復元
  RET

; ネストした CALL がある関数（LR を保存する必要がある）
outer:
  PUSH LR          ; LR を保存（CALL で上書きされるため）
  CALL inner       ; LR が上書きされる
  POP  LR          ; LR を復元
  RET

inner:
  MOV  R1, #42
  RET
```

#### スタックのメモリモデル

- スタックは上位アドレスから下方向に伸びる（Full Descending）
- `PUSH Rs`：SP を 2 減らし、`memory[SP] = Rs`（SP はデータを指す）
- `POP Rd`：`Rd = memory[SP]`、SP を 2 増やす
- 初期 SP = `0xFFFE`（偶数。SP は常に偶数アドレスを保つ）

---

### 3-5. 構文仕様

#### 数値表記

```
10進数:  123
16進数:  0x7B
2進数:   0b01111011   （第4章以降で使用）
```

#### 即値マーカー

即値には `#` を前置する：`#5`、`#0x10`

#### メモリアクセス

```
[0x10]        ; 直接アドレス（裸の数値リテラル、#なし）
[R1]          ; レジスタ間接
[R1 + 4]      ; オフセット付き（Intel風、数式的に読める）
```

**実装状況：** `[R1]`・`[R1 + 4]` 形式は第1章から実装済み。  
`[0x10]` 形式（裸の数値リテラル）は第2章（LOAD/STORE導入時）にレキサーへ数値トークン追加で対応する。  
現時点では `[addr]` の `addr` 部分にはレジスタのみ使用可能。

#### ラベル

```
loop_start:        ; ラベル定義（コロンで終わる）
JMP loop_start     ; ラベルへの参照
```

**大文字・小文字の区別なし（自動正規化）：**  
ラベル名・ニーモニック・レジスタ名はすべてレキサーが大文字に正規化する。  
`loop:` と `LOOP:` は同一のラベルとして扱われる。`jmp` と `JMP` も同じ命令として扱われる。

#### コメント

```
; セミコロン以降は行末までコメント
```

#### コード例

```asm
; 配列の合計を計算する例
MOV  R2, #0x100    ; 配列の先頭アドレス
MOV  R3, #8        ; 要素数
MOV  R1, #0        ; 合計の初期値

loop:
  CMP  R3, R0      ; R3が0かチェック（R0は常に0）
  BEQ  end
  LOAD R4, [R2]    ; メモリから読み込み
  ADD  R1, R1, R4  ; 合計に加算
  ADD  R2, R2, #1  ; アドレスを進める
  SUB  R3, R3, #1  ; カウンタを減らす
  JMP  loop

end:
  HALT
```

---

## 4. プロジェクト構造

```
arch0/
├── src/
│   ├── core/                    # CPUシミュレータのコア（Vue非依存）
│   │   ├── assembler/
│   │   │   ├── lexer.ts         # 字句解析
│   │   │   ├── parser.ts        # 構文解析
│   │   │   └── types.ts         # ASTの型定義
│   │   ├── cpu/
│   │   │   ├── cpu.ts           # CPU実行エンジン
│   │   │   ├── instructions.ts  # 命令の実装
│   │   │   ├── memory.ts        # メモリ管理
│   │   │   └── types.ts         # CPU状態の型定義
│   │   └── stages/
│   │       ├── stage-loader.ts  # ステージデータの読み込み
│   │       └── types.ts         # ステージの型定義
│   │
│   ├── stores/                  # Pinia stores
│   │   ├── cpu.ts               # CPU状態
│   │   ├── execution.ts         # 実行制御・履歴
│   │   └── progress.ts          # プレイヤーの進捗
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── CodeEditor.vue   # CodeMirror wrapper
│   │   │   └── ErrorPanel.vue   # エラー表示
│   │   ├── cpu/
│   │   │   ├── RegisterView.vue # レジスタ表示
│   │   │   ├── MemoryView.vue   # メモリビュー
│   │   │   ├── FlagView.vue     # フラグ表示
│   │   │   └── StackView.vue    # スタックビュー
│   │   ├── execution/
│   │   │   ├── ExecutionControl.vue # 実行制御ボタン
│   │   │   └── Timeline.vue     # 実行履歴タイムライン
│   │   └── note/
│   │       ├── NoteInterlude.vue    # インタールード
│   │       └── NoteSidePanel.vue    # サイドパネル
│   │
│   ├── views/
│   │   ├── StageView.vue        # ステージ画面
│   │   ├── ChapterSelect.vue    # 章選択
│   │   └── Ending.vue           # エンディング
│   │
│   ├── data/
│   │   └── stages/              # ステージデータ
│   │       ├── chapter1/
│   │       ├── chapter2/
│   │       └── ...
│   │
│   └── locales/                 # i18n
│       ├── ja.ts
│       └── en.ts
│
└── tests/
    └── core/                    # CPUコアのユニットテスト
        ├── assembler.test.ts
        └── cpu.test.ts
```

**重要：** `src/core/` はVueに一切依存しない純粋なTypeScriptで実装する。テストが容易になり、将来的なフレームワーク変更にも耐えられる。

---

## 5. 型定義

### 5-1. CPU状態

```typescript
// src/core/cpu/types.ts

// CPU状態のスナップショット（巻き戻しのために毎ステップ保存）
export interface CpuSnapshot {
  registers: Registers
  memory: Uint16Array
  flags: Flags
  pc: number
  sp: number
  lr: number
  halted: boolean
  stepIndex: number  // 何ステップ目か
}

// 汎用レジスタ
export interface Registers {
  R0: 0              // 常に0（型レベルで固定）
  R1: number
  R2: number
  R3: number
  R4: number
  R5: number
}

// フラグ
export interface Flags {
  N: boolean
  Z: boolean
  C: boolean
  V: boolean
}

// 命令の種類（章ごとに段階的に解放）
export type InstructionType =
  | 'MOV' | 'ADD' | 'SUB'                          // 第1章
  | 'LOAD' | 'STORE'                                // 第2章
  | 'CMP' | 'BEQ' | 'BNE' | 'BLT' | 'BGT'
  | 'BLE' | 'BGE' | 'JMP'                          // 第3章前半
  | 'CALL' | 'RET' | 'PUSH' | 'POP'               // 第3章後半
  | 'AND' | 'OR' | 'XOR' | 'NOT' | 'SHL' | 'SHR' // 第4章
  | 'HALT'

// レジスタ名（コード上で使える名前）
export type RegisterName = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
export type ControlRegisterName = 'LR' | 'SP' | 'PC'
export type AnyRegisterName = RegisterName | ControlRegisterName

// オペランド
export type Operand =
  | { type: 'register'; name: AnyRegisterName }
  | { type: 'immediate'; value: number }
  | { type: 'memory_direct'; address: number }
  | { type: 'memory_register'; register: AnyRegisterName; offset: number }
  | { type: 'label'; name: string }

// パース済み命令（1行分）
export interface Instruction {
  type: InstructionType
  operands: Operand[]
  sourceLine: number   // 元の行番号（1始まり）
  sourceText: string   // 元のテキスト（エラー表示用）
}

// パース結果
export interface ParseResult {
  instructions: Instruction[]
  labels: Map<string, number>  // ラベル名 → 命令インデックス
  errors: ParseError[]
}

// パースエラー
export interface ParseError {
  line: number
  column?: number
  message: { ja: string; en: string }
  suggestion?: { ja: string; en: string }  // 修正提案（例: MOC → MOV）
}

// 実行結果（1ステップ分）
export interface ExecutionResult {
  snapshot: CpuSnapshot
  changedRegisters: AnyRegisterName[]  // 変化したレジスタ（差分ハイライト用）
  changedMemoryAddresses: number[]     // 変化したメモリアドレス
  changedFlags: (keyof Flags)[]        // 変化したフラグ
  error?: RuntimeError
}

// 実行時エラー
export interface RuntimeError {
  type: 'infinite_loop' | 'stack_overflow' | 'invalid_address' | 'division_by_zero'
  message: { ja: string; en: string }
  line?: number
}
```

### 5-2. ステージデータ

```typescript
// src/core/stages/types.ts

export interface Stage {
  id: string                      // 例: 'c1-s01-first-value'
  chapter: number                 // 1〜5（5が終章）
  order: number                   // 章内の順番
  title: I18nText

  // 初期CPU状態（省略時はゼロクリア）
  initialRegisters?: Partial<Omit<Registers, 'R0'>>
  initialMemory?: Array<{ address: number; value: number }>

  // 成功条件（全て満たせばクリア）
  successConditions: SuccessCondition[]

  // このステージで初めて使える命令（段階的開放）
  unlockedInstructions?: InstructionType[]

  // 最適化目標（主要ステージのみ設定）
  optimizationGoals?: OptimizationGoal[]

  // ヒント（段階的に表示）
  hints: I18nText[]              // hints[0]が最初のヒント、hints[最後]が答え

  // ノートデータ（物語層、省略可）
  note?: NoteContent
}

// 成功条件
export type SuccessCondition =
  | { type: 'register'; target: AnyRegisterName; expected: number }
  | { type: 'memory'; address: number; expected: number }
  | { type: 'flag'; flag: keyof Flags; expected: boolean }

// 最適化目標
export interface OptimizationGoal {
  type: 'instruction_count' | 'cycle_count' | 'memory_usage'
  threshold: number
  label: I18nText
}

// ノートコンテンツ（物語層）
export interface NoteContent {
  // インタールード（ステージ前に表示）
  interlude?: {
    ja: NotePageData
    en: NotePageData
  }
  // 成功後に表示されるノートの欄外メモ
  marginNote?: I18nText
}

export interface NotePageData {
  title: string
  body: string           // Markdown形式
  marginNote?: string    // 欄外メモ（手書き風）
  date?: string          // 例: '1987/04/12'
  codeExample?: string   // コード例（アセンブラ）
}

// i18n用テキスト
export interface I18nText {
  ja: string
  en: string
}
```

### 5-3. Pinia Store

```typescript
// src/stores/cpu.ts（概要）

export const useCpuStore = defineStore('cpu', () => {
  // 現在のCPU状態
  const snapshot = ref<CpuSnapshot>(initialSnapshot())

  // 実行履歴（巻き戻し用）
  const history = ref<CpuSnapshot[]>([])

  // 現在のステップインデックス
  const currentStep = ref(0)

  // パース済み命令列
  const instructions = ref<Instruction[]>([])

  // パースエラー
  const parseErrors = ref<ParseError[]>([])

  // 実行状態
  const isRunning = ref(false)
  const isHalted = ref(false)

  // 直前のステップで変化した要素（ハイライト用）
  const lastChanged = ref<{
    registers: AnyRegisterName[]
    memory: number[]
    flags: (keyof Flags)[]
  }>({ registers: [], memory: [], flags: [] })

  return {
    snapshot, history, currentStep,
    instructions, parseErrors,
    isRunning, isHalted, lastChanged,
    // actions は別途実装
  }
})

// src/stores/execution.ts（概要）
export const useExecutionStore = defineStore('execution', () => {
  const speed = ref(3)           // 1〜5（実行速度）
  const isStepMode = ref(false)  // ステップ実行モード中か

  // 実行制御アクション
  async function run() { /* ... */ }
  function stepForward() { /* ... */ }
  function stepBackward() { /* ... */ }
  function reset() { /* ... */ }

  return { speed, isStepMode, run, stepForward, stepBackward, reset }
})

// src/stores/progress.ts（概要）
export const useProgressStore = defineStore('progress', () => {
  // localStorageに永続化
  const completedStages = ref<Set<string>>(new Set())
  const optimizationAchievements = ref<Map<string, string[]>>(new Map())

  return { completedStages, optimizationAchievements }
}, { persist: true })  // pinia-plugin-persistedstate使用
```

---

## 6. UI設計仕様

### 6-1. 画面の全体構造

#### 第1〜2章（2カラム）

```
┌────────────────────────────────────────────────────┐
│  ヘッダー：章名、ステージ名、ノート/ヒントボタン       │
├──────────────────────┬─────────────────────────────┤
│                      │  レジスタ（R0〜R5、制御）      │
│  コードエディタ        ├─────────────────────────────┤
│  （左 1.4fr）         │  課題・成功条件              │
│                      │  （右 1fr）                   │
├──────────────────────┴─────────────────────────────┤
│  実行制御：実行・ステップ・戻す・リセット・速度スライダ  │
└────────────────────────────────────────────────────┘
```

#### 第3章以降（3カラム）

```
┌──────────────────┬──────────────────┬──────────────┐
│                  │ 汎用レジスタ      │ 課題         │
│  コードエディタ   ├──────────────────┤──────────────┤
│  （左 1.3fr）    │ 制御レジスタ      │ メモリビュー  │
│                  │ フラグ           ├──────────────┤
│                  ├──────────────────┤ スタックビュー│
│                  │ コールスタック    │              │
├──────────────────┴──────────────────┴──────────────┤
│  実行制御 + 実行履歴タイムライン                       │
└────────────────────────────────────────────────────┘
```

### 6-2. レジスタ表示の状態

```
未使用（グレーアウト）: opacity: 0.35、値は「—」
通常使用中:            白背景、値は数値
直前に変化した:         緑背景（1秒後に通常に戻る）、変化前→変化後を表示
R0（常に0）:           薄い灰色背景 + 左端に細い線
制御レジスタ:           コーラル色（#D85A30系）の背景
```

### 6-3. シンタックスハイライト配色

```
命令ニーモニック:  #534AB7（紫）
レジスタ名:       #185FA5（青）
即値:             #BA7517（アンバー）
ラベル:           #1D9E75（緑）
コメント:         グレー（var(--color-text-tertiary)）
```

### 6-4. エラー表示

#### タイプ1：構文エラー（実行前）

- ヘッダーに「エラー N件」（赤色）
- 問題のある行に赤い波線（`text-decoration: underline wavy`）
- 行の左端に警告アイコン
- エディタ下部に「原因 + 例:」を表示
- 全角文字の混入も検知（日本語環境特有の問題）

#### タイプ2：論理エラー（実行後）

- ヘッダーに「実行完了 — 結果を確認してください」（アンバー色）
- レジスタ枠に「実際値」と「期待値」を並列表示
- 正しい部分は緑、違う部分は赤で区別
- コード側にも手がかりを表示（薄い赤ハイライト + 注釈）
- ステップ実行への誘導文を添える

#### 共通原則

- 「間違えました」「失敗」という言葉を使わない
- 事実だけを述べ、解決策を必ず添える
- 静かなエラー表示（赤画面・警告音・点滅なし）

### 6-5. ステップ実行の状態表示

```
実行前:    ▶ マーク（青）で次に実行される行を表示
実行済み:  薄い緑背景 + チェックマーク（行が完了した証）
実行中:    薄い青背景 + 左端に太い線（現在この行を実行中）
```

### 6-6. UI要素の段階的開放スケジュール

| 章 | 新たに表示される要素 |
|---|---|
| 第1章 | R0〜R5（使用分のみ色付き）、基本実行制御、課題 |
| 第2章 | メモリビュー、SP・PCの表示、I/Oデバイス領域 |
| 第3章前半 | フラグ（N/Z/C/V）、3カラムレイアウトへ移行 |
| 第3章中盤 | LR表示、コールスタック、ブレークポイント |
| 第3章後半 | スタックビュー、実行履歴タイムライン |
| 第4章 | 表示形式切り替え（10進/16進/2進） |

---

## 7. ノートUI仕様

### 7-1. 視覚デザイン

```
紙色:        #F7F3EA（やや黄ばんだオフホワイト）
罫線:        #C8D8E8（薄い青）、28px間隔、background-position: 0 36px
マージン線:   左端から46px、rgba(200,60,60,0.28)
パンチ穴:    左端14px、直径12px、3〜4個
本文フォント: Klee One（日本語）/ Caveat（英語）
欄外メモ:    Caveat体、color: #1A3A6A（青インク）、rotate: -1〜1.5deg
日付:        右上、Caveat体、color: #8B6914、opacity: 0.65
```

### 7-2. 2つの表示場面

**場面1：インタールード（ステージ間）**
- 背景暗転（rgba(0,0,0,0.55)）
- ノートが中央に浮かぶ
- 「演習を始める」ボタンでスキップ可能

**場面2：サイドパネル（ステージ中）**
- 画面右側から引き出し形式
- ステージ画面の右半分を占める
- 閉じればステージに戻る

---

## 8. 章立て・ステージ構成

| 章 | タイトル | 主題 | ステージ数 |
|---|---|---|---|
| 第1章 | 目覚め | レジスタ・基本命令・I/O | 10〜12 |
| 第2章 | 記憶の断片 | メモリ・配列・データ操作 | 10〜12 |
| 第3章 | 途切れたページ | 制御構造・サブルーチン・スタック（山場） | 14〜16 |
| 第4章 | ARCH-0の核心 | ビット操作・論理演算・応用 | 8〜10 |
| 終章 | 最後のページ | 集大成・物語の結末 | 4〜6 |
| 合計 | | | 46〜56ステージ |

### 第3章の3段階構成（山場の設計）

1. フラグ・条件分岐のみ（ステージ1〜5）
2. ループ構造（ステージ6〜9）
3. サブルーチン・スタック・再帰（ステージ10〜16）

### 終章の方針

- RISC-V専用の章は設けない
- 第1〜4章の概念を使った集大成問題を解く
- エンディング後に「次に学べること」として、RISC-V/ARM/Nand2Tetris等へのガイドを1ページで提示

---

## 9. ステージ1の完全仕様（実装の起点）

### 基本情報

```typescript
const stage1: Stage = {
  id: 'c1-s01-first-value',
  chapter: 1,
  order: 1,
  title: { ja: 'はじめての値', en: 'First Value' },

  initialRegisters: {},  // 全ゼロ
  initialMemory: [],

  successConditions: [
    { type: 'register', target: 'R1', expected: 2 },
    { type: 'register', target: 'R2', expected: 3 },
  ],

  unlockedInstructions: ['MOV', 'HALT'],

  hints: [
    {
      ja: 'MOV命令を使います。\n例: MOV R1, #2',
      en: 'Use the MOV instruction.\nExample: MOV R1, #2'
    },
    {
      ja: 'R2にも同じパターンで書いてみましょう。\nMOV R2, #3',
      en: 'Write the same pattern for R2.\nMOV R2, #3'
    },
    {
      ja: '答え:\nMOV R1, #2\nMOV R2, #3',
      en: 'Answer:\nMOV R1, #2\nMOV R2, #3'
    },
  ],
}
```

### 想定する正解コード

```asm
MOV R1, #2
MOV R2, #3
```

### 想定する失敗パターン（エラーメッセージ設計）

| ケース | コード例 | メッセージ（日本語） |
|---|---|---|
| 命令名typo | `MOC R1, #2` | 「MOC は認識できません。MOV のことですか?」 |
| カンマ忘れ | `MOV R1 #2` | 「レジスタと値の間にカンマが必要です。例: MOV R1, #2」 |
| #忘れ | `MOV R1, 2` | 「即値には # を付けてください。例: MOV R1, #2」 |
| 全角文字 | `ＭＯＶ R1, #2` | 「全角文字が含まれています。IMEがONになっていませんか?」 |
| 値が違う | `MOV R1, #5` | R1の実際値と期待値(2)を並列表示 |
| 片方だけ | `MOV R1, #2`のみ | R2が0のまま、期待値(3)を表示 |

---

## 10. 開発フェーズ

### フェーズ1：CPUコアの実装（最初に着手）

**目標：** Vue非依存のTypeScriptでテストが通るCPUシミュレータを作る。

**作るもの：**

1. `src/core/assembler/lexer.ts` — 字句解析（トークン化）
2. `src/core/assembler/parser.ts` — 構文解析（AST生成、ラベル解決）
3. `src/core/cpu/instructions.ts` — 第1章の命令実装（MOV, ADD, SUB, HALT）
4. `src/core/cpu/cpu.ts` — 実行エンジン（1命令実行、スナップショット保存）
5. `src/core/cpu/memory.ts` — メモリ管理（16ビット、64KB）
6. `tests/core/assembler.test.ts` — パーサーのユニットテスト
7. `tests/core/cpu.test.ts` — 実行エンジンのユニットテスト

**完成基準：**

以下のテストが全て通ること。

```typescript
// テスト例
it('MOV R1, #2 でR1に2が入る', () => {
  const result = execute('MOV R1, #2')
  expect(result.snapshot.registers.R1).toBe(2)
})

it('R0への書き込みは無視される', () => {
  const result = execute('MOV R0, #5')
  expect(result.snapshot.registers.R0).toBe(0)
})

it('ADD R3, R1, R2 でR3にR1+R2が入る', () => {
  const result = execute(`
    MOV R1, #2
    MOV R2, #3
    ADD R3, R1, R2
  `)
  expect(result.snapshot.registers.R3).toBe(5)
})

it('ステップ実行で巻き戻しができる', () => {
  const cpu = new Cpu()
  cpu.load('MOV R1, #2\nMOV R2, #3')
  cpu.stepForward()
  expect(cpu.snapshot.registers.R1).toBe(2)
  cpu.stepBackward()
  expect(cpu.snapshot.registers.R1).toBe(0)
})
```

### フェーズ2：最小限のUIでステージ1を動かす

**目標：** ブラウザで実際にステージ1がプレイできる状態。

**作るもの：**

1. Vueプロジェクトの初期設定（Vite + Vue3 + TypeScript + Pinia + Vue Router + vue-i18n）
2. `src/stores/cpu.ts` — CPUコアのVueラッパー
3. `src/stores/execution.ts` — 実行制御
4. `src/components/editor/CodeEditor.vue` — CodeMirror 6の基本統合
5. `src/components/cpu/RegisterView.vue` — レジスタ表示（第1章用：R1〜R5のみ）
6. `src/components/execution/ExecutionControl.vue` — 実行ボタン
7. `src/views/StageView.vue` — ステージ画面の骨格
8. ステージ1のデータ定義

**完成基準：**

ブラウザで `MOV R1, #2` と `MOV R2, #3` を書いて実行ボタンを押すと、レジスタ表示が変わりクリア判定が出る。

### フェーズ3：第1章の完成

**目標：** 第1章10〜12ステージを全部プレイできる。

**作るもの：**

1. 残りの第1章命令（LOAD, STORE, I/Oデバイス）
2. エラー表示（タイプ1・タイプ2の完全実装）
3. ステップ実行の完全実装（差分ハイライト、変化前→変化後表示、巻き戻し）
4. ノートUIの第1章分（インタールード）
5. 進捗保存（localStorage）
6. ヒント表示（段階的）
7. 第1章の全ステージデータ

### フェーズ4：第2〜終章の実装

フェーズ3と同じパターンを章ごとに繰り返す。

---

## 11. 設計上の重要な注意事項

### R0の扱い

R0は書き込み命令を受け付けるが、結果を破棄する。実行時エラーにしない。
エディタ側でリアルタイムに警告（波線）を表示するが、実行は可能。

### LRの扱い

`LR` と `R7` は全く別物。R7は存在しない（R0〜R5が汎用レジスタの全て）。
コード上で `LR` と書くと制御レジスタのLRを指す。

### 巻き戻し機能

各ステップ実行後に `CpuSnapshot` をimmutableに保存する。
メモリは `Uint16Array` なのでコピーが必要：`new Uint16Array(currentMemory)` 。
最大保存ステップ数は1000程度（それ以上は古いものを削除）。

### ステージデータの命令解放

プレイヤーが使える命令は `unlockedInstructions` で管理する。
パーサーはその時点で解放されている命令のみ有効とする。
未解放の命令を使おうとすると「この命令はまだ使えません」というエラー。

### i18n の徹底

ハードコードされた日本語テキストを一切書かない。
全てのユーザー向けテキストは `locales/ja.ts` と `locales/en.ts` に外出し。
エラーメッセージも含む。

### PCと命令インデックスモデル（実装上の重要な決定）

**PC は命令インデックス（0始まり）であり、メモリアドレスではない。**

仕様書の記述では「PC = 現在実行中の命令アドレス」としているが、実装ではバイナリエンコードを持たない。  
`src/core/cpu/cpu.ts` の `Cpu` クラスは命令をパース済みオブジェクト配列 `Instruction[]` として保持し、  
PCはその配列インデックス（0, 1, 2, ...）を指す。

これに伴う実装上の影響：
- `CpuSnapshot.pc` は命令インデックス（0〜n）、表示時に「命令番号」として扱う
- `CALL` 命令で LR に保存される値は「次の命令インデックス」（`pc + 1`）
- メモリ空間（0x0000〜0xFFFF）はデータ専用（`LOAD`/`STORE` によるアクセスのみ）
- UI でPCを表示する場合は「行番号」や「命令番号」として見せると分かりやすい

### ラベルの大文字正規化

レキサー（`src/core/assembler/lexer.ts`）がすべての識別子を大文字に正規化する。  
ニーモニック・レジスタ名・ラベル名のいずれも同様。  
パーサーの `labels` Map のキーは大文字で格納される（例: `'LOOP_START'`）。  
ユーザーが `loop:` と `LOOP:` を混在させても問題なく動作する。

### `[addr]` 直接アドレス記法（第2章実装時の注意）

現在（第1章）のレキサーは `[Rs]`・`[Rs + n]` のみサポートする。  
`[0x10]` のような裸の数値リテラルを含む直接アドレス形式は未実装。

第2章（LOAD/STORE 導入時）に以下の対応が必要：
- レキサーに `#` なし数値リテラルのトークン化を追加（`LBRACKET` の直後に現れる数値）
- パーサーの `parseOperand` で `memory_direct` オペランドとして処理するよう拡張

---

*このドキュメントは設計議論と実装を通じて更新されています。実装時に発見した問題は適宜フィードバックしてください。*
