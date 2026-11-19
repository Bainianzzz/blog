<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as posts } from '@/theme/posts.data'

const props = defineProps<{ prefix: string }>()

const list = computed(() => posts.filter((post) => post.url.startsWith(props.prefix)))
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
