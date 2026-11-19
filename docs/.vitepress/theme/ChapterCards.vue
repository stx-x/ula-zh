<script setup lang="ts">
import { withBase } from 'vitepress'

const sections = [
  {
    n: '1.1',
    title: '我们能期待什么',
    en: 'What can we expect',
    link: '/chapter-1/1-1'
  },
  {
    n: '1.2',
    title: '求解线性方程组',
    en: 'Finding solutions',
    link: '/chapter-1/1-2'
  },
  {
    n: '1.3',
    title: '用 Sage 计算',
    en: 'Computation with Sage',
    link: '/chapter-1/1-3'
  },
  {
    n: '1.4',
    title: '主元及其影响',
    en: 'Pivots and solution spaces',
    link: '/chapter-1/1-4'
  }
]
</script>

<template>
  <section class="ula-chapters">
    <div class="ula-chapters__inner">
      <header class="ula-chapters__head">
        <p class="ula-eyebrow">第一章</p>
        <h2>方程组</h2>
        <p class="ula-lede">
          原书第一章 Systems of equations，共四节。
        </p>
      </header>

      <div class="ula-cards">
        <a
          v-for="s in sections"
          :key="s.n"
          class="ula-card"
          :href="withBase(s.link)"
        >
          <span class="ula-card__n">{{ s.n }}</span>
          <h3>{{ s.title }}</h3>
          <p class="ula-card__en">{{ s.en }}</p>
          <span class="ula-card__go">阅读本节 <span aria-hidden="true">→</span></span>
        </a>
      </div>

      <p class="ula-chapters__note">
        译文以原书 PreTeXt 源文件为底本，公式逐条保留 LaTeX 原式。
      </p>
    </div>
  </section>
</template>

<style scoped>
.ula-chapters {
  padding: 8px 24px 72px;
}
.ula-chapters__inner {
  max-width: 1152px;
  margin: 0 auto;
}
.ula-chapters__head {
  max-width: 720px;
  margin-bottom: 32px;
}
.ula-eyebrow {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  margin: 0 0 10px;
}
.ula-chapters__head h2 {
  font-family: 'Manrope Variable', var(--vp-font-family-base);
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  border: 0;
  padding: 0;
}
.ula-lede {
  font-size: 16px;
  line-height: 1.85;
  color: var(--vp-c-text-2);
  margin: 0;
}
.ula-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(248px, 1fr));
  gap: 18px;
}
.ula-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px 22px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  overflow: hidden;
}
.ula-card::after {
  content: '';
  position: absolute;
  inset: auto -30% -60% auto;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.16), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.ula-card:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand-3);
  box-shadow: 0 18px 40px rgba(30, 27, 75, 0.1);
}
.ula-card:hover::after {
  opacity: 1;
}
.ula-card__n {
  font-family: 'Manrope Variable', var(--vp-font-family-base);
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  letter-spacing: 0.06em;
}
.ula-card h3 {
  font-size: 19px;
  line-height: 1.4;
  margin: 8px 0 2px;
  letter-spacing: -0.01em;
}
.ula-card__en {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  margin: 0 0 12px;
  letter-spacing: 0.01em;
}
.ula-card__blurb {
  font-size: 14px;
  line-height: 1.75;
  color: var(--vp-c-text-2);
  margin: 0 0 18px;
  flex: 1;
}
.ula-card__go {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
}
.ula-chapters__note {
  margin: 28px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
  line-height: 1.7;
}
</style>
