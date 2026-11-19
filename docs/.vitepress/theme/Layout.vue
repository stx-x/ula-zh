<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import ChapterCards from './ChapterCards.vue'
import ReadingProgress from './ReadingProgress.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <ReadingProgress />
    </template>
    <template #home-features-after>
      <ChapterCards />
    </template>
  </Layout>
</template>
