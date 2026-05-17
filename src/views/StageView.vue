<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useDebugMode } from '../composables/useDebugMode.ts'
import CodeEditor from '../components/editor/CodeEditor.vue'
import RegisterView from '../components/cpu/RegisterView.vue'
import FlagsView from '../components/cpu/FlagsView.vue'
import ControlRegsView from '../components/cpu/ControlRegsView.vue'
import ExecutionControl from '../components/execution/ExecutionControl.vue'
import ClearModal from '../components/stage/ClearModal.vue'
import StageHeader from '../components/stage/StageHeader.vue'
import TaskPanel from '../components/stage/TaskPanel.vue'
import RightTabs from '../components/stage/RightTabs.vue'
import { useCpuStore } from '../stores/cpu.ts'
import { chapter1Stages } from '../data/stages/chapter1/index.ts'

const cpuStore = useCpuStore()
const { isDebugMode } = useDebugMode()

const allStages = chapter1Stages
const currentStageIndex = ref(0)
const currentStage = computed(() => allStages[currentStageIndex.value])

const clearedStageIds = ref(new Set<string>())
const showClearModal = ref(false)

watch(() => cpuStore.isCleared, (cleared) => {
  if (cleared && !clearedStageIds.value.has(currentStage.value.id)) {
    clearedStageIds.value.add(currentStage.value.id)
    showClearModal.value = true
  }
})

const canGoPrev = computed(() => currentStageIndex.value > 0)
const canGoNext = computed(() =>
  currentStageIndex.value < allStages.length - 1 &&
  (isDebugMode.value || clearedStageIds.value.has(currentStage.value.id))
)
const hasNextStage = computed(() => currentStageIndex.value < allStages.length - 1)

const source = ref('')

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

const errorLinesForEditor = computed(() =>
  cpuStore.parseErrors.map(e => e.line)
)
</script>

<template>
  <div class="stage-layout">
    <StageHeader
      :stage="currentStage"
      :current-index="currentStageIndex"
      :total-stages="allStages.length"
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      @go-prev="goToPrev"
      @go-next="goToNext"
    />

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

      <!-- 中：CPU状態 + 課題パネル -->
      <div class="center-column">
        <div class="cpu-pane">
          <div class="pane-title">CPU 状態</div>
          <RegisterView />
          <FlagsView />
          <ControlRegsView />
        </div>
        <TaskPanel :stage="currentStage" />
      </div>

      <!-- 右：タブ切り替え -->
      <RightTabs
        :hints="currentStage.hints"
        :stage-id="currentStage.id"
      />
    </div>

    <ExecutionControl />

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

.stage-main {
  display: grid;
  grid-template-columns: 1.4fr 0.85fr 1.0fr;
  grid-template-rows: minmax(0, 1fr);
  flex: 1;
  min-height: 0;
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

.center-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  min-height: 0;
}

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
</style>
