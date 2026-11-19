/**
 * 英文站挂在 /en/** 下，中文站挂根路由（见 config.mts 的 rewrites），
 * 所以「这篇文章属于哪个语言站」只能靠 url 前缀判断。
 */
export type Locale = 'zh' | 'en'

const EN = '/en'

/** 该语言站的 URL 前缀 */
export function localeBase(locale: Locale): string {
  return locale === 'en' ? EN : ''
}

export function localeOf(url: string): Locale {
  return url === EN || url.startsWith(`${EN}/`) ? 'en' : 'zh'
}

export function inLocale(url: string, locale: Locale): boolean {
  return localeOf(url) === locale
}
