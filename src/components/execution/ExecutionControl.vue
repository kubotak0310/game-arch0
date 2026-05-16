<script setup lang="ts">
import { useExecutionStore } from '../../stores/execution.ts'
import { useCpuStore } from '../../stores/cpu.ts'

const execStore = useExecutionStore()
const cpuStore = useCpuStore()

const emit = defineEmits<{ run: []; reset: [] }>()

function handleRun() {
  execStore.runAll()
  emit('run')
}
function handleStep() {
  execStore.stepForward()
}
function handleBack() {
  execStore.stepBackward()
}
function handleReset() {
  execStore.reset()
  emit('reset')
}
</script>

<template>
  <div class="execution-control">
    <button class="btn btn-primary" :disabled="cpuStore.isHalted" @click="handleRun">
      ▶ 実行
    </button>
    <button class="btn" :disabled="cpuStore.isHalted" @click="handleStep">
      → ステップ
    </button>
    <button class="btn" @click="handleBack">
      ← 戻る
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
  background: var(--color-accent-green);
  border-color: var(--color-accent-green);
  color: white;
  font-weight: 600;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-green-dark);
  border-color: var(--color-accent-green-dark);
}
.btn-ghost {
  border-color: transparent;
  color: var(--color-text-secondary);
}
</style>
