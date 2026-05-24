import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  const clearedStageIds = ref<string[]>([])
  const seenInterludeIds = ref<string[]>([])
  const currentStageIndex = ref(0)

  function markCleared(id: string) {
    if (!clearedStageIds.value.includes(id)) clearedStageIds.value.push(id)
  }

  function markInterludeSeen(id: string) {
    if (!seenInterludeIds.value.includes(id)) seenInterludeIds.value.push(id)
  }

  function isCleared(id: string) { return clearedStageIds.value.includes(id) }
  function isInterludeSeen(id: string) { return seenInterludeIds.value.includes(id) }

  return { clearedStageIds, seenInterludeIds, currentStageIndex, markCleared, markInterludeSeen, isCleared, isInterludeSeen }
}, { persist: true })
