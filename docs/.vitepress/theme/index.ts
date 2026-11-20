// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PostList from "@/components/PostList.vue"
import Collections from "@/components/Collections.vue"
import "@/theme/style.css"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 全局注册，md 里直接写 <PostList prefix="/blog/" />
    app.component("PostList", PostList)
    app.component("Collections", Collections)
  },
} satisfies Theme
