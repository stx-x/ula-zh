import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import '@fontsource-variable/inter'
import '@fontsource-variable/manrope'
import 'katex/dist/katex.min.css'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout
} satisfies Theme
