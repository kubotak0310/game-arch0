# TASKS.md — ARCH-0 開発進捗

> Claude Code が作業前後にこのファイルを読み書きして進捗を管理する。
> 完了したタスクはチェックを入れ、新たに判明したタスクは適切なフェーズに追記する。

---

## 現在のフェーズ: Phase 3 — 第1章の完成

**目標:** ブラウザで `MOV R1, #2` と `MOV R2, #3` を書いて実行ボタンを押すと、レジスタ表示が変わりクリア判定が出る。

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

## Phase 3 🚧 — 第1章の完成

- [ ] LOAD / STORE 命令のレキサー対応（`[0x10]` 裸数値リテラル）
- [ ] エラー表示 タイプ1（構文エラー：赤波線・行アイコン・提案文）
- [ ] エラー表示 タイプ2（論理エラー：実際値vs期待値の並列表示）
- [ ] ステップ実行の差分ハイライト（変化前→変化後の表示）
- [ ] ノートUI インタールード（`src/components/note/NoteInterlude.vue`）
- [x] ヒント表示（段階的）— `HintPanel.vue`、右ペインのタブ（メモリ・スタック / ヒント）
- [ ] 進捗保存（`src/stores/progress.ts` + pinia-plugin-persistedstate）
- [x] 第1章ステージデータ S01〜S07 — C言語との対比ヒント・`initialSource`・`instruction_used` 条件を含む

### 追加実装（Phase 3 中に判明・完了）

- [x] `instruction_used` クリア条件 — 使用命令をスナップショットで追跡、ヘッダーに「使用すべき命令」チップ表示
- [x] ヘッダー命令チップのホバーツールチップ — 構文 + 一行説明（全命令分定義済み）
- [x] `initialSource` — エディタの初期コードをステージデータで指定する機能
- [x] フラグパネル改善 — 2×2グリッド・説明をカッコ付きで表示・紫廃止（緑のみ残す）
- [x] レジスタ/フラグのハイライト統一 — タイムアウト消去を廃止し、次ステップまで緑を保持
- [x] 条件付き分岐バグ修正 — BNE等がジャンプしない場合にPCが進まない無限ループを修正（`cpu.ts`）

---

## Phase 4 📋 — 第2〜終章の実装

フェーズ3と同じパターンを章ごとに繰り返す。詳細は実装が近づいてから分解する。

---

## 判明した課題・メモ

| 日付 | 内容 |
|---|---|
| Phase 1完了 | `[addr]` 直接アドレス記法（`[0x10]`形式）はレキサー未対応。Phase 3 の LOAD/STORE 実装時に追加が必要 |
| Phase 1完了 | `ARCH0_SPEC.md` の「PC = メモリアドレス」は実装では「命令インデックス」に変更。仕様書に反映済み |
| Phase 2完了 | ユーザーデータ領域を 0x00〜0x3F（64アドレス）に定義。MemoryView はこの範囲のみ表示。LOAD/STORE はスタック領域含む全アドレス空間にアクセス可能（SP相対引数渡しに必要） |
| Phase 2完了 | `--color-text-muted`（gray-300）をパネルタイトル用に追加。テキスト階層: text > text-muted > text-secondary > text-tertiary |
