import { createContentLoader } from 'vitepress'
// 这个文件由 Vite 的 config loader 加载，拿不到 vite 的 @ 别名，只能用相对路径
import { COLLECTIONS } from '../collections.ts'
import { localeOf } from './locale.ts'

export interface Post {
  title: string
  url: string
  date: string
  /** 所属合集，可选；没写的文章不进入合集系统 */
  category?: string
}

declare const data: Post[]
export { data }

// 一次扫完全站四个栏目，各索引页用 <PostList prefix="…" /> 取自己那批
// https://vitepress.dev/guide/data-loading#usage-example-blog-index
export default createContentLoader(
  ['zh/blog/*.md', 'zh/diary/*.md', 'en/blog/*.md', 'en/diary/*.md'],
  {
    transform(raw): Post[] {
      return raw
        // 目录索引页（url 以 / 结尾）不算文章
        .filter(({ url }) => !url.endsWith('/'))
        .map(({ url, frontmatter }) => ({
          title: frontmatter.title ?? url,
          url,
          date: toDateString(frontmatter.date),
          category: toCategory(frontmatter.category, url),
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
    },
  },
)

// frontmatter 里的 date 会被 YAML 解析成 Date，统一转成 YYYY-MM-DD
function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value ? String(value) : ''
}

// 合集是可选字段：只认清单里的名字，没写 / 留空 / 写成列表 / 写错名字，一律当作没选
function toCategory(value: unknown, url: string): string | undefined {
  if (typeof value !== 'string') return undefined
  const category = value.trim()
  return COLLECTIONS[localeOf(url)].includes(category) ? category : undefined
}
