<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue"
import { DotGrid } from "interactive-dot-grid"

// 稀疏点阵背景：平时淡淡的，鼠标靠近的点略微变大。
// 库会把 fixed 的 canvas 自己挂到 document.body，所以这个组件不渲染任何东西。
let grid: DotGrid | undefined

onMounted(() => {
  grid = new DotGrid({
    spacing: 40,
    dotMin: 1.5,
    dotMax: 3,
    radiusEffect: 180,
    baseAlpha: 0.2,
    maxAlpha: 0.65,
    color: "140,140,155",
    zIndex: -1,
    smoothing: 0.14,
  })
})

onBeforeUnmount(() => grid?.destroy())
</script>

<template>
  <span style="display: none" />
</template>
