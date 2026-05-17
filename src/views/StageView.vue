<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDebugMode } from '../composables/useDebugMode.ts'
import CodeEditor from '../components/editor/CodeEditor.vue'
import RegisterView from '../components/cpu/RegisterView.vue'
import FlagsView from '../components/cpu/FlagsView.vue'
import ControlRegsView from '../components/cpu/ControlRegsView.vue'
import MemoryView from '../components/cpu/MemoryView.vue'
import StackView from '../components/cpu/StackView.vue'
import ExecutionControl from '../components/execution/ExecutionControl.vue'
import ClearModal from '../components/stage/ClearModal.vue'
import HintPanel from '../components/stage/HintPanel.vue'
import { useCpuStore } from '../stores/cpu.ts'
import { chapter1Stages } from '../data/stages/chapter1/index.ts'
import type { SuccessCondition } from '../core/stages/types.ts'

const cpuStore = useCpuStore()
const { isDebugMode } = useDebugMode()

const allStages = chapter1Stages
const currentStageIndex = ref(0)
const currentStage = computed(() => allStages[currentStageIndex.value])

// クリア進捗（セッション中のみ）
const clearedStageIds = ref(new Set<string>())
const showClearModal = ref(false)

// 初めてクリアしたときだけモーダル表示
watch(() => cpuStore.isCleared, (cleared) => {
  if (cleared && !clearedStageIds.value.has(currentStage.value.id)) {
    clearedStageIds.value.add(currentStage.value.id)
    showClearModal.value = true
  }
})

// ナビゲーション制限（デバッグモード以外）
const canGoPrev = computed(() =>
  currentStageIndex.value > 0 &&
  (isDebugMode.value || true)  // クリア済みを戻るのは常に許可
)
const canGoNext = computed(() =>
  currentStageIndex.value < allStages.length - 1 &&
  (isDebugMode.value || clearedStageIds.value.has(currentStage.value.id))
)
const hasNextStage = computed(() => currentStageIndex.value < allStages.length - 1)

const rightTab = ref<'memory' | 'hint'>('memory')

const source = ref('')

// コピー状態（2秒でリセット）
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copySource() {
  await navigator.clipboard.writeText(source.value)
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 1200)
}

onMounted(() => {
  const init = currentStage.value.initialSource ?? ''
  source.value = init
  cpuStore.loadStage(currentStage.value, init)
})

watch(currentStageIndex, () => {
  const init = currentStage.value.initialSource ?? ''
  source.value = init
  rightTab.value = 'memory'
  cpuStore.loadStage(currentStage.value, init)
})

function onSourceChange(val: string) {
  source.value = val
  cpuStore.loadSource(val)
}

function goToPrev() {
  if (canGoPrev.value) currentStageIndex.value--
}

function goToNext() {
  if (canGoNext.value) currentStageIndex.value++
}

function onClearNext() {
  showClearModal.value = false
  if (hasNextStage.value) currentStageIndex.value++
}

function onClearReview() {
  showClearModal.value = false
}

// instruction_used はリアルタイム（ステップ実行中も即座にグリーン）
// register 系は lastResult（HALT時の値）で判定
function conditionMet(cond: SuccessCondition): boolean {
  if (cond.type === 'instruction_used') {
    return cpuStore.snapshot.instructionsUsed.includes(cond.op)
  }
  if (!cpuStore.lastResult) return false
  const snap = cpuStore.lastResult.snapshot
  if (cond.type === 'register') {
    return snap.registers[cond.target as keyof typeof snap.registers] === cond.expected
  }
  return false
}

function currentValue(cond: SuccessCondition): string {
  if (cond.type === 'register') {
    const v = cpuStore.snapshot.registers[cond.target as keyof typeof cpuStore.snapshot.registers] as number
    return String(v)
  }
  return '—'
}

// ヘッダー表示用: 命令条件と値条件に分ける
const requiredInstructions = computed(() =>
  currentStage.value.successConditions.filter(
    (c): c is Extract<SuccessCondition, { type: 'instruction_used' }> => c.type === 'instruction_used',
  )
)

const allConditionsMet = computed(() =>
  currentStage.value.successConditions.every(conditionMet)
)

// エラー行番号リスト（エディタハイライト用）
const errorLinesForEditor = computed(() =>
  cpuStore.parseErrors.map(e => e.line)
)

