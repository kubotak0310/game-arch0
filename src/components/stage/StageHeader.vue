<script setup lang="ts">
/**
 * ステージ画面上部のヘッダー。
 *
 * 含む情報：
 * - 章・ステージ名・課題テキスト
 * - 使用すべき命令（クリア条件 `instruction_used`）のチップ列＋ホバーで構文ヘルプ
 * - クリア／エラー／デバッグの状態バッジ
 * - 右側に章ごとの進捗インジケータとステージドット（クリック可ナビゲーション）
 *
 * 親（`StageView`）が章・ステージ移動を実際に行うため、ここはイベントを emit するのみ。
 */
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useProgressStore } from '../../stores/progress.ts'
import { useDebugMode } from '../../composables/useDebugMode.ts'
import { getInstructionInfo } from '../../data/instructions.ts'
import type { Stage, SuccessCondition } from '../../core/stages/types.ts'

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

const props = defineProps<{
  stage: Stage
  currentIndex: number
  totalStages: number
  canGoPrev: boolean
  canGoNext: boolean
  chapterGroups: ChapterGroup[]
}>()

const emit = defineEmits<{
  goPrev: []
  goNext: []
  goToStage: [index: number]
  openNotebook: []
}>()

const cpuStore = useCpuStore()
const progress = useProgressStore()
const { isDebugMode } = useDebugMode()

function isStageCleared(id: string): boolean {
  return progress.clearedStageIds.includes(id)
}

const requiredInstructions = computed(() =>
  props.stage.successConditions.filter(
    (c): c is Extract<SuccessCondition, { type: 'instruction_used' }> => c.type === 'instruction_used',
  )
)

function isInstructionUsed(op: string): boolean {
  return cpuStore.snapshot.instructionsUsed.includes(op as never)
}

const currentChapterStages = computed(() =>
  props.chapterGroups.find(g => g.chapter === props.stage.chapter)?.stages ?? []
)

/**
 * 章インジケーターのアイコンを決める。
 * 現在進行中=▶ / 過去（クリア済 or 現在位置より前）=✓ / 未到達=○。
 */
function chapterIcon(group: ChapterGroup): string {
  if (group.chapter === props.stage.chapter) return '▶'
  if (group.firstIndex < props.currentIndex || group.stages.every(s => isStageCleared(s.id))) return '✓'
  return '○'
}

function chapterStepClass(group: ChapterGroup): Record<string, boolean> {
  const isCurrent = group.chapter === props.stage.chapter
  const isPast = !isCurrent && (group.firstIndex < props.currentIndex || group.stages.every(s => isStageCleared(s.id)))
  return {
    'step-current': isCurrent,
    'step-past': isPast,
    'step-locked': !isCurrent && !isPast,
  }
}

/** 章ジャンプの可否。通常は「現在位置以前」のみ、デバッグモードでは全章解放。 */
function canAccessChapter(group: ChapterGroup): boolean {
  return isDebugMode.value || group.firstIndex <= props.currentIndex
}

function onChapterClick(group: ChapterGroup) {
  if (canAccessChapter(group) && group.firstIndex !== props.currentIndex) {
    emit('goToStage', group.firstIndex)
  }
}

function onDotClick(s: ChapterStageInfo) {
  if (!s.isCurrent && (isStageCleared(s.id) || isDebugMode.value)) {
    emit('goToStage', s.globalIndex)
  }
}
</script>

<template>
  <header class="stage-header">
    <div class="header-left">
      <div class="header-row1">
        <span class="chapter-label">第{{ stage.chapter }}章</span>
        <h1 class="stage-title">{{ stage.title.ja }}</h1>
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
        <button class="notebook-btn" title="ノートを開く" @click="emit('openNotebook')">
          <span class="material-symbols-rounded">menu_book</span>
        </button>
      </div>

      <div class="header-row2">
        <span class="objective-label">課題</span>
        <span class="objective-text">{{ stage.objective.ja }}</span>
        <div v-if="requiredInstructions.length > 0" class="required-instructions">
          <span class="required-label">使用すべき命令:</span>
          <span
            v-for="cond in requiredInstructions"
            :key="cond.op"
            class="chip-wrapper"
          >
            <span
              class="instruction-chip"
              :class="{ met: isInstructionUsed(cond.op) }"
            >{{ cond.op }}</span>
            <div class="chip-tooltip">
              <span class="tooltip-syntax">{{ getInstructionInfo(cond.op).syntax }}</span>
              <span class="tooltip-desc">{{ getInstructionInfo(cond.op).desc }}</span>
            </div>
          </span>
        </div>
      </div>
    </div>

    <div class="right-nav">
      <!-- 章インジケーター -->
      <div class="chapter-steps">
        <button
          v-for="group in chapterGroups"
          :key="group.chapter"
          class="chapter-step"
          :class="chapterStepClass(group)"
          :disabled="!canAccessChapter(group)"
          @click="onChapterClick(group)"
        >
          <span class="step-icon">{{ chapterIcon(group) }}</span>
          <span>第{{ group.chapter }}章</span>
        </button>
      </div>

      <!-- ステージドット + 矢印 -->
      <div class="stage-dots-row">
        <button class="nav-btn" :disabled="!canGoPrev" @click="emit('goPrev')">‹</button>
        <div class="stage-dots">
          <button
            v-for="s in currentChapterStages"
            :key="s.globalIndex"
            class="stage-dot"
            :class="{
              'dot-current': s.isCurrent,
              'dot-cleared': !s.isCurrent && isStageCleared(s.id),
              'dot-locked': !s.isCurrent && !isStageCleared(s.id),
            }"
            :title="`ステージ ${s.globalIndex + 1}`"
            @click="onDotClick(s)"
          />
        </div>
        <button class="nav-btn" :disabled="!canGoNext" @click="emit('goNext')">›</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.stage-header {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
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

.notebook-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.notebook-btn:hover {
  color: var(--color-text);
  background: var(--color-border);
  border-color: var(--color-text-tertiary);
}
.notebook-btn .material-symbols-rounded {
  font-size: 18px;
}

/* ── 右サイドナビ ── */
.right-nav {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 6px 16px;
  border-left: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* 章インジケーター行 */
.chapter-steps {
  display: flex;
  align-items: center;
  gap: 2px;
}

.chapter-step {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 2px 8px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.chapter-step.step-current {
  color: var(--color-accent-blue);
  background: color-mix(in srgb, var(--color-accent-blue) 12%, transparent);
}

.chapter-step.step-past {
  color: var(--color-text-secondary);
  cursor: pointer;
}
.chapter-step.step-past:hover {
  background: color-mix(in srgb, var(--color-text-secondary) 10%, transparent);
}

.chapter-step.step-locked {
  color: var(--color-text-tertiary);
  cursor: default;
  opacity: 0.5;
}

.step-icon {
  font-size: 9px;
}

/* ステージドット行 */
.stage-dots-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stage-dots {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stage-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid;
  padding: 0;
  background: transparent;
  transition: transform 0.12s;
}

.stage-dot.dot-cleared {
  background: var(--color-text-secondary);
  border-color: var(--color-text-secondary);
  cursor: pointer;
}
.stage-dot.dot-cleared:hover {
  transform: scale(1.35);
}

.stage-dot.dot-current {
  background: var(--color-accent-blue);
  border-color: var(--color-accent-blue);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent-blue) 30%, transparent);
  cursor: default;
  pointer-events: none;
}

.stage-dot.dot-locked {
  border-color: var(--color-text-tertiary);
  cursor: default;
  opacity: 0.55;
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
  flex-shrink: 0;
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
</style>
