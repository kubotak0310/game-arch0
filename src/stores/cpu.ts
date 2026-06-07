/**
 * CPU ストア（Pinia）。
 *
 * `src/core/cpu/cpu.ts` の `Cpu` クラスを Vue リアクティブに包む薄いラッパー。
 * **CPU ロジック自体はここに重複実装しない**（CLAUDE.md の「Phase 2 着手時の注意」を参照）。
 *
 * UI からは Cpu のメソッドを直接呼ぶのではなく、このストアの関数経由で操作することで、
 * snapshot の差し替えとリアクティブ通知をまとめて行う。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Cpu } from '../core/cpu/cpu.ts'
import { useDebugMode } from '../composables/useDebugMode.ts'
import type { CpuSnapshot, ExecutionResult, ParseError } from '../core/cpu/types.ts'
import type { Stage, SuccessCondition } from '../core/stages/types.ts'

/** 単一の成功条件を、与えられたスナップショットで判定する。 */
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
  if (cond.type === 'instruction_used') {
    return snapshot.instructionsUsed.includes(cond.op)
  }
  return false
}

export const useCpuStore = defineStore('cpu', () => {
  const cpu = new Cpu()
  const { isDebugMode } = useDebugMode()

  const snapshot = ref<CpuSnapshot>(cpu.snapshot)
  const parseErrors = ref<ParseError[]>([])
  const lastResult = ref<ExecutionResult | null>(null)
  const currentStage = ref<Stage | null>(null)
  const initialMemoryAddresses = ref<Set<number>>(new Set())

  const isHalted = computed(() => snapshot.value.halted)
  // Cpu インスタンス内部の状態を覗くため、snapshot 参照で依存をトリガーして再評価させる
  const activeLine = computed(() => {
    void snapshot.value
    return cpu.currentSourceLine
  })

  const lineToPc = computed(() => {
    void snapshot.value
    return cpu.lineToPc
  })

  const previousSnapshot = computed(() => {
    void snapshot.value
    return cpu.previousSnapshot
  })
  const isCleared = computed(() => {
    if (!currentStage.value || !lastResult.value) return false
    return currentStage.value.successConditions.every(cond =>
      checkCondition(lastResult.value!.snapshot, cond),
    )
  })

  /**
   * 新しいステージをロードする。
   * デバッグモード時は `unlockedInstructions` を無視して全命令を許可する（検証用）。
   */
  function loadStage(stage: Stage, source = '') {
    currentStage.value = stage
    initialMemoryAddresses.value = new Set(stage.initialMemory?.map(m => m.address) ?? [])
    const allowed = isDebugMode.value ? undefined : stage.unlockedInstructions
    cpu.load(source, allowed, stage.initialMemory, stage.initialRegisters)
    snapshot.value = cpu.snapshot
    parseErrors.value = cpu.errors
    lastResult.value = null
  }

  /**
   * 同じステージのまま、エディタ内容（ソース）だけを再ロードする。
   * エディタ更新時に呼ばれる。
   */
  function loadSource(source: string) {
    const stage = currentStage.value
    const allowed = isDebugMode.value ? undefined : stage?.unlockedInstructions
    cpu.load(source, allowed, stage?.initialMemory, stage?.initialRegisters)
    snapshot.value = cpu.snapshot
    parseErrors.value = cpu.errors
    lastResult.value = null
  }

  /** 1 命令進める。snapshot と直近結果を更新して結果を返す。 */
  function stepForward(): ExecutionResult {
    const result = cpu.stepForward()
    snapshot.value = result.snapshot
    lastResult.value = result
    return result
  }

  /** 1 命令戻す。`lastResult` はクリアする（ハイライト用の差分情報を消す）。 */
  function stepBackward() {
    const snap = cpu.stepBackward()
    if (snap) snapshot.value = snap
    lastResult.value = null
  }

  /** プログラム全体を最後まで実行する（HALT または上限ステップ到達まで）。 */
  function runAll(): ExecutionResult {
    const result = cpu.runAll()
    snapshot.value = result.snapshot
    lastResult.value = result
    return result
  }

  /** 履歴先頭（ロード直後の状態）に戻す。 */
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
    initialMemoryAddresses,
    isHalted,
    activeLine,
    lineToPc,
    previousSnapshot,
    isCleared,
    loadStage,
    loadSource,
    stepForward,
    stepBackward,
    runAll,
    reset,
  }
})
