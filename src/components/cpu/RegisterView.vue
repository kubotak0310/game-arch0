<script setup lang="ts">
/**
 * 汎用レジスタ R0〜R4 の値を表示するコンポーネント。
 *
 * - 直前ステップで変化したレジスタを緑でハイライトし「前値 → 現値」を併記。
 * - 値が 0 のレジスタは「未使用」感を出すため薄く表示する（実行の流れを掴みやすくする）。
 * - RET 直後は R0 行に「戻り値」バッジを出す（呼び出し規約上 R0 が戻り値）。
 */
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'

const cpuStore = useCpuStore()

const REGISTERS = ['R0', 'R1', 'R2', 'R3', 'R4'] as const

const highlighted = computed(() => new Set(cpuStore.lastResult?.changedRegisters ?? []))

function formatDec(v: number): string { return String(v) }
/** 4桁ゼロ埋めの16進表記。例: 42 → `0x002A`。 */
function formatHex(v: number): string {
  return '0x' + v.toString(16).toUpperCase().padStart(4, '0')
}

const regValue = (name: string) =>
  cpuStore.snapshot.registers[name as keyof typeof cpuStore.snapshot.registers] as number

const prevRegValue = (name: string): number | null => {
  const prev = cpuStore.previousSnapshot
  if (!prev) return null
  return prev.registers[name as keyof typeof prev.registers] as number
}

const isZero = (name: string) => regValue(name) === 0
/** RET を実行した直後の 1 ステップ間だけ true。R0 横の「戻り値」バッジを出す目的。 */
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
          highlighted: highlighted.has(name),
          unused: isZero(name),
        }"
      >
        <span class="reg-name">{{ name }}</span>
        <span v-if="name === 'R0' && showReturnBadge" class="badge-return">戻り値</span>
        <div class="reg-values">
          <span v-if="highlighted.has(name) && prevRegValue(name) !== null" class="reg-prev">
            {{ formatHex(prevRegValue(name)!) }} →
          </span>
          <span class="reg-hex">{{ formatHex(regValue(name)) }}</span>
          <span class="reg-dec">({{ formatDec(regValue(name)) }})</span>
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
.reg-prev {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}
.reg-hex {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 15px;
  color: var(--color-text);
  min-width: 52px;
  text-align: right;
}
.reg-dec {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  color: var(--color-text-muted);
  min-width: 36px;
  text-align: right;
}
</style>
