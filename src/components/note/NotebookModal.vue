<script setup lang="ts">
/**
 * 「ノート」モーダル。
 *
 * 既読インタールード（ステージクリア時に得たノートページ）を 1 冊にまとめ、
 * ステージ単位で章タイトル付きで通読できる UI を提供する。
 * 紙の風合い・赤の罫線・パンチ穴の装飾を CSS で再現している。
 *
 * `currentStageId` を渡すと、開いた瞬間にそのステージへスクロールする。
 */
import { onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { Stage, NotePage } from '../../core/stages/types.ts'
import DiagramRegister from './DiagramRegister.vue'
import DiagramFlags from './DiagramFlags.vue'
import DiagramAlu from './DiagramAlu.vue'
import DiagramChain from './DiagramChain.vue'
import DiagramSwap from './DiagramSwap.vue'
import DiagramLoop from './DiagramLoop.vue'

const props = defineProps<{
  entries: Array<{ stage: Stage; pages: NotePage[] }>
  currentStageId?: string
}>()

const emit = defineEmits<{ close: [] }>()

/** Esc キーで閉じる。モーダル外クリックでも閉じる（テンプレート側 @click.self）。 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.preventDefault(); emit('close') }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (props.currentStageId) {
    // 該当ステージ見出しまで自動スクロール（DOM 反映を待つため nextTick）
    nextTick(() => {
      const el = document.getElementById(`nb-stage-${props.currentStageId}`)
      el?.scrollIntoView({ block: 'start' })
    })
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="nb-backdrop" @click.self="emit('close')">
    <div class="nb-shell">
      <!-- 左端の穴あけ -->
      <div class="punch-holes">
        <span v-for="i in 6" :key="i" class="hole" />
      </div>

      <!-- ヘッダー -->
      <div class="nb-header">
        <span class="nb-title">ノート</span>
        <button class="nb-close" title="閉じる (Esc)" @click="emit('close')">✕</button>
      </div>

      <!-- スクロール本文 -->
      <div v-if="entries.length > 0" class="nb-scroll">
        <template v-for="entry in entries" :key="entry.stage.id">
          <div :id="`nb-stage-${entry.stage.id}`" class="nb-stage-label">第{{ entry.stage.chapter }}章 — {{ entry.stage.title.ja }}</div>
          <div v-for="(page, pi) in entry.pages" :key="pi" class="nb-page">
            <div v-if="page.date" class="nb-date">{{ page.date }}</div>
            <div class="nb-body">{{ page.body }}</div>
            <DiagramRegister v-if="page.diagram === 'registers'" />
            <DiagramFlags v-if="page.diagram === 'flags'" />
            <DiagramAlu v-if="page.diagram === 'alu'" />
            <DiagramChain v-if="page.diagram === 'chain'" />
            <DiagramSwap v-if="page.diagram === 'swap'" />
            <DiagramLoop v-if="page.diagram === 'loop'" />
          </div>
        </template>
      </div>

      <div v-else class="nb-empty">
        まだノートにメモはありません。
      </div>
    </div>
  </div>
</template>

<style scoped>
.nb-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  animation: backdrop-in 0.2s ease;
}

@keyframes backdrop-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.nb-shell {
  position: relative;
  width: 740px;
  max-width: 94vw;
  height: 85vh;
  display: flex;
  flex-direction: column;
  background-color: #F7F3EA;
  border-radius: 4px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  animation: nb-in 0.25s ease-out;
}

@keyframes nb-in {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* 赤い縦マージン線 */
.nb-shell::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 62px;
  width: 1px;
  background: rgba(200, 60, 60, 0.28);
  pointer-events: none;
  z-index: 2;
}

.punch-holes {
  position: absolute;
  left: 14px;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  pointer-events: none;
  z-index: 3;
  padding: 16px 0;
}

.hole {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.28);
  flex-shrink: 0;
}

/* ヘッダーバー */
.nb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 9px 88px;
  background: #ede8dc;
  border-bottom: 1px solid #d0c59e;
  flex-shrink: 0;
  z-index: 1;
}

.nb-title {
  font-family: 'Klee One', serif;
  font-size: 15px;
  color: #5a4020;
  letter-spacing: 0.06em;
}

.nb-close {
  font-size: 15px;
  color: #8B6914;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.55;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 3px;
  transition: opacity 0.15s;
}
.nb-close:hover { opacity: 1; }

/* スクロール領域 — ここが"ノートの紙" */
.nb-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 48px 56px 88px;
  background-color: #F7F3EA;
  color: #1a1a1a;
  font-family: 'Klee One', serif;
  font-size: 16px;
  line-height: 1.9;
}

/* ステージ区切り */
.nb-stage-label {
  margin-top: 56px; /* 28px × 2 でグリッドに揃える */
  line-height: 28px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #5a4020;
}

/* 1ページ分 */
.nb-page {
  padding-top: 4px;
}

.nb-date {
  font-family: 'Caveat', cursive;
  font-size: 19px;
  color: #8B6914;
  opacity: 0.65;
  display: inline-block;
  transform: rotate(-0.5deg);
}

.nb-body {
  white-space: pre-wrap;
  word-break: break-word;
  letter-spacing: 0.01em;
}

/* 空状態 */
.nb-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Klee One', serif;
  font-size: 15px;
  color: #8B6914;
  opacity: 0.5;
  background-color: #F7F3EA;
}
</style>
