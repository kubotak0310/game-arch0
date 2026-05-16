import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCpuStore } from './cpu.ts'

export const useExecutionStore = defineStore('execution', () => {
  const speed = ref(3)         // 1(遅)〜5(速)
  const isRunning = ref(false)
  const isStepMode = ref(false)

  let runTimer: ReturnType<typeof setTimeout> | null = null

  function speedToMs(): number {
    // speed 1→800ms, 3→200ms, 5→50ms
    return [800, 400, 200, 100, 50][speed.value - 1]
  }

  async function run() {
    const cpuStore = useCpuStore()
    if (isRunning.value) return
    if (cpuStore.isHalted) return

    isRunning.value = true
    isStepMode.value = false

    function tick() {
      if (!isRunning.value) return
      if (cpuStore.isHalted || cpuStore.snapshot.pc >= 10000) {
        isRunning.value = false
        return
      }
      cpuStore.stepForward()
      if (cpuStore.isHalted) {
        isRunning.value = false
        return
      }
      runTimer = setTimeout(tick, speedToMs())
    }
    tick()
  }

  function runAll() {
    const cpuStore = useCpuStore()
    stop()
    cpuStore.runAll()
  }

  function stop() {
    isRunning.value = false
    if (runTimer !== null) {
      clearTimeout(runTimer)
      runTimer = null
    }
  }

  function stepForward() {
    stop()
    isStepMode.value = true
    useCpuStore().stepForward()
  }

  function stepBackward() {
    stop()
    isStepMode.value = true
    useCpuStore().stepBackward()
  }

  function reset() {
    stop()
    isStepMode.value = false
    useCpuStore().reset()
  }

  return {
    speed,
    isRunning,
    isStepMode,
    run,
    runAll,
    stop,
    stepForward,
    stepBackward,
    reset,
  }
})
