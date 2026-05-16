import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Cpu } from '../core/cpu/cpu.ts'
import type { CpuSnapshot, ExecutionResult, ParseError, InstructionType } from '../core/cpu/types.ts'
import type { Stage, SuccessCondition } from '../core/stages/types.ts'

function checkCondition(snapshot: CpuSnapshot, cond: SuccessCondition): boolean {
  if (cond.type === 'register') {
    return snapshot.registers[cond.target as keyof typeof snapshot.registers] === cond.expected
  }
  if (cond.type === 'memory') {
    return snapshot.memory[cond.address] === cond.expected
  }
  if (cond.type === 'flag') {
    return snapshot.flags[cond.flag] === cond.expected
  }
  return false
}

export const useCpuStore = defineStore('cpu', () => {
  const cpu = new Cpu()

  const snapshot = ref<CpuSnapshot>(cpu.snapshot)
  const parseErrors = ref<ParseError[]>([])
  const lastResult = ref<ExecutionResult | null>(null)
  const currentStage = ref<Stage | null>(null)

  const isHalted = computed(() => snapshot.value.halted)
  // snapshot への依存で自動更新される
  const activeLine = computed(() => {
    void snapshot.value  // reactivity trigger
    return cpu.currentSourceLine
  })

  const lineToPc = computed(() => {
    void snapshot.value  // reactivity trigger
    return cpu.lineToPc
  })
  const isCleared = computed(() => {
    if (!currentStage.value || !lastResult.value) return false
    return currentStage.value.successConditions.every(cond =>
      checkCondition(lastResult.value!.snapshot, cond),
    )
  })

  function loadStage(stage: Stage, source = '') {
    currentStage.value = stage
    // DEBUG: 命令制約を一時的に無効化
    const allowed: InstructionType[] | undefined = undefined
    cpu.load(source, allowed, stage.initialMemory)
    snapshot.value = cpu.snapshot
    parseErrors.value = cpu.errors
    lastResult.value = null
  }

  function loadSource(source: string) {
    const stage = currentStage.value
    // DEBUG: 命令制約を一時的に無効化
    const allowed: InstructionType[] | undefined = undefined
    cpu.load(source, allowed, stage?.initialMemory)
    snapshot.value = cpu.snapshot
    parseErrors.value = cpu.errors
    lastResult.value = null
  }

  function stepForward(): ExecutionResult {
    const result = cpu.stepForward()
    snapshot.value = result.snapshot
    lastResult.value = result
    return result
  }

  function stepBackward() {
    const snap = cpu.stepBackward()
    if (snap) snapshot.value = snap
    lastResult.value = null
  }

  function runAll(): ExecutionResult {
    const result = cpu.runAll()
    snapshot.value = result.snapshot
    lastResult.value = result
    return result
  }

  function reset() {
    cpu.reset()
    snapshot.value = cpu.snapshot
    lastResult.value = null
  }

  return {
    snapshot,
    parseErrors,
    lastResult,
    currentStage,
    isHalted,
    activeLine,
    lineToPc,
    isCleared,
    loadStage,
    loadSource,
    stepForward,
    stepBackward,
    runAll,
    reset,
  }
})
