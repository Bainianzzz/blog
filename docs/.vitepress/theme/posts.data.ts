import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  url: string
  date: string
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
