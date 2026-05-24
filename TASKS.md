# TASKS.md — ARCH-0 開発進捗

> Claude Code が作業前後にこのファイルを読み書きして進捗を管理する。
> 完了したタスクはチェックを入れ、新たに判明したタスクは適切なフェーズに追記する。

---

## 現在のフェーズ: Phase 4 — 第2〜終章の実装

**Phase 3 完了。** 第1章（S01〜S06）全ステージ、インタールード、図解、進捗保存、エラー表示、ステップ差分表示まで完成。
**Phase 4 進行中。** 第2章（S01〜S10）実装完了。第3章新設（ループ）。UI大幅改善。

---

## Phase 1 ✅ — CPUコア実装

**完成基準:** `npm test` で全テスト green ✅（57件）

- [x] `src/core/cpu/types.ts` — 全共有型定義
- [x] `src/core/assembler/types.ts` — レキサー内部Token型
- [x] `src/core/assembler/lexer.ts` — 字句解析（全角文字検出・コメント除去）
- [x] `src/core/assembler/parser.ts` — 構文解析（2パス・ラベル解決・タイポ提案）
- [x] `src/core/cpu/memory.ts` — Uint16Array ラッパー
- [x] `src/core/cpu/instructions.ts` — MOV/ADD/SUB/HALT + 全章分の命令ハンドラ + フラグ演算
- [x] `src/core/cpu/cpu.ts` — Cpu クラス + `execute()` 便利関数
- [x] `tests/core/assembler.test.ts` — レキサー・パーサーのユニットテスト
- [x] `tests/core/cpu.test.ts` — CPU実行・巻き戻しのユニットテスト
- [x] `tsconfig.test.json` — テスト用 TypeScript 設定
- [x] `CLAUDE.md` — Claude Code 向けプロジェクトガイド
- [x] `ARCH0_SPEC.md` 更新 — 実装で判明した差分（PC=命令インデックス、ラベル大文字正規化、`[addr]`未実装）を反映

---

## Phase 2 ✅ — 最小限UIでステージ1を動かす

**完成基準:** ブラウザで `MOV R1, #2` と `MOV R2, #3` を書いて実行するとクリア判定が出る ✅

### セットアップ
- [x] Vue Router・Pinia・vue-i18n を `src/main.ts` に登録
- [x] `src/locales/ja.ts` と `src/locales/en.ts` の基本骨格作成
- [x] `src/router/index.ts` — ルーティング設定（`/` → StageView）

### Pinia Stores
- [x] `src/stores/cpu.ts` — `Cpu` クラスのVueラッパー（load / stepForward / stepBackward / reset / runAll）
- [x] `src/stores/execution.ts` — 実行速度・ステップモード管理

### コンポーネント
- [x] `src/components/editor/CodeEditor.vue` — CodeMirror 6 基本統合
- [x] `src/components/cpu/RegisterView.vue` — レジスタ表示（変化時に緑ハイライト・R1のRET後「戻り値」バッジ）
- [x] `src/components/cpu/FlagsView.vue` — N/Z/C/V フラグ表示
- [x] `src/components/cpu/ControlRegsView.vue` — PC/SP/LR 制御レジスタ表示
- [x] `src/components/cpu/MemoryView.vue` — メモリ表示（8×8固定・0x00〜0x3F）
- [x] `src/components/cpu/StackView.vue` — スタック表示（SP相対エントリ一覧）
- [x] `src/components/execution/ExecutionControl.vue` — 実行・ステップ・リセットボタン

### ステージデータ
- [x] `src/core/stages/types.ts` — `Stage` 型定義
- [x] `src/data/stages/chapter1/s01-first-value.ts` — ステージ1データ（`c1-s01-first-value`）

### 画面
- [x] `src/views/StageView.vue` — 3カラムレイアウト（エディタ 1.4fr / CPU状態 0.85fr / メモリ+スタック縦並び 1.0fr）
- [x] クリア判定ロジック（`successConditions` と実行結果の照合）

### デバッグ・開発支援
- [x] `src/composables/useDebugMode.ts` — `?debug` URLクエリでデバッグモード切替（命令制約解除・全UI表示・DEBUGバッジ）
- [x] `ExecutionResult.executedType` — 直前に実行した命令タイプをUIに通知

---

## Phase 3 ✅ — 第1章の完成

