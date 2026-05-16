<script setup lang="ts">
import { ref, onMounted } from 'vue'

// コピー状態（2秒でリセット）
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copySource() {
  await navigator.clipboard.writeText(source.value)
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 1200)
}
import CodeEditor from '../components/editor/CodeEditor.vue'
import RegisterView from '../components/cpu/RegisterView.vue'
import FlagsView from '../components/cpu/FlagsView.vue'
import ControlRegsView from '../components/cpu/ControlRegsView.vue'
import MemoryView from '../components/cpu/MemoryView.vue'
import StackView from '../components/cpu/StackView.vue'
import ExecutionControl from '../components/execution/ExecutionControl.vue'
import { useCpuStore } from '../stores/cpu.ts'
import { stage1 } from '../data/stages/chapter1/s01-first-value.ts'

const cpuStore = useCpuStore()

const source = ref('')
const stage = stage1

onMounted(() => {
  cpuStore.loadStage(stage1, source.value)
})

function onSourceChange(val: string) {
  source.value = val
  cpuStore.loadSource(val)
}

function onReset() {
  cpuStore.loadStage(stage1, source.value)
}

function conditionMet(cond: (typeof stage.successConditions)[number]): boolean {
  if (!cpuStore.lastResult) return false
  const snap = cpuStore.lastResult.snapshot
  if (cond.type === 'register') {
    return snap.registers[cond.target as keyof typeof snap.registers] === cond.expected
  }
  return false
}

function currentValue(cond: (typeof stage.successConditions)[number]): string {
  if (cond.type === 'register') {
    const v = cpuStore.snapshot.registers[cond.target as keyof typeof cpuStore.snapshot.registers] as number
    return String(v)
  }
  return '—'
}

// エラー行の PC ラベル
// パースエラーの行は lineToPc に存在しないため、その行より前の命令数を推定 PC とする
function errorPcLabel(errLine: number): string {
  const pc = cpuStore.lineToPc.get(errLine)
  if (pc !== undefined) return `PC ${pc}`
  let count = 0
  for (const srcLine of cpuStore.lineToPc.keys()) {
    if (srcLine < errLine) count++
  }
  return `PC ${count}`
}

// Right panel tab: memory or stack
const rightTab = ref<'memory' | 'stack'>('memory')
</script>

<template>
  <div class="stage-layout">
    <!-- ヘッダー -->
    <header class="stage-header">
      <span class="chapter-label">第1章</span>
      <h1 class="stage-title">{{ stage.title.ja }}</h1>
      <div class="header-spacer" />
      <div v-if="cpuStore.parseErrors.length > 0" class="badge badge-error">
        エラー {{ cpuStore.parseErrors.length }}件
      </div>
      <div v-if="cpuStore.isCleared" class="badge badge-clear">
        ✓ クリア！
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
            @update:model-value="onSourceChange"
          />
        </div>
      </div>

      <!-- 中：CPU状態 + 課題 -->
      <div class="cpu-pane">
        <div class="pane-title">CPU 状態</div>
        <RegisterView />
        <FlagsView />
        <ControlRegsView />

        <!-- 課題パネル -->
        <div class="task-panel">
          <h3 class="section-title">課題</h3>
          <ul class="condition-list">
            <li
              v-for="(cond, i) in stage.successConditions"
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
              <span class="error-line">{{ errorPcLabel(err.line) }}</span>
              {{ err.message.ja }}
              <span v-if="err.suggestion" class="error-suggestion">
                → {{ err.suggestion.ja }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右：メモリ / スタック -->
      <div class="right-pane">
        <div class="tab-bar">
          <button
            class="tab-btn"
            :class="{ active: rightTab === 'memory' }"
            @click="rightTab = 'memory'"
          >
            メモリ
          </button>
          <button
            class="tab-btn"
            :class="{ active: rightTab === 'stack' }"
            @click="rightTab = 'stack'"
          >
            スタック
          </button>
        </div>
        <MemoryView v-show="rightTab === 'memory'" />
        <StackView v-show="rightTab === 'stack'" />
      </div>

    </div>

    <!-- フッター：実行制御 -->
    <ExecutionControl @reset="onReset" />
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

/* ── ヘッダー ── */
.stage-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
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

/* ── メイン3カラム ── */
.stage-main {
  display: grid;
  grid-template-columns: 1.1fr 0.85fr 1.2fr;
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
  color: var(--color-text-secondary);
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

/* ── 中パネル：CPU状態 ── */
.cpu-pane {
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.task-panel {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  flex: 1;
}
.section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin: 0 0 8px;
}
.condition-list {
  list-style: none;
  padding: 0;
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: 13px;
}
.condition-item.met {
  border-color: var(--color-accent-green);
  background: color-mix(in srgb, var(--color-accent-green) 10%, transparent);
}
.condition-check {
  font-size: 14px;
  color: var(--color-accent-green);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.reg { color: var(--color-accent-blue); font-family: monospace; font-weight: 600; }
.op  { color: var(--color-text-secondary); }
.val { color: var(--color-accent-amber); font-family: monospace; }
.actual { color: var(--color-text-tertiary); font-size: 11px; margin-left: 4px; }

.error-list {
  margin-top: 10px;
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

/* ── 右パネル：メモリ/スタック ── */
.right-pane {
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}
.tab-btn {
  flex: 1;
  padding: 7px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.tab-btn:hover {
  color: var(--color-text-secondary);
}
.tab-btn.active {
  color: var(--color-text);
  border-bottom-color: var(--color-accent-blue);
}
</style>