const INSTRUCTION_INFO: Record<string, { syntax: string; desc: string }> = {
  MOV:  { syntax: 'MOV Rd, Rs / Rd, imm',  desc: 'レジスタに値をコピー' },
  ADD:  { syntax: 'ADD Rd, Rs1, Rs2',       desc: '加算: Rd = Rs1 + Rs2' },
  SUB:  { syntax: 'SUB Rd, Rs1, Rs2',       desc: '減算: Rd = Rs1 - Rs2' },
  CMP:  { syntax: 'CMP Rs1, Rs2',           desc: 'Rs1 - Rs2 を計算しフラグを更新（等しければ Z=1）' },
  BEQ:  { syntax: 'BEQ label',             desc: '等しければ(Z==1) label へジャンプ' },
  BNE:  { syntax: 'BNE label',             desc: '等しくなければ(Z==0) label へジャンプ' },
  BLT:  { syntax: 'BLT label',             desc: 'より小さければ label へジャンプ' },
  BGT:  { syntax: 'BGT label',             desc: 'より大きければ label へジャンプ' },
  BLE:  { syntax: 'BLE label',             desc: '以下なら label へジャンプ' },
  BGE:  { syntax: 'BGE label',             desc: '以上なら label へジャンプ' },
  JMP:  { syntax: 'JMP label',             desc: '無条件で label へジャンプ' },
  CALL: { syntax: 'CALL label',            desc: 'サブルーチン呼び出し（戻り先を LR に保存）' },
  RET:  { syntax: 'RET',                   desc: 'サブルーチンから返る（LR へジャンプ）' },
  PUSH: { syntax: 'PUSH Rs',              desc: 'スタックに Rs を積む' },
  POP:  { syntax: 'POP Rd',               desc: 'スタックから取り出して Rd に格納' },
  AND:  { syntax: 'AND Rd, Rs1, Rs2',      desc: 'ビット AND: Rd = Rs1 & Rs2' },
  OR:   { syntax: 'OR Rd, Rs1, Rs2',       desc: 'ビット OR: Rd = Rs1 | Rs2' },
  XOR:  { syntax: 'XOR Rd, Rs1, Rs2',      desc: 'ビット XOR: Rd = Rs1 ^ Rs2' },
  NOT:  { syntax: 'NOT Rd, Rs',            desc: 'ビット反転: Rd = ~Rs' },
  SHL:  { syntax: 'SHL Rd, Rs, n',         desc: '左シフト: Rd = Rs << n' },
  SHR:  { syntax: 'SHR Rd, Rs, n',         desc: '右シフト: Rd = Rs >> n' },
  HALT: { syntax: 'HALT',                  desc: 'プログラムを停止' },
}

function getInstructionInfo(op: string) {
  return INSTRUCTION_INFO[op] ?? { syntax: op, desc: '' }
}


</script>

