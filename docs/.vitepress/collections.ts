// 被 config loader 加载时没有 @ 别名，相对路径
import type { Locale } from './theme/locale.ts'

/**
 * 合集清单，唯一的事实来源。
 *
 * 新增一个合集：先在这里加上名字和一句说明，再写进文章的 frontmatter：
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
export interface Collection {
  /** 合集名：文章的 category 取值，也进 URL，所以别随便改 */
  name: string
  /** 合集卡片上的一句话说明 */
  description: string
}

export const COLLECTIONS: Record<Locale, readonly Collection[]> = {
  zh: [
    {
      name: 'agent 学习之路',
      description: '记录学习时的所思所想，分享动手实践的小成果',
    },
  ],
  en: [],
}

/** 清单里是否有这个合集，用来校验 frontmatter 里的 category 和 URL 参数 */
export function isCollection(locale: Locale, name: unknown): name is string {
  return typeof name === 'string' && COLLECTIONS[locale].some((c) => c.name === name)
}
