<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../theme/posts.data.ts'

const props = defineProps<{ prefix: string }>()

const list = computed(() => posts.filter((post) => post.url.startsWith(props.prefix)))
</script>

<template>
  <ul class="list-none! p-0!">
    <li v-for="post in list" :key="post.url" class="flex items-baseline gap-3 py-2">
      <a :href="post.url">{{ post.title }}</a>
      <time
        :datetime="post.date"
        class="ml-auto shrink-0 text-sm tabular-nums text-(--vp-c-text-3)"
      >{{ post.date }}</time>
    </li>
  </ul>
</template>
