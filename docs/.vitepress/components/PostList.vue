<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '@/theme/posts.data'
import { inLocale, type Locale } from '@/theme/locale'

const props = defineProps<{
  /** 按 URL 前缀取文章，如 /blog/ */
  prefix?: string
  /** 按合集取文章，取值为文章 frontmatter 里的 category */
  category?: string
  /** 合集页要区分中英文站，普通索引页不用传 */
  locale?: Locale
}>()

const list = computed(() =>
  posts.filter((post) =>
    props.category
      ? post.category === props.category && inLocale(post.url, props.locale ?? 'zh')
      : post.url.startsWith(props.prefix ?? ''),
  ),
)
</script>

<template>
  <ul class="list-none! p-0!">
    <li v-for="post in list" :key="post.url" class="flex items-baseline gap-2 py-2">
      <a :href="withBase(post.url)" class="text-xl text-(--vp-c-text-2)! hover:text-(--vp-c-text-1)!">{{ post.title }}</a>
      <time
        :datetime="post.date"
        class="ml-auto shrink-0 text-sm tabular-nums text-(--vp-c-text-3)"
      >{{ post.date }}</time>
    </li>
  </ul>
</template>
