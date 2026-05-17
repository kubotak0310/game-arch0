<script setup lang="ts">
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useDebugMode } from '../../composables/useDebugMode.ts'
import { getInstructionInfo } from '../../data/instructions.ts'
import type { Stage, SuccessCondition } from '../../core/stages/types.ts'

const props = defineProps<{
  stage: Stage
  currentIndex: number
  totalStages: number
  canGoPrev: boolean
  canGoNext: boolean
}>()

const emit = defineEmits<{
  goPrev: []
  goNext: []
}>()

const cpuStore = useCpuStore()
const { isDebugMode } = useDebugMode()

const requiredInstructions = computed(() =>
  props.stage.successConditions.filter(
    (c): c is Extract<SuccessCondition, { type: 'instruction_used' }> => c.type === 'instruction_used',
  )
)

function isInstructionUsed(op: string): boolean {
  return cpuStore.snapshot.instructionsUsed.includes(op as never)
}
</script>

<template>
  <header class="stage-header">
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
      <div class="stage-nav">
        <button class="nav-btn" :disabled="!canGoPrev" @click="emit('goPrev')">‹</button>
        <span class="stage-counter">{{ currentIndex + 1 }} / {{ totalStages }}</span>
        <button class="nav-btn" :disabled="!canGoNext" @click="emit('goNext')">›</button>
      </div>
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
  </header>
</template>

<style scoped>
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
</style>
