# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**ARCH-0** はアセンブラプログラミングを学ぶブラウザ動作の教育ゲーム。プレイヤーはカスタム16ビットCPU「ARCH-0」のコードを書いてパズルを解く。

- **[ARCH0_SPEC.md](ARCH0_SPEC.md)** — ゲーム・アーキテクチャの完全仕様書。実装判断が仕様と乖離した場合（制約の発見、設計変更など）は都度更新すること。
- **[TASKS.md](TASKS.md)** — フェーズ別タスク一覧。セッション開始時に読み、完了したタスクはチェックを入れること。

---

## コマンド

```bash
npm run dev           # Vite 開発サーバー起動
npm test              # 全テスト実行（Vitest、シングルラン）
npm run test:watch    # ウォッチモード（TDD向け）
npm run build         # 型チェック + Vite ビルド（vue-tsc -b && vite build）
npm run typecheck:tests  # tests/ + src/core/ のみ型チェック

# 特定ファイルのみテスト
npx vitest run tests/core/cpu.test.ts

# テスト名でフィルター
npx vitest run -t "MOV"
```

TypeScript 設定は用途別に分離されている：
- `tsconfig.app.json` — Vue アプリ（`src/**`）
- `tsconfig.test.json` — CPUコアのテスト（`src/core/**` + `tests/**`）、`types: ["vitest/globals"]`、DOM libなし
- `tsconfig.node.json` — Vite 設定ファイル用

---

## アーキテクチャ

### レイヤー分離（最重要）

`src/core/` は **Vue に一切依存しない純粋な TypeScript** で実装する。Vue コンポーネントは `src/components/` と `src/views/`、Pinia ストアは `src/stores/` に置く。

```
src/core/           ← 純粋 TS の CPU シミュレータ（Vue のインポート禁止）
  assembler/
    types.ts        Token・LexerError 型（アセンブラ内部専用）
    lexer.ts        ソーステキスト → Token[]
    parser.ts       Token[] → ParseResult（2パス：ラベル収集 → 解決）
  cpu/
    types.ts        全共有型（CpuSnapshot, Instruction, Operand など）
    memory.ts       Uint16Array ラッパー（clone / loadSnapshot）
    instructions.ts executeInstruction() + MutableCpuState インターフェース
    cpu.ts          Cpu クラス + execute() 便利関数

tests/core/         ← src/core/ のユニットテスト（Vitest）
src/stores/         ← Pinia ストア（未作成）
src/components/     ← Vue コンポーネント（未作成）
src/views/          ← Vue ページ（未作成）
```

### CPU 実行モデル

**PC は命令インデックス（0始まり）であり、バイトアドレスではない。** 命令はパース済みの `Instruction[]` として保持し、64KB メモリ空間にはロードしない。メモリ空間（0x0000〜0xFFFF）は `LOAD`/`STORE` によるデータアクセスにのみ使用する。

`Cpu.stepForward()`（[src/core/cpu/cpu.ts](src/core/cpu/cpu.ts)）の実行フロー：
1. `instructions[pc]` を取得
2. `MutableCpuState` を `executeInstruction()` に渡す
3. ジャンプ命令以外は PC をインクリメント（ジャンプ命令: `BEQ` `BNE` `BLT` `BGT` `BLE` `BGE` `JMP` `CALL` `RET`）
4. スナップショットを取得して履歴に追加

`stepBackward()` は `_historyIndex` をデクリメントして `_history[]` から復元する（最大1000件）。巻き戻し後に `stepForward()` すると、未来の履歴は破棄される。

### アセンブラパイプライン

```
ソース文字列
  → tokenize()   (lexer.ts)   → { tokens: Token[], errors: LexerError[] }
  → parse()      (parser.ts)  → { instructions: Instruction[], labels: Map<string,number>, errors: ParseError[] }
  → Cpu.load()   (cpu.ts)     命令を格納、状態リセット、初期スナップショット保存
```

すべての識別子（ニーモニック・レジスタ名・ラベル名）はレキサーが**大文字に正規化**する。`loop:` と `LOOP:` は同一ラベル。`labels` Map のキーは常に大文字。

### 型の制約

- 汎用レジスタは R0〜R4 の5本（[types.ts](src/core/cpu/types.ts)）。R0=0 ルールは Phase 4 で廃止（経緯は ARCH0_SPEC.md §3-1 参照）
- 呼び出し規約：R0/R1 が引数・戻り値（caller-saved）、R2 が caller-saved スクラッチ、R3/R4 が callee-saved
- すべての値は書き込み時に `& 0xFFFF` でマスク
- `CpuSnapshot.memory` は常に**コピー**（`new Uint16Array(...)`）— 参照渡し禁止
- `ParseError.message` は必ず `{ ja: string; en: string }` の両言語セット

### TypeScript の厳格設定

`noUnusedLocals`・`noUnusedParameters`・`erasableSyntaxOnly`（`enum` 禁止 → union string 型を使う）・`noFallthroughCasesInSwitch` が有効。型のみのインポートは `import type` を使うこと（`verbatimModuleSyntax: true`）。`switch` 文の `default` には `assertNever` パターンで網羅性を担保すること。

---

## 作業ルール

- **UI・仕様に関わる実装は、先に方針を提示してユーザーの確認を取ってから実装する。** 複数の選択肢がある場合（表示タイミング、レイアウト、色、動作など）は実装前に必ず相談すること。

## コメント方針

このプロジェクトでは **教育目的でソースを読まれることを前提に、日本語コメントを積極的に付ける**。
グローバルの「コメントは原則書かない」方針より、本プロジェクトの本方針を優先する。

- **JSDoc**：全 export 関数・公開クラス・公開メソッドの先頭に付与する。
  - 1行目に概要、必要に応じて `@param` `@returns` を記述。
  - 引数の意味が型名から自明でない場合のみ `@param` を書く（冗長な説明は避ける）。
- **インラインコメント**：以下のケースで日本語で簡潔に付ける。
  - 分岐や状態遷移の **WHY**（仕様根拠・隠れた制約）
  - 非自明な計算式（例：`& 0xFFFF` のマスク理由）
  - パイプライン上のフェーズ説明（例：「2パスの1パス目：ラベル収集」）
- **書かないコメント**：識別子で読める処理、変更理由・PR番号・コミット履歴の言及、自明な型注釈の再掲。

---

## 開発フェーズ

詳細は ARCH0_SPEC.md §11 と TASKS.md を参照。

- **Phase 1** ✅ — `src/core/` CPU シミュレータ + ユニットテスト（完了）
- **Phase 2** 🚧 — 最小限 UI：Vue 配線・CodeMirror エディタ・レジスタ表示・ステージ1プレイ可能
- **Phase 3** 📋 — 第1章完成（エラー表示・ステップUI・ノートUI・進捗保存）
- **Phase 4** 📋 — 第2〜終章の実装

---

## Phase 2 着手時の注意

- Pinia ストアは `src/core/cpu/cpu.ts` の `Cpu` クラスをラップする。CPU ロジックをストア層に重複実装しないこと。
- `LOAD`/`STORE`（第2章）を実装する際は、レキサーに `[...]` 内の裸の数値リテラル（`[0x10]` 形式）のトークン化を追加する必要がある。現状は `[Rs]`・`[Rs + n]` のみ対応。
