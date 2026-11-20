<script setup lang="ts">
import { withBase } from 'vitepress'

const chapters = [
  {
    n: '01',
    title: '方程组',
    en: 'Systems of equations',
    count: '4 节',
    link: '/chapter-1/'
  },
  {
    n: '02',
    title: '向量、矩阵与线性组合',
    en: 'Vectors, matrices, and linear combinations',
    count: '6 节',
    link: '/chapter-2/'
  },
  {
    n: '03',
    title: '可逆性、基与坐标系',
    en: 'Invertibility, bases, and coordinate systems',
    count: '5 节',
    link: '/chapter-3/'
  },
  {
    n: '04',
    title: '特征值与特征向量',
    en: 'Eigenvalues and eigenvectors',
    count: '5 节',
    link: '/chapter-4/'
  }
]
</script>

<template>
  <section class="ula-chapters">
    <div class="ula-chapters__inner">
      <header class="ula-chapters__head">
        <p class="ula-eyebrow">全书目录</p>
        <h2>四章</h2>
        <p class="ula-lede">
          原书第 1–4 章，共 20 节。
        </p>
      </header>

      <div class="ula-cards">
        <a
          v-for="c in chapters"
          :key="c.n"
          class="ula-card"
          :href="withBase(c.link)"
        >
          <span class="ula-card__n">第 {{ c.n }} 章</span>
          <h3>{{ c.title }}</h3>
          <p class="ula-card__en">{{ c.en }}</p>
          <p class="ula-card__meta">{{ c.count }}</p>
          <span class="ula-card__go">进入本章 <span aria-hidden="true">→</span></span>
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
  line-height: 1.45;
  margin: 8px 0 2px;
  letter-spacing: -0.01em;
  min-height: 2.9em;
}
.ula-card__en {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  margin: 0 0 12px;
  letter-spacing: 0.01em;
  line-height: 1.5;
}
.ula-card__meta {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  margin: 0 0 16px;
}
.ula-card__go {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  margin-top: auto;
}
.ula-chapters__note {
  margin: 28px 0 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
  line-height: 1.7;
}
</style>
