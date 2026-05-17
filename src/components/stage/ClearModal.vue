<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import confetti from 'canvas-confetti'
import type { Stage } from '../../core/stages/types.ts'

const props = defineProps<{
  stage: Stage
  hasNext: boolean
}>()

const emit = defineEmits<{
  next: []
  review: []
}>()

let animFrame: number | null = null

function launchConfetti() {
  const duration = 3000
  const end = Date.now() + duration

  function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#4ade80', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa'],
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#4ade80', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa'],
    })
    if (Date.now() < end) {
      animFrame = requestAnimationFrame(frame)
    }
  }
  frame()
}

onMounted(() => {
  launchConfetti()
})

onBeforeUnmount(() => {
  if (animFrame !== null) cancelAnimationFrame(animFrame)
  confetti.reset()
})
</script>

<template>
  <div class="modal-overlay" @click.self="emit('review')">
    <div class="modal-card">
      <div class="clear-label">STAGE CLEAR</div>
      <div class="stage-info">
        <span class="chapter">第{{ stage.chapter }}章</span>
        <span class="title">{{ stage.title.ja }}</span>
      </div>
      <div class="objective">{{ stage.objective.ja }}</div>
      <div class="actions">
        <button v-if="hasNext" class="btn btn-next" @click="emit('next')">
          次のステージへ →
        </button>
        <div v-else class="chapter-complete">第{{ stage.chapter }}章 完了！</div>
        <button class="btn btn-review" @click="emit('review')">
          このステージを復習する
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fade-in 0.2s ease;
}

.modal-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.clear-label {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--color-accent-green);
  text-shadow: 0 0 24px color-mix(in srgb, var(--color-accent-green) 40%, transparent);
}

.stage-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chapter {
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-border);
  padding: 2px 8px;
  border-radius: 4px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.objective {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.btn {
  width: 100%;
  padding: 11px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.btn-next {
  background: var(--color-accent-green-dark);
  border: 1px solid var(--color-accent-green-dark);
  color: white;
}

.btn-next:hover {
  background: #15803d;
  border-color: #15803d;
}

.btn-review {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-review:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.chapter-complete {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-accent-amber);
  padding: 11px 0;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
</style>