- [x] LOAD / STORE 命令のレキサー対応（`[0x10]` 裸数値リテラル）— `parseOperand()` の `LBRACKET` 分岐に `IMMEDIATE` チェックを追加
- [x] エラー表示：赤波線（CodeMirror linter 統合）— `@codemirror/lint` の `setDiagnostics` でトークン単位の波線を追加
- [x] ステップ実行の差分ハイライト（変化前→変化後の表示）— `previousSnapshot` を `Cpu` / cpuStore に追加、RegisterView・FlagsView に「旧値 →」表示
- [x] **ストーリー設計** — 教員D・失踪・透明プレイヤー・5章 fade-in アーク・終章ペイオフ（[ARCH0_SPEC.md §8](ARCH0_SPEC.md#8-ストーリー設計) 参照）
- [x] ノートUI インタールード コンポーネント実装（`src/components/note/NoteInterlude.vue`）
- [x] 第1章 インタールード文章執筆（S01〜S07 全ステージ、複数ページ対応）
- [x] 第1章 欄外メモ文章執筆（S01〜S07 全ステージに付与）
- [x] エラー表示 タイプ1（構文エラー：行ハイライト・エラーリスト・提案文）— TaskPanel + CodeEditor
- [x] エラー表示 タイプ2（論理エラー：実際値 vs 期待値の並列表示）— TaskPanel の「現在: N」表示
- [x] ヒント表示（段階的）— `HintPanel.vue`、右ペインのタブ（メモリ・スタック / ヒント）
- [x] 進捗保存（`src/stores/progress.ts` + pinia-plugin-persistedstate）
- [x] 第1章ステージデータ S01〜S06 — C言語との対比ヒント・`initialSource`・`instruction_used` 条件を含む（S07=ループは第3章へ移動）
- [x] オープニング演出（OpeningCard.vue — 黒画面テキスト → インタールード遷移）
- [x] ノートUI 図解（DiagramRegister / DiagramFlags / DiagramAlu / DiagramChain / DiagramSwap / DiagramLoop）

### 追加実装（Phase 3 中に判明・完了）

- [x] `instruction_used` クリア条件 — 使用命令をスナップショットで追跡、ヘッダーに「使用すべき命令」チップ表示
- [x] ヘッダー命令チップのホバーツールチップ — 構文 + 一行説明（全命令分定義済み）
- [x] `initialSource` — エディタの初期コードをステージデータで指定する機能
- [x] フラグパネル改善 — 2×2グリッド・説明をカッコ付きで表示・紫廃止（緑のみ残す）
- [x] レジスタ/フラグのハイライト統一 — タイムアウト消去を廃止し、次ステップまで緑を保持
- [x] 条件付き分岐バグ修正 — BNE等がジャンプしない場合にPCが進まない無限ループを修正（`cpu.ts`）

### リファクタリング（ストーリー実装前の地ならし）

- [x] **データ層の抽出**
  - [x] `INSTRUCTION_INFO` を `src/data/instructions.ts` へ抽出（StageView から24行削減）
  - [x] `Hint` 型を `{ kind: 'hint' \| 'answer', ja, en }` に明示化（暗黙のラスト要素＝答え規約を撤廃）
- [x] **テスト強化** — 26件追加（58→84件）
  - [x] 条件付き分岐 PC インクリメント回帰テスト
  - [x] `instructionsUsed` 追跡・巻き戻し復元
  - [x] LOAD/STORE/CALL/RET/PUSH/POP/SHL/SHR/AND/OR/XOR/NOT
  - [x] `initialRegisters` / `initialMemory` の動作
- [x] **型安全性** — `instructions.ts` の `as AnyRegisterName` キャストを `readRegOrImm()` ヘルパーで型ガードに置換
- [x] **UI 責務分離** — StageView を 804行 → 240行に縮小
  - [x] `StageHeader.vue` — ヘッダー2行（章タイトル・バッジ・課題文・使用すべき命令）
  - [x] `TaskPanel.vue` — クリア条件 + エラーリスト
  - [x] `RightTabs.vue` — メモリ・スタック / ヒント のタブ切り替え
- [x] **共通CSS** — `.section-title` を `style.css` に抽出（CPU パネル5箇所の重複削除）
- [x] **デッドコード削除** — 未使用 emit、未使用 locales（vue-i18n 依存削除）、canGoPrev の死コード

リファクタの方針判断：
- i18n の全面適用は当面スコープ外（日本語コミュニティ向けに集中）
- `parser.ts` の switch 文整理は保留（動作しており触ると壊しやすい）
- エディタ補完候補は全命令常時表示（学習者の発見を妨げないため、ステージ制約はパーサーで担保）

---

## Phase 4 🚧 — 第2〜終章の実装

### 第2章「記憶の断片」（メモリ・LOAD/STORE）

- [x] S01: はじめての書き込み — STORE 基本
- [x] S02: 値を読む — LOAD 基本
- [x] S03: 値を移す — LOAD+STORE のコンビ
- [x] S04: 計算して保存 — read→compute→write の型
- [x] S05: ポインタ — `[Rs]` 間接アドレッシング
- [x] S06: 配列の要素 — `[Rs + n]` オフセット
- [x] S07: 配列をなめる — 手動アンロール（次章のループへの予告）
- [x] S08: 値を交換 — メモリ間スワップ
- [x] S09: 最大値 — メモリ + 分岐の総合
- [x] S10: コピー — 章の総仕上げ
- [x] `chapter2/index.ts` を `StageView` に組み込み
- [ ] 欄外メモ（章全体で 5〜7 個）— 視覚デザイン未確定のため保留

### 第2章で実施した UI 改善（Phase 4 中に完了）

- [x] RegisterView: 16進優先表示（`0x0063 (99)` 形式）
- [x] TaskPanel: memory 条件表示・16進優先表示
- [x] MemoryView: `initialMemory` セルのティール色ハイライト
- [x] NoteInterlude: 複数ページ → 単一スクロール化・章タイトル表示
- [x] NotebookModal: 幅 740px・現在ステージへ自動スクロール
- [x] StageHeader: 章インジケーター＋ステージドットによるナビゲーション UI 実装
  - 章ボタン（✓/▶/○）・ドット（●/◉/○）・‹ › 矢印
  - `useProgressStore` を StageHeader で直接参照することで reactivity バグを修正
  - `right-nav` をヘッダー 2 行分の高さでフルに使う縦分割レイアウトに変更
- [x] 数値表記ポリシー確立：量は 10 進 OK、アドレスは 16 進必須

### 第3章「途切れたページ」（ループ・サブルーチン） — 10ステージ

**スコープ決定：** 再帰は除外。ループとサブルーチンに絞る。完走容易性を優先。

**実装は2フェーズに分割：** B-1 パズル設計 → B-2 インタールード一括執筆

**Phase B-1: パズル設計 ✅**
- [x] S01: 累積加算（既存・interlude あり）
- [x] S02: 配列の合計 — ループ + LOAD
- [x] S03: 配列のコピー — ループ + LOAD/STORE
- [x] S04: 大きい方を取る — BLT/BGE 初出
- [x] S05: 配列の最大値 — ループ + 符号付き比較
- [x] S06: 関数を呼ぶ — CALL/RET 初出
- [x] S07: 引数と戻り値 — R1/R2 呼び出し規約
- [x] S08: レジスタを保存 — PUSH/POP
- [x] S09: ネストした関数 — LR 保存
- [x] S10: 関数を組み合わせる — 章のまとめ

**Phase B-2: インタールード一括執筆（未着手）**
- [ ] §8-10 の物語骨格に沿って S02〜S10 のインタールードを執筆
- [ ] 日付付きエントリは S04（1987/06/14）・S08（1987/08/12）のみ配置
- [ ] 「君」の呼びかけ初出は S09
- [ ] 第4章への引きは S10 末尾

### 第4章以降

各章で必要なストーリー作業（[ARCH0_SPEC.md §8](ARCH0_SPEC.md#8-ストーリー設計) 参照）：

- 章ごとに：インタールード文章執筆（1ページ）＋ 欄外メモ文章執筆（5〜7 個）
- 第3章：物語の重力が強まる転機。欄外メモに日付付き・空白の日を入れる
- 第4章：別れの予感が明確になる語り口
- 終章：「最後のメッセージ」（§8-6）執筆 ＋ クリア後イベントの UI 実装（文の途切れ演出）

---

## Phase 5 📋 — バックエンド・認証（第1章公開後）

**方針：** Supabase（PostgreSQL マネージドサービス）+ Google OAuth でシンプルなバックエンドを構築する。

### 設計方針（決定済み）

- **バックエンド:** Supabase（DB・Auth・REST API が一体。サーバー不要）
- **認証:** Google ログイン（Supabase Auth の OAuth 連携）
- **保存データ:** `useProgressStore` の内容をそのまま1テーブルに永続化

```sql
-- progress テーブル（イメージ）
create table progress (
  user_id      uuid references auth.users primary key,
  cleared_stage_ids  text[]    default '{}',
  seen_interlude_ids text[]    default '{}',
  current_stage_index int      default 0,
  updated_at   timestamptz default now()
);
```

- **フロントエンド変更箇所:** `useProgressStore` の永続化層のみ差し替え（`pinia-plugin-persistedstate` → Supabase API 呼び出し）。Vue コンポーネントは変更不要
- **オフライン対応:** localStorage をキャッシュとして残し、ログアウト中でもプレイ可能にする

### タスク（実装フェーズで分解）

- [ ] Supabase プロジェクト作成・Google OAuth 設定
- [ ] `progress` テーブル作成・Row Level Security 設定
- [ ] `useProgressStore` の永続化層を Supabase に切り替え
- [ ] ログイン/ログアウト UI（シンプルなヘッダーボタン）
- [ ] 未ログイン時は localStorage フォールバック

---

## 判明した課題・メモ

| 日付 | 内容 |
|---|---|
| Phase 1完了 | `ARCH0_SPEC.md` の「PC = メモリアドレス」は実装では「命令インデックス」に変更。仕様書に反映済み |
| Phase 2完了 | ユーザーデータ領域を 0x00〜0x3F（64アドレス）に定義。MemoryView はこの範囲のみ表示。LOAD/STORE はスタック領域含む全アドレス空間にアクセス可能（SP相対引数渡しに必要） |
| Phase 2完了 | `--color-text-muted`（gray-300）をパネルタイトル用に追加。テキスト階層: text > text-muted > text-secondary > text-tertiary |
