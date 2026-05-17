<script setup lang="ts">
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useActiveFeatures } from '../../composables/useActiveFeatures.ts'

const cpuStore = useCpuStore()
const { flagsActive } = useActiveFeatures()

const FLAGS = ['N', 'Z', 'C', 'V'] as const

const FLAG_DESC: Record<string, string> = {
  N: 'Negative',
  Z: 'Zero',
  C: 'Carry',
  V: 'oVerflow',
}

const changedFlags = computed(() => new Set(cpuStore.lastResult?.changedFlags ?? []))
</script>

<template>
  <div class="flags-view" :class="{ dimmed: !flagsActive }">
    <h3 class="section-title">フラグ</h3>
    <div class="flag-list">
      <div
        v-for="flag in FLAGS"
        :key="flag"
        class="flag-item"
        :class="{
          'flag-set': cpuStore.snapshot.flags[flag],
          'flag-changed': changedFlags.has(flag),
        }"
      >
        <span class="flag-name">{{ flag }}</span>
        <span class="flag-desc">({{ FLAG_DESC[flag] }})</span>
        <span class="flag-value">{{ cpuStore.snapshot.flags[flag] ? '1' : '0' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flags-view {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  transition: opacity 0.2s;
}
.flags-view.dimmed {
  opacity: 0.3;
  pointer-events: none;
}
.flag-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}
.flag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: background 0.15s, border-color 0.15s;
}
.flag-item.flag-changed {
  background: color-mix(in srgb, var(--color-accent-green) 15%, transparent);
  border-color: var(--color-accent-green);
}
.flag-name {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  width: 14px;
  flex-shrink: 0;
}
.flag-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.flag-value {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.flag-item.flag-set .flag-value {
  color: var(--color-text);
}
.flag-item.flag-changed .flag-value {
  color: var(--color-accent-teal);
}
</style>
