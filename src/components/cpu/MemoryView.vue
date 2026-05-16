<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useActiveFeatures } from '../../composables/useActiveFeatures.ts'

const COLS = 8
const ROWS = 16
const PAGE_SIZE = COLS * ROWS // 128 bytes per page

const cpuStore = useCpuStore()
const { memoryActive } = useActiveFeatures()

const currentPage = ref(0)
const totalPages = computed(() => Math.ceil(0x10000 / PAGE_SIZE))

const startAddr = computed(() => currentPage.value * PAGE_SIZE)

const changedAddresses = computed(() => new Set(cpuStore.lastResult?.changedMemoryAddresses ?? []))

const rows = computed(() => {
  const mem = cpuStore.snapshot.memory
  const base = startAddr.value
  const result: { addr: number; cells: { addr: number; value: number }[] }[] = []
  for (let r = 0; r < ROWS; r++) {
    const rowAddr = base + r * COLS
    if (rowAddr >= 0x10000) break
    const cells = []
    for (let c = 0; c < COLS; c++) {
      const addr = rowAddr + c
      if (addr >= 0x10000) break
      cells.push({ addr, value: mem[addr] })
    }
    result.push({ addr: rowAddr, cells })
  }
  return result
})

function toHex2(n: number): string {
  return n.toString(16).toUpperCase().padStart(2, '0')
}
function toHex4(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0')
}

function prevPage() {
  if (currentPage.value > 0) currentPage.value--
}
function nextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++
}
function jumpToSP() {
  const sp = cpuStore.snapshot.sp
  currentPage.value = Math.floor(sp / PAGE_SIZE)
}
function jumpToStart() {
  currentPage.value = 0
}
</script>

<template>
  <div class="memory-view" :class="{ dimmed: !memoryActive }">
    <div class="memory-header">
      <h3 class="section-title">メモリ</h3>
      <div class="nav-controls">
        <button class="nav-btn" title="先頭へ" @click="jumpToStart">⤒</button>
        <button class="nav-btn" :disabled="currentPage === 0" @click="prevPage">‹</button>
        <span class="page-label">{{ toHex4(startAddr) }}</span>
        <button class="nav-btn" :disabled="currentPage >= totalPages - 1" @click="nextPage">›</button>
        <button class="nav-btn" title="SPへジャンプ" @click="jumpToSP">SP</button>
      </div>
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
            <td class="addr-cell">{{ toHex4(row.addr) }}</td>
            <td
              v-for="cell in row.cells"
              :key="cell.addr"
              class="val-cell"
              :class="{
                'val-nonzero': cell.value !== 0,
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
  flex: 1;
  overflow: hidden;
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
  padding: 10px 12px 6px;
  flex-shrink: 0;
}
.section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin: 0;
}
.nav-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-btn {
  padding: 2px 6px;
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1.4;
}
.nav-btn:hover:not(:disabled) {
  background: var(--color-bg);
  color: var(--color-text);
}
.nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.page-label {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  color: var(--color-text-secondary);
  min-width: 60px;
  text-align: center;
}
.memory-table-wrap {
  overflow-x: auto;
  overflow-y: auto;
  flex: 1;
  padding: 0 12px 12px;
}
.memory-table {
  border-collapse: collapse;
  width: 100%;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
}
.memory-table th {
  color: var(--color-text-tertiary);
  font-weight: 600;
  padding: 2px 4px;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg);
}
.addr-col {
  text-align: left !important;
  min-width: 56px;
}
.val-col {
  min-width: 22px;
}
.addr-cell {
  color: var(--color-text-tertiary);
  padding: 1px 4px;
  font-size: 10px;
}
.val-cell {
  text-align: center;
  padding: 1px 3px;
  border-radius: 2px;
  color: var(--color-text-tertiary);
  transition: background 0.1s;
}
.val-cell.val-nonzero {
  color: var(--color-text);
}
.val-cell.val-changed {
  background: color-mix(in srgb, var(--color-accent-amber) 20%, transparent);
  color: var(--color-accent-amber);
}
</style>
