<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useExecutionStore } from '../../stores/execution.ts'
import { useCpuStore } from '../../stores/cpu.ts'

const execStore = useExecutionStore()
const cpuStore = useCpuStore()

function handleRun() {
  execStore.runAll()
}
function handleStep() {
  execStore.stepForward()
}
function handleBack() {
  execStore.stepBackward()
}
function handleReset() {
  execStore.reset()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'F10') {
    e.preventDefault()
    if (!cpuStore.isHalted) execStore.stepForward()
  } else if (e.key === 'F9') {
    e.preventDefault()
    execStore.stepBackward()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="execution-control">
    <button class="btn" @click="handleBack">
      ← 戻る <kbd>F9</kbd>
    </button>
    <button class="btn btn-primary" :disabled="cpuStore.isHalted" @click="handleStep">
      → ステップ <kbd>F10</kbd>
    </button>
    <button class="btn" :disabled="cpuStore.isHalted" @click="handleRun">
      ▶ 実行
    </button>
    <button class="btn btn-ghost" @click="handleReset">
      ↺ リセット
    </button>
  </div>
</template>

<style scoped>
.execution-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
.btn {
  padding: 7px 14px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn:hover:not(:disabled) {
  background: var(--color-surface);
  border-color: var(--color-text-secondary);
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary {
  background: var(--color-accent-green-dark);
  border-color: var(--color-accent-green-dark);
  color: white;
  font-weight: 600;
}
.btn-primary:hover:not(:disabled) {
  background: #15803d;
  border-color: #15803d;
}
.btn-ghost {
  border-color: transparent;
  color: var(--color-text-secondary);
}
kbd {
  display: inline-block;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  vertical-align: middle;
  margin-left: 4px;
}
.btn-primary kbd {
  border-color: rgba(255,255,255,0.3);
  background: rgba(0,0,0,0.15);
  color: rgba(255,255,255,0.8);
}
</style>
