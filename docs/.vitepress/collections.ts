// 被 config loader 加载时没有 @ 别名，相对路径
import type { Locale } from './theme/locale.ts'

/**
 * 合集清单，唯一的事实来源。
 *
 * 新增一个合集：先在这里加上名字，再写进文章的 frontmatter：
 *
 * ```md
 * ---
 * category: 后端
 * ---
 * ```
 *
 * 文章里写了不在本表里的 category 会直接报错；没写 category 的文章不属于任何合集。
 * 一个合集一个名字，文章只能选一个。
 */
export const COLLECTIONS: Record<Locale, readonly string[]> = {
  zh: ['agent 学习之路'],
  en: [],
}
