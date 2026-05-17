<script setup lang="ts">
import { ref, watch } from 'vue'
import type { I18nText } from '../../core/stages/types.ts'

const props = defineProps<{
  hints: I18nText[]
  stageId: string
}>()

const revealed = ref(0)

watch(() => props.stageId, () => {
  revealed.value = 0
})

function revealNext() {
  if (revealed.value < props.hints.length) revealed.value++
}
</script>

<template>
  <div class="hint-panel">
    <div class="hint-header">
      <span class="hint-title">ヒント</span>
      <span class="hint-count">{{ revealed }} / {{ hints.length }}</span>
    </div>

    <div class="hint-body">
      <div v-if="revealed === 0" class="hint-empty">
        <p class="hint-empty-text">詰まったときは少しずつヒントを確認しましょう。</p>
        <button class="hint-btn" @click="revealNext">ヒント 1 を見る</button>
      </div>

      <template v-else>
        <div
          v-for="(hint, i) in hints.slice(0, revealed)"
          :key="i"
          class="hint-card"
          :class="{ answer: i === hints.length - 1 }"
        >
          <div class="hint-card-label">
            <span v-if="i < hints.length - 1">ヒント {{ i + 1 }}</span>
            <span v-else class="answer-label">答え</span>
          </div>
          <pre class="hint-text">{{ hint.ja }}</pre>
        </div>

        <button
          v-if="revealed < hints.length"
          class="hint-btn"
          @click="revealNext"
        >
          ヒント {{ revealed + 1 }} を見る
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hint-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.hint-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--color-surface-2);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.hint-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.hint-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.hint-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
}

.hint-empty-text {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

.hint-card {
  background: color-mix(in srgb, var(--color-accent-blue) 6%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-accent-blue) 20%, transparent);
  border-radius: 8px;
  overflow: hidden;
}

.hint-card.answer {
  background: color-mix(in srgb, var(--color-accent-amber) 6%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent-amber) 25%, transparent);
}

.hint-card-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-blue);
  padding: 5px 10px 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent-blue) 15%, transparent);
}

.hint-card.answer .hint-card-label {
  color: var(--color-accent-amber);
  border-bottom-color: color-mix(in srgb, var(--color-accent-amber) 15%, transparent);
}

.answer-label {
  color: var(--color-accent-amber);
}

.hint-text {
  font-size: 13px;
  font-family: ui-monospace, monospace;
  line-height: 1.6;
  color: var(--color-text);
  margin: 0;
  padding: 10px;
  white-space: pre-wrap;
}

.hint-btn {
  align-self: flex-start;
  padding: 7px 16px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.hint-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
  border-color: var(--color-text-tertiary);
}
</style>
