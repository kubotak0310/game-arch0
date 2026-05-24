<script setup lang="ts">
import { computed } from 'vue'
import { useCpuStore } from '../../stores/cpu.ts'
import type { Stage, SuccessCondition } from '../../core/stages/types.ts'

const props = defineProps<{
  stage: Stage
}>()

const cpuStore = useCpuStore()

function conditionMet(cond: SuccessCondition): boolean {
  if (cond.type === 'instruction_used') {
    return cpuStore.snapshot.instructionsUsed.includes(cond.op)
  }
  if (!cpuStore.lastResult) return false
  const snap = cpuStore.lastResult.snapshot
  if (cond.type === 'register') {
    return snap.registers[cond.target as keyof typeof snap.registers] === cond.expected
  }
  if (cond.type === 'memory') {
    return snap.memory[cond.address] === cond.expected
  }
  return false
}

function toHex4(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0')
}
function toHex2(n: number): string {
  return '0x' + n.toString(16).toUpperCase().padStart(2, '0')
}


const allConditionsMet = computed(() =>
  props.stage.successConditions.every(conditionMet)
)
</script>

<template>
  <div class="task-panel" :class="{ cleared: allConditionsMet }">
    <div class="task-panel-header">
      <span class="task-panel-title">クリア条件</span>
    </div>
    <ul class="condition-list">
      <li
        v-for="(cond, i) in stage.successConditions"
        :key="i"
        class="condition-item"
        :class="{ met: conditionMet(cond) }"
      >
        <span class="condition-check">{{ conditionMet(cond) ? '✓' : '○' }}</span>
        <span class="condition-text">
          <template v-if="cond.type === 'register'">
            <span class="reg">{{ cond.target }}</span>
            <span class="op"> = </span>
            <span class="val">{{ toHex4(cond.expected) }}</span>
            <span class="val-dec">({{ cond.expected }})</span>
          </template>
          <template v-else-if="cond.type === 'memory'">
            <span class="addr">[{{ toHex2(cond.address) }}]</span>
            <span class="op"> = </span>
            <span class="val">{{ toHex2(cond.expected) }}</span>
            <span class="val-dec">({{ cond.expected }})</span>
          </template>
          <template v-else-if="cond.type === 'instruction_used'">
            <span class="inst-name">{{ cond.op }}</span>
            <span class="op"> 命令を使用すること</span>
          </template>
        </span>
      </li>
    </ul>

    <div v-if="cpuStore.parseErrors.length > 0" class="error-list">
      <div
        v-for="(err, i) in cpuStore.parseErrors"
        :key="i"
        class="error-item"
      >
        <span class="error-line">行 {{ err.line }}</span>
        {{ err.message.ja }}
        <span v-if="err.suggestion" class="error-suggestion">
          → {{ err.suggestion.ja }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-panel {
  background: color-mix(in srgb, var(--color-accent-amber) 8%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 30%, transparent);
  border-radius: 8px;
  padding: 0 0 10px;
  flex-shrink: 0;
  transition: background 0.3s, border-color 0.3s;
}

.task-panel.cleared {
  background: color-mix(in srgb, var(--color-accent-green) 8%, var(--color-surface));
  border-color: color-mix(in srgb, var(--color-accent-green) 30%, transparent);
}

.task-panel-header {
  padding: 6px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-accent-amber) 20%, transparent);
  margin-bottom: 8px;
  border-radius: 8px 8px 0 0;
}

.task-panel.cleared .task-panel-header {
  border-bottom-color: color-mix(in srgb, var(--color-accent-green) 20%, transparent);
}

.task-panel-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-amber);
}

.task-panel.cleared .task-panel-title {
  color: var(--color-accent-green);
}

.condition-list {
  list-style: none;
  padding: 0 10px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent-amber) 5%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-accent-amber) 20%, transparent);
  font-size: 13px;
  transition: background 0.25s, border-color 0.25s;
}

.condition-item.met {
  border-color: var(--color-accent-green);
  background: color-mix(in srgb, var(--color-accent-green) 10%, transparent);
}

.condition-check {
  font-size: 14px;
  color: var(--color-accent-amber);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
  transition: color 0.25s;
}

.condition-item.met .condition-check {
  color: var(--color-accent-green);
}

.reg       { color: var(--color-accent-blue);   font-family: monospace; font-weight: 600; }
.addr      { color: var(--color-accent-purple); font-family: monospace; font-weight: 600; }
.inst-name { color: var(--color-accent-blue);  font-family: monospace; font-weight: 700; }
.op        { color: var(--color-text-secondary); }
.val       { color: var(--color-accent-amber); font-family: monospace; font-size: 14px; font-weight: 700; }
.val-dec   { color: var(--color-text-muted); font-family: monospace; font-size: 11px; margin-left: 2px; }
.actual    { color: var(--color-text-tertiary); font-size: 11px; margin-left: 4px; }

.error-list {
  margin: 8px 10px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.error-item {
  font-size: 12px;
  padding: 7px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-accent-coral) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent-coral) 25%, transparent);
  color: var(--color-accent-coral);
  line-height: 1.5;
}

.error-line {
  font-weight: 600;
  margin-right: 6px;
  color: var(--color-accent-amber);
}

.error-suggestion {
  display: block;
  color: var(--color-text-secondary);
  margin-top: 2px;
}
</style>
