<script setup lang="ts">
/**
 * スタックの中身を上から下に表示するコンポーネント。
 *
 * フルディセンディング方式（PUSH 時に先に SP を減らす）に従い、SP がスタックトップを指す。
 * 一覧は SP の現在値から初期 SP 直前までを 2 ワードずつ列挙する。
 */
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import { useActiveFeatures } from '../../composables/useActiveFeatures.ts'

const cpuStore = useCpuStore()
const { stackActive } = useActiveFeatures()

/** SP の初期位置。Cpu 側の初期値（0xFFFE）と一致させる。 */
const INITIAL_SP = 0xfffe

function toHex4(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * スタックに積まれた値を「上→下」の順で配列にして返す。
 *
 * - SP が初期位置以上ならスタック空（PUSH 0 回）。
 * - 各エントリのアドレスは 2 刻み（PUSH/POP の SP 増減幅）。
 */
const stackEntries = computed(() => {
  const sp = cpuStore.snapshot.sp
  const mem = cpuStore.snapshot.memory
  if (sp >= INITIAL_SP) return []
  const entries = []
  for (let addr = INITIAL_SP - 2; addr >= sp; addr -= 2) {
    entries.push({ addr, value: mem[addr] })
  }
  return entries
})

const isEmpty = computed(() => stackEntries.value.length === 0)
</script>

<template>
  <div class="stack-view">
    <div class="stack-header">
      <h3 class="section-title">スタック</h3>
      <span class="sp-label">SP={{ toHex4(cpuStore.snapshot.sp) }}</span>
    </div>

    <div v-if="isEmpty" class="stack-empty">
      スタック空
    </div>
    <div v-else class="stack-list">
      <div
        v-for="entry in stackEntries"
        :key="entry.addr"
        class="stack-entry"
        :class="{ 'stack-top': entry.addr === cpuStore.snapshot.sp }"
      >
        <span class="stack-addr">{{ toHex4(entry.addr) }}</span>
        <span class="stack-value">{{ toHex4(entry.value) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  transition: opacity 0.2s;
}
.stack-view.dimmed {
  opacity: 0.25;
  pointer-events: none;
}
.stack-header {
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
.sp-label {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  color: var(--color-control-reg);
}
.stack-empty {
  padding: 12px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-align: center;
}
.stack-list {
  overflow-y: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stack-entry {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
}
.stack-entry.stack-top {
  border-color: var(--color-accent-amber);
  background: color-mix(in srgb, var(--color-accent-amber) 12%, transparent);
}
.stack-addr {
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.stack-value {
  color: var(--color-text);
}
</style>
