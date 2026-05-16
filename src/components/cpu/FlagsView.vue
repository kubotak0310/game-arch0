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
        :title="FLAG_DESC[flag]"
      >
        <span class="flag-name">{{ flag }}</span>
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
.section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin: 0 0 8px;
}
.flag-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.flag-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 4px;
  border-radius: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: background 0.15s, border-color 0.15s;
}
.flag-item.flag-set {
  background: color-mix(in srgb, var(--color-accent-purple) 15%, transparent);
  border-color: var(--color-accent-purple);
}
.flag-item.flag-changed {
  background: color-mix(in srgb, var(--color-accent-green) 15%, transparent);
  border-color: var(--color-accent-green);
}
.flag-name {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  letter-spacing: 0.05em;
}
.flag-value {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
}
.flag-item.flag-set .flag-value {
  color: var(--color-accent-purple);
}
.flag-item.flag-changed .flag-value {
  color: var(--color-accent-teal);
}
</style>
