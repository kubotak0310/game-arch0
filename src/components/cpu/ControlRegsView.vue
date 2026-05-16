<script setup lang="ts">
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useActiveFeatures } from '../../composables/useActiveFeatures.ts'

const cpuStore = useCpuStore()
const { stackActive, lrActive } = useActiveFeatures()

function toHex(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0')
}

const pcChanged = computed(() => false) // PC always changes; show normally
const spChanged = computed(
  () => cpuStore.lastResult?.changedRegisters.includes('SP') ?? false,
)
const lrChanged = computed(
  () => cpuStore.lastResult?.changedRegisters.includes('LR') ?? false,
)
</script>

<template>
  <div class="control-regs-view">
    <h3 class="section-title">制御レジスタ</h3>
    <div class="control-list">
      <!-- PC -->
      <div class="control-row" :class="{ changed: pcChanged }">
        <span class="ctrl-name">PC</span>
        <span class="ctrl-value">{{ toHex(cpuStore.snapshot.pc) }}</span>
        <span class="ctrl-desc">Program Counter</span>
      </div>
      <!-- SP -->
      <div
        class="control-row"
        :class="{ changed: spChanged }"
      >
        <span class="ctrl-name">SP</span>
        <span class="ctrl-value">{{ toHex(cpuStore.snapshot.sp) }}</span>
        <span class="ctrl-desc">Stack Pointer</span>
      </div>
      <!-- LR -->
      <div
        class="control-row"
        :class="{ changed: lrChanged }"
      >
        <span class="ctrl-name">LR</span>
        <span class="ctrl-value">{{ toHex(cpuStore.snapshot.lr) }}</span>
        <span class="ctrl-desc">Link Register</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-regs-view {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
}
.section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin: 0 0 8px;
}
.control-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: background 0.15s, border-color 0.15s, opacity 0.2s;
}
.control-row.dimmed {
  opacity: 0.25;
}
.control-row.changed {
  background: color-mix(in srgb, var(--color-accent-amber) 12%, transparent);
  border-color: var(--color-accent-amber);
}
.ctrl-name {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-control-reg);
  width: 24px;
  flex-shrink: 0;
}
.ctrl-value {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  color: var(--color-text);
  flex: 1;
}
.ctrl-desc {
  font-size: 10px;
  color: var(--color-text-tertiary);
}
</style>
