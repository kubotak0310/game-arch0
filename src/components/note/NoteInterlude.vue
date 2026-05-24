<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import type { NoteInterlude, Stage } from '../../core/stages/types.ts'
import DiagramRegister from './DiagramRegister.vue'
import DiagramFlags from './DiagramFlags.vue'
import DiagramAlu from './DiagramAlu.vue'
import DiagramChain from './DiagramChain.vue'
import DiagramSwap from './DiagramSwap.vue'
import DiagramLoop from './DiagramLoop.vue'

const props = withDefaults(defineProps<{
  interlude: NoteInterlude
  stage?: Stage
  locale?: 'ja' | 'en'
  darkBackdrop?: boolean
}>(), {
  locale: 'ja',
  darkBackdrop: false,
})

const emit = defineEmits<{
  start: []
}>()

const pages = computed(() => props.interlude[props.locale])

function splitParagraphs(text: string): string[] {
  return text.split('\n\n')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === 'Escape') {
    e.preventDefault()
    emit('start')
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="interlude-backdrop" :class="{ dark: darkBackdrop }">
    <div class="notebook">
      <div class="punch-holes">
        <span class="hole" />
        <span class="hole" />
        <span class="hole" />
        <span class="hole" />
      </div>

      <div v-if="stage" class="stage-label">第{{ stage.chapter }}章 — {{ stage.title[locale] }}</div>

      <div v-for="(page, i) in pages" :key="i" class="page">
        <div v-if="page.date" class="date">{{ page.date }}</div>
        <div class="body" :lang="locale">
          <p v-for="(para, pi) in splitParagraphs(page.body)" :key="pi">{{ para }}</p>
        </div>
        <DiagramRegister v-if="page.diagram === 'registers'" />
        <DiagramFlags v-if="page.diagram === 'flags'" />
        <DiagramAlu v-if="page.diagram === 'alu'" />
        <DiagramChain v-if="page.diagram === 'chain'" />
        <DiagramSwap v-if="page.diagram === 'swap'" />
        <DiagramLoop v-if="page.diagram === 'loop'" />
        <div v-if="page.marginNote" class="margin-note">{{ page.marginNote }}</div>
      </div>
    </div>

    <button class="start-btn" @click="emit('start')">演習を始める</button>
  </div>
</template>

<style scoped>
.interlude-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 1000;
  animation: backdrop-in 0.25s ease-out;
  transition: background 0.4s ease;
}

.interlude-backdrop.dark {
  background: rgba(0, 0, 0, 0.92);
}

@keyframes backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.notebook {
  position: relative;
  width: 740px;
  max-width: 94vw;
  max-height: 75vh;
  overflow-y: auto;
  background-color: #F7F3EA;
  padding: 48px 48px 48px 88px;
  color: #1a1a1a;
  font-family: 'Klee One', serif;
  font-size: 16px;
  line-height: 1.9;
  border-radius: 4px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  animation: notebook-in 0.3s ease-out;
}

@keyframes notebook-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.notebook::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50px;
  width: 1px;
  background: rgba(200, 60, 60, 0.28);
}

.punch-holes {
  position: absolute;
  left: 14px;
  top: 48px;
  bottom: 48px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}

.hole {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.16);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stage-label {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #5a4020;
  margin-bottom: 16px;
}

.page {
  margin-bottom: 20px;
}

.page:last-child {
  margin-bottom: 0;
}

.date {
  font-family: 'Caveat', cursive;
  font-size: 20px;
  color: #8B6914;
  opacity: 0.65;
  margin-bottom: 4px;
}

.body {
  word-break: break-word;
  letter-spacing: 0.01em;
}

.body p {
  white-space: pre-wrap;
  margin: 0 0 20px 0;
}

.body p:last-child {
  margin-bottom: 0;
}

.body[lang="en"] p {
  font-family: 'Caveat', cursive;
  font-size: 22px;
  line-height: 30px;
}

.margin-note {
  font-family: 'Caveat', cursive;
  font-size: 17px;
  color: #1A3A6A;
  line-height: 1.55;
  margin-top: 20px;
  padding: 2px 0 2px 12px;
  border-left: 2px solid rgba(26, 58, 106, 0.35);
  white-space: pre-wrap;
  display: inline-block;
  transform: rotate(-0.8deg);
  transform-origin: left center;
}

.start-btn {
  padding: 11px 32px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s, border-color 0.15s, transform 0.1s;
}

.start-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.55);
}

.start-btn:active {
  transform: scale(0.97);
}
</style>
