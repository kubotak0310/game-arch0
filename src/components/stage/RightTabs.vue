<script setup lang="ts">
import { ref, watch } from 'vue'
import MemoryView from '../cpu/MemoryView.vue'
import StackView from '../cpu/StackView.vue'
import HintPanel from './HintPanel.vue'
import type { Hint } from '../../core/stages/types.ts'

const props = defineProps<{
  hints: Hint[]
  stageId: string
}>()

const tab = ref<'memory' | 'hint'>('memory')

// ステージ移動時はデフォルトの「メモリ・スタック」タブに戻す
watch(() => props.stageId, () => {
  tab.value = 'memory'
})
</script>

<template>
  <div class="right-pane">
    <div class="right-tabs">
      <button
        class="right-tab"
        :class="{ active: tab === 'memory' }"
        @click="tab = 'memory'"
      >メモリ・スタック</button>
      <button
        class="right-tab"
        :class="{ active: tab === 'hint' }"
        @click="tab = 'hint'"
      >ヒント</button>
    </div>
    <template v-if="tab === 'memory'">
      <MemoryView />
      <div class="right-divider" />
      <StackView />
    </template>
    <HintPanel
      v-else
      :hints="hints"
      :stage-id="stageId"
    />
  </div>
</template>

<style scoped>
.right-pane {
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
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
