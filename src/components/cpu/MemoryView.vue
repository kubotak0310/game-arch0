<script setup lang="ts">
/**
 * ユーザー領域（0x00〜USER_MEM_MAX）の主記憶をテーブル形式で表示するコンポーネント。
 *
 * - 8列×8行 = 64セル固定のレイアウト。スタック領域はあえて表示しない（学習者の集中を散らさない）。
 * - 初期メモリで値が入っているセルはティール色、直近で変化したセルはアンバー色でハイライト。
 * - LOAD/STORE が未解放の章では dim 表示。
 */
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useActiveFeatures } from '../../composables/useActiveFeatures.ts'
import { USER_MEM_MAX } from '../../core/cpu/instructions.ts'

const COLS = 8
const ROWS = Math.ceil((USER_MEM_MAX + 1) / COLS)

const cpuStore = useCpuStore()
const { memoryActive } = useActiveFeatures()

const changedAddresses = computed(() => new Set(cpuStore.lastResult?.changedMemoryAddresses ?? []))
const initialAddresses = computed(() => cpuStore.initialMemoryAddresses)

/** メモリを行ごとにグルーピングする。テンプレート側の v-for ネストを抑えるための整形。 */
const rows = computed(() => {
  const mem = cpuStore.snapshot.memory
  const result: { addr: number; cells: { addr: number; value: number }[] }[] = []
  for (let r = 0; r < ROWS; r++) {
    const rowAddr = r * COLS
    const cells = []
    for (let c = 0; c < COLS; c++) {
      const addr = rowAddr + c
      cells.push({ addr, value: mem[addr] })
    }
    result.push({ addr: rowAddr, cells })
  }
  return result
})

/** 値表示用：2桁ゼロ埋め16進。例: 10 → `0A`。 */
function toHex2(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, '0')
}
/** アドレス表示用：`0x` 接頭辞付きの2桁16進。 */
function toHex2addr(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(2, '0')
}
</script>

<template>
  <div class="memory-view" :class="{ dimmed: !memoryActive }">
    <div class="memory-header">
      <h3 class="section-title">メモリ</h3>
      <span class="range-label">0x00 – 0x{{ USER_MEM_MAX.toString(16).toUpperCase() }}</span>
    </div>
    <div class="memory-table-wrap">
      <table class="memory-table">
        <thead>
          <tr>
            <th class="addr-col">Addr</th>
            <th v-for="c in COLS" :key="c" class="val-col">+{{ c - 1 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.addr">
            <td class="addr-cell">{{ toHex2addr(row.addr) }}</td>
            <td
              v-for="cell in row.cells"
              :key="cell.addr"
              class="val-cell"
              :class="{
                'val-nonzero': cell.value !== 0,
                'val-initial': initialAddresses.has(cell.addr),
                'val-changed': changedAddresses.has(cell.addr),
              }"
            >
              {{ toHex2(cell.value) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.memory-view {
  display: flex;
  flex-direction: column;
  transition: opacity 0.2s;
}
.memory-view.dimmed {
  opacity: 0.25;
  pointer-events: none;
}
.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 6px 12px;
  background: var(--color-surface-2);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.section-title {
  margin: 0;
}
.range-label {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 10px;
  color: var(--color-text-tertiary);
}
.memory-table-wrap {
  padding: 0 12px 12px;
}
.memory-table {
  border-collapse: collapse;
  width: 100%;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 14px;
}
.memory-table th {
  color: var(--color-text-tertiary);
  font-weight: 600;
  padding: 3px 4px;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
}
.addr-col {
  text-align: left !important;
  min-width: 44px;
}
.val-col {
  min-width: 26px;
}
.addr-cell {
  color: var(--color-text-secondary);
  padding: 2px 4px;
  font-size: 14px;
}
.val-cell {
  text-align: center;
  padding: 2px 4px;
  border-radius: 2px;
  color: var(--color-text-secondary);
  transition: background 0.1s;
}
.val-cell.val-nonzero {
  color: var(--color-text);
}
.val-cell.val-initial {
  background: color-mix(in srgb, var(--color-accent-teal) 15%, transparent);
  color: var(--color-accent-teal);
}
.val-cell.val-changed {
  background: color-mix(in srgb, var(--color-accent-amber) 20%, transparent);
  color: var(--color-accent-amber);
}
</style>
