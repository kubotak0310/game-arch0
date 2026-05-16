import { computed } from 'vue'
import { useCpuStore } from '../stores/cpu.ts'
import { useDebugMode } from './useDebugMode.ts'
import type { InstructionType } from '../core/cpu/types.ts'

const FLAG_INSTRUCTIONS: InstructionType[] = ['CMP', 'BEQ', 'BNE', 'BLT', 'BGT', 'BLE', 'BGE']
const STACK_INSTRUCTIONS: InstructionType[] = ['PUSH', 'POP', 'CALL', 'RET']
const CALL_INSTRUCTIONS: InstructionType[] = ['CALL', 'RET']
const MEMORY_INSTRUCTIONS: InstructionType[] = ['LOAD', 'STORE']

export function useActiveFeatures() {
  const cpuStore = useCpuStore()
  const { isDebugMode } = useDebugMode()

  const unlocked = computed(() => cpuStore.currentStage?.unlockedInstructions as InstructionType[] | undefined)

  const has = (list: InstructionType[]) =>
    isDebugMode.value || !unlocked.value || list.some(i => unlocked.value!.includes(i))

  const flagsActive = computed(() => has(FLAG_INSTRUCTIONS))
  const stackActive = computed(() => has(STACK_INSTRUCTIONS))
  const lrActive = computed(() => has(CALL_INSTRUCTIONS))
  const memoryActive = computed(() => has(MEMORY_INSTRUCTIONS))

  return { flagsActive, stackActive, lrActive, memoryActive }
}
