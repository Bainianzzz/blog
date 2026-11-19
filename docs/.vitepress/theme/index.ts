// https://vitepress.dev/guide/custom-theme
import { defineComponent, h } from 'vue'
import type { Theme } from 'vitepress'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import DotGrid from "@/components/DotGrid.vue"
import PostList from "@/components/PostList.vue"
import "@/theme/style.css"

export default {
  extends: DefaultTheme,
  Layout: defineComponent({
    setup() {
      // 只有首页（layout: home）才挂点阵背景
      const { frontmatter } = useData()
      return () =>
        h(DefaultTheme.Layout, null, {
          // https://vitepress.dev/guide/extending-default-theme#layout-slots
          "layout-top": () =>
            frontmatter.value.layout === "home" ? h(DotGrid) : null,
        })
    },
  }),
  enhanceApp({ app }) {
    // 全局注册，md 里直接写 <PostList prefix="/blog/" />
    app.component("PostList", PostList)
  },
} satisfies Theme
