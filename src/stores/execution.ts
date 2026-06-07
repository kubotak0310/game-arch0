/**
 * 実行制御ストア（Pinia）。
 *
 * CPU の「自動連続実行」「停止」「ステップ」「リセット」を 1 箇所で扱う。
 * 進行は `setTimeout` のチェーンで実装し、再帰呼び出しを避けつつ実速度を `speed` で調整する。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCpuStore } from './cpu.ts'

export const useExecutionStore = defineStore('execution', () => {
  /** 実行速度。1（最も遅い）〜 5（最も速い）。UI のスライダで切り替える。 */
  const speed = ref(3)
  const isRunning = ref(false)
  const isStepMode = ref(false)

  let runTimer: ReturnType<typeof setTimeout> | null = null

  /** speed の段階を 1 ステップあたりの待ち時間 (ms) に変換する。 */
  function speedToMs(): number {
    return [800, 400, 200, 100, 50][speed.value - 1]
  }

  /**
   * 通常実行（タイマーで 1 ステップずつ進める）。
   * HALT 済みの場合は何もしない。`pc >= 10000` は無限ループ保護の暫定上限。
   */
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

  /** タイマーを使わず、内部で `Cpu.runAll()` を呼んで一気に終端まで進める。 */
  function runAll() {
    const cpuStore = useCpuStore()
    stop()
    cpuStore.runAll()
  }

  /** 連続実行を中断する。タイマーが残っていればクリア。 */
  function stop() {
    isRunning.value = false
    if (runTimer !== null) {
      clearTimeout(runTimer)
      runTimer = null
    }
  }

  /** 1 命令進める。連続実行中なら停止してからステップする。 */
  function stepForward() {
    stop()
    isStepMode.value = true
    useCpuStore().stepForward()
  }

  /** 1 命令戻す。連続実行中なら停止してから巻き戻す。 */
  function stepBackward() {
    stop()
    isStepMode.value = true
    useCpuStore().stepBackward()
  }

  /** 実行停止 + CPU 状態を初期スナップショットに戻す。 */
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
