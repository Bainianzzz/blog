<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as posts } from '@/theme/posts.data'
import { COLLECTIONS, isCollection } from '@/collections'
import { inLocale, localeBase, type Locale } from '@/theme/locale'
import PostList from '@/components/PostList.vue'

const props = withDefaults(defineProps<{ locale?: Locale }>(), { locale: 'zh' })

const { page } = useData()
const isEn = computed(() => props.locale === 'en')

/** 合集详情页由模板页 [name]/index.md 渲染，合集名在 params.name；总览页没有 params */
const current = computed(() => {
  const name = page.value.params?.name
  return isCollection(props.locale, name) ? name : ''
})

const collections = computed(() =>
  COLLECTIONS[props.locale]
    .map((collection) => {
      const list = posts.filter(
        (post) => post.category === collection.name && inLocale(post.url, props.locale),
      )
      return {
        ...collection,
        count: list.length,
        // 合集内最新一篇文章的日期，用来排序
        date: list.reduce((latest, post) => (post.date > latest ? post.date : latest), ''),
      }
    })
    // 已登记但还没有文章的合集先不显示
    .filter((collection) => collection.count > 0)
    .sort((a, b) => b.date.localeCompare(a.date)),
)

function collectionHref(name: string): string {
  return withBase(`${localeBase(props.locale)}/collections/${name}/`)
}
</script>

<template>
  <!-- 合集详情：结构与博客页一致，标题由模板页的 hero 帮忙换成了合集名 -->
  <template v-if="current">
    <PostList :category="current" :locale="props.locale" />
  </template>

  <!-- 合集总览：每行最多两个，超出一屏在容器内滚动 -->
  <template v-else>
    <p v-if="!collections.length" class="text-(--vp-c-text-3)">
      {{ isEn ? 'No collections yet. Add `category` to a post’s frontmatter and it shows up here.' : '还没有合集，给文章 frontmatter 加上 category，它就会出现在这里。' }}
    </p>
    <!-- 顶部留 16px：和 PostList 的 ul 默认 margin 对齐，各页标题到正文的间距一致 -->
    <!-- 滚动容器会裁掉超出 padding box 的内容，卡片投影左右下各占 ~10px，
         用 -mx-3 + px-3/pb-3 留出空间（负 margin 抵掉横向偏移，保持和正文对齐） -->
    <div v-else class="grid max-h-[70vh] gap-4 overflow-y-auto -mx-3 px-3 pt-4 pb-3 sm:grid-cols-2">
      <a
        v-for="collection in collections"
        :key="collection.name"
        :href="collectionHref(collection.name)"
        class="flex min-h-43 flex-col gap-1 rounded-xl shadow-md border border-(--vp-c-divider) p-4 text-(--vp-c-text-1)! no-underline! transition-colors hover:border-(--vp-c-brand-1)"
      >
        <span class="text-2xl font-medium">{{ collection.name }}</span>
        <span class="text-sm leading-relaxed text-(--vp-c-text-2)">{{ collection.description }}</span>
        <span class="mt-auto flex items-baseline gap-3 text-sm text-(--vp-c-text-2)">
          <span>{{ collection.count }}{{ isEn ? ' posts' : ' 篇文章' }}</span>
          <time v-if="collection.date" :datetime="collection.date" class="ml-auto tabular-nums">{{ collection.date }}</time>
        </span>
      </a>
    </div>
  </template>
</template>
