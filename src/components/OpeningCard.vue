<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const emit = defineEmits<{ done: [] }>()

const ready = ref(false)

function handleInput() {
  if (!ready.value) return
  emit('done')
}

onMounted(() => {
  setTimeout(() => { ready.value = true }, 1600)
  window.addEventListener('keydown', handleInput)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleInput)
})
</script>

<template>
  <div class="opening" @click="handleInput">
    <p class="line">
      大学の地下倉庫で、古いノートを見つけた。<br>
      埃をかぶった棚の、いちばん奥に。<br>
      いつ書かれたのか、誰のものかも分からない。<br>
      表紙には「ARCH-0」と書かれていた。
    </p>
  </div>
</template>

<style scoped>
.opening {
  position: fixed;
  inset: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
}

.line {
  color: rgba(255, 255, 255, 0.82);
  font-family: 'Klee One', serif;
  font-size: 19px;
  letter-spacing: 0.07em;
  line-height: 2.2;
  text-align: center;
  animation: text-in 2.4s ease-out both;
}

@keyframes text-in {
  0%   { opacity: 0; }
  35%  { opacity: 0; }
  100% { opacity: 1; }
}
</style>
