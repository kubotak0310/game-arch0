<script setup lang="ts">
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'

const cpuStore = useCpuStore()

const REGISTERS = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'] as const

const highlighted = computed(() => new Set(cpuStore.lastResult?.changedRegisters ?? []))

function formatDec(v: number): string {
  return String(v)
}

function formatHex(v: number): string {
  return '0x' + v.toString(16).toUpperCase().padStart(4, '0')
}

const regValue = (name: string) =>
  cpuStore.snapshot.registers[name as keyof typeof cpuStore.snapshot.registers] as number

const isR0 = (name: string) => name === 'R0'
const isZero = (name: string) => regValue(name) === 0
const showReturnBadge = computed(() => cpuStore.lastResult?.executedType === 'RET')
</script>

<template>
  <div class="register-view">
    <h3 class="section-title">レジスタ</h3>
    <div class="register-list">
      <div
        v-for="name in REGISTERS"
        :key="name"
        class="register-row"
        :class="{
          'r0-row': isR0(name),
          highlighted: highlighted.has(name),
          unused: !isR0(name) && isZero(name),
        }"
      >
        <span class="reg-name">{{ name }}</span>
        <span v-if="name === 'R1' && showReturnBadge" class="badge-return">戻り値</span>
        <div class="reg-values">
          <span class="reg-dec">{{ formatDec(regValue(name)) }}</span>
          <span class="reg-hex">{{ formatHex(regValue(name)) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-view {
  padding: 12px;
}
.register-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.register-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}
.register-row.r0-row {
  opacity: 0.4;
  border-left: 3px solid var(--color-border);
}
.register-row.unused {
  opacity: 0.35;
}
.register-row.highlighted {
  background: color-mix(in srgb, var(--color-accent-green) 15%, transparent);
  border-color: var(--color-accent-green);
  opacity: 1;
}
.reg-name {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-accent-blue);
  width: 28px;
  flex-shrink: 0;
}
.badge-return {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--color-accent-amber);
  background: color-mix(in srgb, var(--color-accent-amber) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 35%, transparent);
}
.reg-values {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.reg-dec {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 15px;
  color: var(--color-text);
  min-width: 36px;
  text-align: right;
}
.reg-hex {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  min-width: 52px;
  text-align: right;
}
</style>
