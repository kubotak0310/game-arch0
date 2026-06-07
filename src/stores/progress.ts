/**
 * 進捗ストア（Pinia + persist）。
 *
 * クリア済みステージ ID / 既読インタールード ID / 現在ステージインデックスを保持し、
 * `persist: true` で localStorage に自動永続化する（リロードで失われない）。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  /** クリアしたステージ ID の一覧（順不同、重複なし）。 */
  const clearedStageIds = ref<string[]>([])
  /** 既に閲覧したインタールード ID の一覧（再表示判定に使う）。 */
  const seenInterludeIds = ref<string[]>([])
  /** ステージ一覧での現在位置（章ナビゲーションで使用）。 */
  const currentStageIndex = ref(0)

  /** ステージをクリア済みにマークする。既にマーク済みなら何もしない。 */
  function markCleared(id: string) {
    if (!clearedStageIds.value.includes(id)) clearedStageIds.value.push(id)
  }

  /** インタールードを既読にマークする。 */
  function markInterludeSeen(id: string) {
    if (!seenInterludeIds.value.includes(id)) seenInterludeIds.value.push(id)
  }

  function isCleared(id: string) { return clearedStageIds.value.includes(id) }
  function isInterludeSeen(id: string) { return seenInterludeIds.value.includes(id) }

  return { clearedStageIds, seenInterludeIds, currentStageIndex, markCleared, markInterludeSeen, isCleared, isInterludeSeen }
}, { persist: true })
