import { defineRoutes } from 'vitepress'
// paths 文件由 Vite 的 config loader 加载，没有 @ 别名，只能相对路径
import { COLLECTIONS } from '../../../.vitepress/collections.ts'

// 一个模板页服务所有合集：合集清单换了，这里的路由跟着变
export default defineRoutes({
  paths: () => COLLECTIONS.en.map((name) => ({ params: { name } })),
  // 详情页标题就是合集名，行为和博客页一致（hero 里的大标题 + 标签页标题）
  transformPageData: (pageData) => ({
    title: pageData.params?.name,
    frontmatter: { ...pageData.frontmatter, hero: { name: pageData.params?.name } },
  }),
})
