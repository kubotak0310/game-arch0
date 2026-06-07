<script setup lang="ts">
/**
 * ステージプレイ画面のルートビュー。
 *
 * 3 カラムレイアウト：
 * - 左：CodeEditor（コードを書く）
 * - 中：CPU 状態（レジスタ・フラグ・制御レジスタ）＋ TaskPanel（クリア条件）
 * - 右：メモリ／スタック または ヒント（タブ切替）
 *
 * 主な責務：
 * - 全章ステージを連結したフラットなインデックス（`currentStageIndex`）の管理
 * - ステージ切替時の CPU 初期化と初期ソース投入
 * - クリア検知 → ClearModal 表示／インタールード表示／オープニングカード
 */
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
import NoteInterlude from '../components/note/NoteInterlude.vue'
import NotebookModal from '../components/note/NotebookModal.vue'
import OpeningCard from '../components/OpeningCard.vue'
import { useCpuStore } from '../stores/cpu.ts'
import { useProgressStore } from '../stores/progress.ts'
import { chapter1Stages } from '../data/stages/chapter1/index.ts'
import { chapter2Stages } from '../data/stages/chapter2/index.ts'
import { chapter3Stages } from '../data/stages/chapter3/index.ts'

const cpuStore = useCpuStore()
const progress = useProgressStore()
const { isDebugMode } = useDebugMode()

const allStages = [...chapter1Stages, ...chapter2Stages, ...chapter3Stages]
const currentStageIndex = computed({
  get: () => progress.currentStageIndex,
  set: (v) => { progress.currentStageIndex = v },
})
const currentStage = computed(() => allStages[currentStageIndex.value])

interface ChapterStageInfo {
  globalIndex: number
  id: string
  isCurrent: boolean
}
interface ChapterGroup {
  chapter: number
  firstIndex: number
  stages: ChapterStageInfo[]
}

/**
 * ステージ一覧を章ごとにグループ化して、ヘッダーのインジケータに渡す。
 * 章開始時のフラットインデックス（`firstIndex`）を持つことで「章ジャンプ可否」を簡単に判定できる。
 */
const chapterGroups = computed<ChapterGroup[]>(() => {
  const map = new Map<number, ChapterGroup>()
  allStages.forEach((stage, idx) => {
    if (!map.has(stage.chapter)) {
      map.set(stage.chapter, { chapter: stage.chapter, firstIndex: idx, stages: [] })
    }
    map.get(stage.chapter)!.stages.push({
      globalIndex: idx,
      id: stage.id,
      isCurrent: idx === currentStageIndex.value,
    })
  })
  return [...map.values()]
})

function goToStage(index: number) {
  if (index >= 0 && index < allStages.length) currentStageIndex.value = index
}

const showClearModal = ref(false)
const showInterlude = ref(false)
const showOpeningCard = ref(true)
const showNotebook = ref(false)
const darkBackdrop = ref(true)

const notebookEntries = computed(() =>
  allStages
    .filter(s => s.interlude && progress.isInterludeSeen(s.id))
    .map(s => ({ stage: s, pages: s.interlude!.ja }))
)

/** 当該ステージに未読インタールードがあれば表示状態にする（オープニング完了後・ステージ遷移後に呼ぶ）。 */
function maybeShowInterlude() {
  const stage = currentStage.value
  showInterlude.value = !!stage.interlude && !progress.isInterludeSeen(stage.id)
}

/** インタールード閉じ。既読フラグを立て、以降は同じステージで再表示されなくする。 */
function dismissInterlude() {
  darkBackdrop.value = false
  progress.markInterludeSeen(currentStage.value.id)
  showInterlude.value = false
}

// 初クリア検知：すでに過去にクリア済みのステージを再プレイしてもモーダルは出さない（祝賀は初回のみ）
watch(() => cpuStore.isCleared, (cleared) => {
  if (cleared && !progress.isCleared(currentStage.value.id)) {
    progress.markCleared(currentStage.value.id)
    showClearModal.value = true
  }
})

const canGoPrev = computed(() => currentStageIndex.value > 0)
const canGoNext = computed(() =>
  currentStageIndex.value < allStages.length - 1 &&
  (isDebugMode.value || progress.isCleared(currentStage.value.id))
)
const hasNextStage = computed(() => currentStageIndex.value < allStages.length - 1)

const source = ref('')

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

/** 現在のソースをクリップボードにコピーし、1.2 秒間「Copied」ラベルを出す。 */
async function copySource() {
  await navigator.clipboard.writeText(source.value)
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 1200)
}

onMounted(() => {
  // 初回マウント時のみ：ステージの初期ソースをエディタとCPUに同時投入する。
  // インタールードはオープニングカードの @after-leave で表示するため、ここでは触らない。
  const init = currentStage.value.initialSource ?? ''
  source.value = init
  cpuStore.loadStage(currentStage.value, init)
})

watch(currentStageIndex, () => {
  const init = currentStage.value.initialSource ?? ''
  source.value = init
  cpuStore.loadStage(currentStage.value, init)
  maybeShowInterlude()
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

</script>

<template>
  <div class="stage-layout">
    <StageHeader
      :stage="currentStage"
      :current-index="currentStageIndex"
      :total-stages="allStages.length"
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      :chapter-groups="chapterGroups"
      @go-prev="goToPrev"
      @go-next="goToNext"
      @go-to-stage="goToStage"
      @open-notebook="showNotebook = true"
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
            :parse-errors="cpuStore.parseErrors"
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

    <NoteInterlude
      v-if="showInterlude && currentStage.interlude"
      :interlude="currentStage.interlude"
      :stage="currentStage"
      :dark-backdrop="darkBackdrop"
      @start="dismissInterlude"
    />

    <NotebookModal
      v-if="showNotebook"
      :entries="notebookEntries"
      :current-stage-id="currentStage.id"
      @close="showNotebook = false"
    />

    <Transition name="opening" @after-leave="maybeShowInterlude">
      <OpeningCard v-if="showOpeningCard" @done="showOpeningCard = false" />
    </Transition>
  </div>
</template>

<style scoped>
.opening-leave-active { transition: opacity 0.6s ease; }
.opening-leave-to { opacity: 0; }

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
