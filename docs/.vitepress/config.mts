import { defineConfig } from 'vitepress'
import { katex } from '@mdit/plugin-katex'
import container from 'markdown-it-container'
import type MarkdownIt from 'markdown-it'
import macros from './theme/katex-macros.json'

const BLOCKS = [
  'activity', 'definition', 'theorem', 'proposition', 'example',
  'observation', 'principle', 'exercise', 'note', 'proof',
  'ula-figure', 'ula-sbs', 'ula-alpha', 'ula-dl'
]

function ulaContainers(md: MarkdownIt) {
  for (const name of BLOCKS) {
    md.use(container, name, {
      render(tokens: any[], idx: number) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          const info = token.info.trim().slice(name.length).trim()
          const tag = name === 'ula-figure' ? 'figure' : 'div'
          const title = info
            ? `<p class="ula-block-title">${info}</p>`
            : ''
          return `<${tag} class="ula-block ula-${name}">${title}\n`
        }
        return `</${name === 'ula-figure' ? 'figure' : 'div'}>\n`
      }
    })
  }
}

export default defineConfig({
  lang: 'zh-CN',
  title: '理解线性代数',
  description:
    '《Understanding Linear Algebra》中文精译版：从方程组、向量与矩阵出发，用几何直觉理解线性代数。',
  base: '/ula-zh/',
  cleanUrls: true,
  appearance: 'light',
  lastUpdated: {
    text: '最后更新',
    formatOptions: { dateStyle: 'medium' }
  },
  head: [
    [
      'script',
      {},
      `try{if(!localStorage.getItem('vitepress-theme-appearance'))localStorage.setItem('vitepress-theme-appearance','light')}catch(e){}`
    ],
    ['link', { rel: 'icon', href: '/ula-zh/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#4f46e5' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '理解线性代数' }],
    [
      'meta',
      {
        property: 'og:description',
        content: '一本用几何直觉讲透线性代数的开放教材 · 中文精译版'
      }
    ]
  ],
  markdown: {
    image: { lazyLoading: true },
    math: false,
    config(md) {
      md.use(katex, {
        throwOnError: false,
        strict: false,
        trust: true,
        macros: {
          ...macros,
          '\\R': '\\mathbb{R}',
          '\\C': '\\mathbb{C}',
          '\\N': '\\mathbb{N}',
          '\\Z': '\\mathbb{Z}',
          '\\Q': '\\mathbb{Q}'
        }
      })
      ulaContainers(md)
    }
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '理解线性代数',
    outline: { level: [2, 3], label: '本页目录' },
    nav: [
      { text: '首页', link: '/' },
      { text: '第一章', link: '/chapter-1/', activeMatch: '/chapter-1/' },
      { text: '第二章', link: '/chapter-2/', activeMatch: '/chapter-2/' },
      { text: '第三章', link: '/chapter-3/', activeMatch: '/chapter-3/' },
      { text: '第四章', link: '/chapter-4/', activeMatch: '/chapter-4/' },
      { text: '关于', link: '/about' }
    ],
    sidebar: {
      '/chapter-1/': [
        {
          text: '第一章 · 方程组',
          items: [
            { text: '1.1 我们能期待什么', link: '/chapter-1/1-1' },
            { text: '1.2 求解线性方程组', link: '/chapter-1/1-2' },
            { text: '1.3 用 Sage 计算', link: '/chapter-1/1-3' },
            { text: '1.4 主元及其对解空间的影响', link: '/chapter-1/1-4' }
          ]
        },
        { text: '附录', items: [{ text: '关于本书与版权', link: '/about' }] }
      ],
      '/chapter-2/': [
        {
          text: '第二章 · 向量、矩阵与线性组合',
          items: [
            { text: '2.1 向量与线性组合', link: '/chapter-2/2-1' },
            { text: '2.2 矩阵乘法与线性组合', link: '/chapter-2/2-2' },
            { text: '2.3 向量组的张成', link: '/chapter-2/2-3' },
            { text: '2.4 线性无关', link: '/chapter-2/2-4' },
            { text: '2.5 矩阵变换', link: '/chapter-2/2-5' },
            { text: '2.6 矩阵变换的几何', link: '/chapter-2/2-6' }
          ]
        }
      ],
      '/chapter-3/': [
        {
          text: '第三章 · 可逆性、基与坐标系',
          items: [
            { text: '3.1 可逆性', link: '/chapter-3/3-1' },
            { text: '3.2 基与坐标系', link: '/chapter-3/3-2' },
            { text: '3.3 图像压缩', link: '/chapter-3/3-3' },
            { text: '3.4 行列式', link: '/chapter-3/3-4' },
            { text: '3.5 子空间', link: '/chapter-3/3-5' }
          ]
        }
      ],
      '/chapter-4/': [
        {
          text: '第四章 · 特征值与特征向量',
          items: [
            { text: '4.1 特征值与特征向量初步', link: '/chapter-4/4-1' },
            { text: '4.2 求特征值与特征向量', link: '/chapter-4/4-2' },
            { text: '4.3 对角化、相似与矩阵的幂', link: '/chapter-4/4-3' },
            { text: '4.4 动力系统', link: '/chapter-4/4-4' },
            { text: '4.5 马尔可夫链与 PageRank 算法', link: '/chapter-4/4-5' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/davidaustinm/ula' }
    ],
    footer: {
      message:
        '基于 David Austin《Understanding Linear Algebra》翻译 · 原文以 CC BY 4.0 许可发布',
      copyright: '中文译文同样采用 CC BY 4.0 许可'
    },
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          options: {
            tokenize: (text: string) =>
              text
                .split(
                  /[\s\-_/.,;:!?()[\]{}'"“”‘’·—]+|(?=[\u4e00-\u9fa5])|(?<=[\u4e00-\u9fa5])/
                )
                .filter(Boolean)
          },
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 }
          }
        },
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询',
            backButtonTitle: '返回',
            noResultsText: '没有找到结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上箭头',
              navigateDownKeyAriaLabel: '下箭头',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc'
            }
          }
        }
      }
    },
    docFooter: { prev: '上一节', next: '下一节' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式'
  }
})
