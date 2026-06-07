/**
 * 現在のステージで「どの UI 機能（パネル）が有効化されているか」を返すコンポーザブル。
 *
 * 章ごとに開放命令が増えていく設計上、未開放の機能はサイドパネルにも出さない方が学習体験が良い。
 * 例：第1章では `CMP`/分岐がないのでフラグ表示は隠す、第2章までは `PUSH/POP` がないのでスタックも隠す。
 *
 * デバッグモード時はすべて表示する（検証用）。
 */
import { computed } from 'vue'
import { useCpuStore } from '../stores/cpu.ts'
import { useDebugMode } from './useDebugMode.ts'
import type { InstructionType } from '../core/cpu/types.ts'

/** フラグ表示の有効化トリガーとなる命令群（CMP と全分岐）。 */
const FLAG_INSTRUCTIONS: InstructionType[] = ['CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE']
/** スタック表示の有効化トリガー（明示的な PUSH/POP と暗黙の CALL/RET）。 */
const STACK_INSTRUCTIONS: InstructionType[] = ['PUSH', 'POP', 'CALL', 'RET']
/** LR 表示の有効化トリガー（CALL/RET が使えるなら戻り先アドレスを見せる）。 */
const CALL_INSTRUCTIONS: InstructionType[] = ['CALL', 'RET']
/** メモリビュー有効化トリガー（LOAD/STORE が解放された章以降）。 */
const MEMORY_INSTRUCTIONS: InstructionType[] = ['LOAD', 'STORE']

export function useActiveFeatures() {
  const cpuStore = useCpuStore()
  const { isDebugMode } = useDebugMode()

  const unlocked = computed(() => cpuStore.currentStage?.unlockedInstructions as InstructionType[] | undefined)

  /** ステージに `unlockedInstructions` が無い場合は全許可とみなす（自由実行モード）。 */
  const has = (list: InstructionType[]) =>
    isDebugMode.value || !unlocked.value || list.some(i => unlocked.value!.includes(i))

  const flagsActive = computed(() => has(FLAG_INSTRUCTIONS))
  const stackActive = computed(() => has(STACK_INSTRUCTIONS))
  const lrActive = computed(() => has(CALL_INSTRUCTIONS))
  const memoryActive = computed(() => has(MEMORY_INSTRUCTIONS))

  return { flagsActive, stackActive, lrActive, memoryActive }
}