<template>
  <div class="stage-layout">
    <!-- ヘッダー（2行） -->
    <header class="stage-header">
      <!-- 行1: 章・タイトル・バッジ・ナビ -->
      <div class="header-row1">
        <span class="chapter-label">第{{ currentStage.chapter }}章</span>
        <h1 class="stage-title">{{ currentStage.title.ja }}</h1>
        <div class="header-spacer" />
        <div v-if="cpuStore.parseErrors.length > 0" class="badge badge-error">
          エラー {{ cpuStore.parseErrors.length }}件
        </div>
        <div v-if="cpuStore.isCleared" class="badge badge-clear">
          ✓ クリア！
        </div>
        <div v-if="isDebugMode" class="badge badge-debug">
          DEBUG
        </div>
        <!-- ステージナビゲーション -->
        <div class="stage-nav">
          <button class="nav-btn" :disabled="!canGoPrev" @click="goToPrev">‹</button>
          <span class="stage-counter">{{ currentStageIndex + 1 }} / {{ allStages.length }}</span>
          <button class="nav-btn" :disabled="!canGoNext" @click="goToNext">›</button>
        </div>
      </div>
      <!-- 行2: 課題文 + 使用すべき命令 + 期待値チップ -->
      <div class="header-row2">
        <span class="objective-label">課題</span>
        <span class="objective-text">{{ currentStage.objective.ja }}</span>
        <div v-if="requiredInstructions.length > 0" class="required-instructions">
          <span class="required-label">使用すべき命令:</span>
          <span
            v-for="cond in requiredInstructions"
            :key="cond.op"
            class="chip-wrapper"
          >
            <span
              class="instruction-chip"
              :class="{ met: conditionMet(cond) }"
            >{{ cond.op }}</span>
            <div class="chip-tooltip">
              <span class="tooltip-syntax">{{ getInstructionInfo(cond.op).syntax }}</span>
              <span class="tooltip-desc">{{ getInstructionInfo(cond.op).desc }}</span>
            </div>
          </span>
        </div>
      </div>
    </header>

    <!-- メイン3カラム -->
    <div class="stage-main">

      <!-- 左：コードエディタ -->
      <div class="editor-pane">
        <div class="pane-title">
          <span>アセンブラ</span>
          <button
            class="icon-btn"
            :class="{ copied }"
            :title="copied ? 'コピーしました' : 'クリップボードにコピー'"
            @click="copySource"
          >
            <span class="material-symbols-rounded" :style="{ visibility: copied ? 'hidden' : 'visible' }">content_copy</span>
            <span v-if="copied" class="copied-label">Copied</span>
          </button>
        </div>
        <div class="editor-body">
          <CodeEditor
            :model-value="source"
            :active-line="cpuStore.activeLine"
            :line-to-pc="cpuStore.lineToPc"
            :error-lines="errorLinesForEditor"
            @update:model-value="onSourceChange"
          />
        </div>
      </div>

      <!-- 中：CPU状態 + 課題パネル（独立） -->
      <div class="center-column">

        <!-- CPU状態パネル -->
        <div class="cpu-pane">
          <div class="pane-title">CPU 状態</div>
          <RegisterView />
          <FlagsView />
          <ControlRegsView />
        </div>

        <!-- 課題パネル（独立・アンバー） -->
        <div class="task-panel" :class="{ cleared: allConditionsMet }">
          <div class="task-panel-header">
            <span class="task-panel-title">クリア条件</span>
          </div>
          <ul class="condition-list">
            <li
              v-for="(cond, i) in currentStage.successConditions"
              :key="i"
              class="condition-item"
              :class="{ met: conditionMet(cond) }"
            >
              <span class="condition-check">{{ conditionMet(cond) ? '✓' : '○' }}</span>
              <span class="condition-text">
                <template v-if="cond.type === 'register'">
                  <span class="reg">{{ cond.target }}</span>
                  <span class="op"> = </span>
                  <span class="val">{{ cond.expected }}</span>
                  <span v-if="cpuStore.lastResult" class="actual">
                    （現在: {{ currentValue(cond) }}）
                  </span>
                </template>
                <template v-else-if="cond.type === 'instruction_used'">
                  <span class="inst-name">{{ cond.op }}</span>
                  <span class="op"> 命令を使用すること</span>
                </template>
              </span>
            </li>
          </ul>

          <!-- パースエラー -->
          <div v-if="cpuStore.parseErrors.length > 0" class="error-list">
            <div
              v-for="(err, i) in cpuStore.parseErrors"
              :key="i"
              class="error-item"
            >
              <span class="error-line">行 {{ err.line }}</span>
              {{ err.message.ja }}
              <span v-if="err.suggestion" class="error-suggestion">
                → {{ err.suggestion.ja }}
              </span>
            </div>
          </div>
        </div>

      </div>

      <!-- 右：タブ切り替え（メモリ / スタック / ヒント） -->
      <div class="right-pane">
        <div class="right-tabs">
          <button
            class="right-tab"
            :class="{ active: rightTab === 'memory' }"
            @click="rightTab = 'memory'"
          >メモリ・スタック</button>
          <button
            class="right-tab"
            :class="{ active: rightTab === 'hint' }"
            @click="rightTab = 'hint'"
          >ヒント</button>
        </div>
        <template v-if="rightTab === 'memory'">
          <MemoryView />
          <div class="right-divider" />
          <StackView />
        </template>
        <HintPanel
          v-else
          :hints="currentStage.hints"
          :stage-id="currentStage.id"
        />
      </div>

    </div>

    <!-- フッター：実行制御 -->
    <ExecutionControl />

    <!-- クリアモーダル -->
    <ClearModal
      v-if="showClearModal"
      :stage="currentStage"
      :has-next="hasNextStage"
      @next="onClearNext"
      @review="onClearReview"
    />
  </div>
</template>

<style scoped>
.stage-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
}

/* ── ヘッダー（2行） ── */
.stage-header {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.header-row1 {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px 6px;
}

.header-row2 {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 7px;
}

.objective-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-amber);
  flex-shrink: 0;
}

.objective-text {
  font-size: 14px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.required-instructions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  margin-left: 8px;
}

.required-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.instruction-chip {
  font-size: 12px;
  font-family: ui-monospace, monospace;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-accent-blue) 12%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent);
  color: var(--color-accent-blue);
  transition: background 0.25s, border-color 0.25s, color 0.25s;
}

.instruction-chip.met {
  background: color-mix(in srgb, var(--color-accent-green) 12%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent-green) 30%, transparent);
  color: var(--color-accent-green);
}

.chip-wrapper {
  position: relative;
}

.chip-tooltip {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 10px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.chip-wrapper:hover .chip-tooltip {
  opacity: 1;
}

.tooltip-syntax {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-accent-blue);
}

