<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter } = useData()
const route = useRoute()
const progress = ref(0)
const active = ref(false)
let ticking = false

function compute() {
  const article = document.querySelector('.vp-doc') as HTMLElement | null
  if (!article) {
    active.value = false
    ticking = false
    return
  }
  const start = article.offsetTop
  const height = article.offsetHeight - window.innerHeight + 160
  const y = window.scrollY - start + 120
  progress.value = Math.min(1, Math.max(0, height > 0 ? y / height : 0))
  active.value = window.scrollY > start - 200
  ticking = false
}

function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(compute)
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  compute()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})

watch(() => route.path, () => {
  progress.value = 0
  setTimeout(compute, 60)
})
</script>

<template>
  <div v-show="active && frontmatter.layout !== 'home'" class="ula-progress" aria-hidden="true">
    <span :style="{ transform: `scaleX(${progress})` }" />
  </div>
</template>

<style scoped>
.ula-progress {
  position: fixed;
  inset: 0 0 auto;
  height: 2px;
  z-index: 60;
  pointer-events: none;
}
.ula-progress span {
  display: block;
  height: 100%;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, #4f46e5, #7c6cf7 45%, #0d9488 80%, #f59e0b);
  transition: transform 0.1s linear;
}
</style>