.tooltip-desc {
  font-size: 13px;
  color: var(--color-text);
}


.chapter-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-border);
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.stage-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}
.header-spacer {
  flex: 1;
}
.badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid;
  font-weight: 600;
  flex-shrink: 0;
}
.badge-error {
  color: var(--color-accent-coral);
  background: color-mix(in srgb, var(--color-accent-coral) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-accent-coral) 30%, transparent);
}
.badge-clear {
  color: var(--color-accent-green);
  background: color-mix(in srgb, var(--color-accent-green) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-accent-green) 30%, transparent);
}
.badge-debug {
  color: var(--color-accent-amber);
  background: color-mix(in srgb, var(--color-accent-amber) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-accent-amber) 30%, transparent);
  font-size: 10px;
  letter-spacing: 0.08em;
}

/* ── ステージナビゲーション ── */
.stage-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  line-height: 1;
}
.nav-btn:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-border);
  border-color: var(--color-text-tertiary);
}
.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
.stage-counter {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  min-width: 36px;
  text-align: center;
}

/* ── メイン3カラム ── */
.stage-main {
  display: grid;
  grid-template-columns: 1.4fr 0.85fr 1.0fr;
  flex: 1;
  overflow: hidden;
  padding: 8px;
  gap: 8px;
}

.pane-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  padding: 6px 8px 6px 12px;
  background: var(--color-surface-2);
  border-bottom: 1px solid var(--color-border);
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  line-height: 1;
}
.icon-btn:hover {
  color: var(--color-text);
  background: var(--color-border);
}
.icon-btn.copied {
  color: var(--color-accent-green);
}
.copied-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  animation: fade-in 0.15s ease;
}
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
.icon-btn .material-symbols-rounded {
  font-size: 20px;
}

.editor-pane {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.editor-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── 中カラム ── */
.center-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  min-height: 0;
}

/* ── 課題パネル（独立・アンバー） ── */
.task-panel {
  background: color-mix(in srgb, var(--color-accent-amber) 8%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 30%, transparent);
  border-radius: 8px;
  padding: 0 0 10px;
  flex-shrink: 0;
  transition: background 0.3s, border-color 0.3s;
}

.task-panel.cleared {
  background: color-mix(in srgb, var(--color-accent-green) 8%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent-green) 30%, transparent);
}

.task-panel-header {
  padding: 6px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent-amber) 20%, transparent);
  margin-bottom: 8px;
  border-radius: 8px 8px 0 0;
}

.task-panel.cleared .task-panel-header {
  border-bottom-color: color-mix(in srgb, var(--color-accent-green) 20%, transparent);
}

.task-panel-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-amber);
}

.task-panel.cleared .task-panel-title {
  color: var(--color-accent-green);
}

.condition-list {
  list-style: none;
  padding: 0 10px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.condition-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent-amber) 5%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 20%, transparent);
  font-size: 13px;
  transition: background 0.25s, border-color 0.25s;
}
.condition-item.met {
  border-color: var(--color-accent-green);
  background: color-mix(in srgb, var(--color-accent-green) 10%, transparent);
}
.condition-check {
  font-size: 14px;
  color: var(--color-accent-amber);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  transition: color 0.25s;
}
.condition-item.met .condition-check {
  color: var(--color-accent-green);
}
.reg       { color: var(--color-accent-blue);  font-family: monospace; font-weight: 600; }
.inst-name { color: var(--color-accent-blue);  font-family: monospace; font-weight: 700; }
.op        { color: var(--color-text-secondary); }
.val       { color: var(--color-accent-amber); font-family: monospace; font-size: 14px; font-weight: 700; }
.actual    { color: var(--color-text-tertiary); font-size: 11px; margin-left: 4px; }

.error-list {
  margin: 8px 10px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.error-item {
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent-coral) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent-coral) 25%, transparent);
  color: var(--color-accent-coral);
  line-height: 1.5;
}
.error-line {
  font-weight: 600;
  margin-right: 6px;
  color: var(--color-accent-amber);
}
.error-suggestion {
  display: block;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

/* ── 中パネル：CPU状態 ── */
.cpu-pane {
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  flex: 1;
  min-height: 0;
}

/* ── 右パネル：タブ切り替え ── */
.right-pane {
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.right-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  flex-shrink: 0;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

.right-tab {
  flex: 1;
  padding: 7px 0 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  border-right: 1px solid var(--color-border);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.right-tab:last-child {
  border-right: none;
}

.right-tab:hover:not(.active) {
  color: var(--color-text-secondary);
}

.right-tab.active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent-blue);
}

.right-divider {
  height: 1px;
  background: var(--color-border);
  flex-shrink: 0;
}
</style>
