<script setup lang="ts">
import { onMounted, ref } from 'vue'
import rough from 'roughjs'
import { INK, MUTED, BASE, txt, arrowDefs, arrow, pathArrow } from './diagramUtils.ts'

const svgEl = ref<SVGSVGElement | null>(null)

const W = 260
const H = 228

onMounted(() => {
  const svg = svgEl.value!
  const rc = rough.svg(svg)

  arrowDefs(svg)

  const cx = 130

  // START oval
  svg.appendChild(rc.ellipse(cx, 22, 80, 30, { ...BASE, fill: 'none' }))
  txt(svg, '開始', cx, 27)

  // Arrow: START → body
  arrow(svg, cx, 37, cx, 55)

  // Body rect
  svg.appendChild(rc.rectangle(60, 55, 140, 52, { ...BASE, fill: 'none' }))
  txt(svg, 'sum += i', cx, 76)
  txt(svg, 'i += 1', cx, 96)

  // Arrow: body → diamond
  arrow(svg, cx, 107, cx, 120)

  // Diamond (decision)
  const dy = 148
  svg.appendChild(rc.polygon([
    [cx, 120],       // top
    [cx + 62, dy],   // right
    [cx, dy + 28],   // bottom
    [cx - 62, dy],   // left
  ], { ...BASE, fill: 'none' }))
  txt(svg, 'i = 6?', cx, dy + 5)

  // はい label (bottom path → END)
  txt(svg, 'はい', cx + 8, dy + 42, { anchor: 'start', size: 12, color: MUTED })
  arrow(svg, cx, dy + 28, cx, 205)
  txt(svg, '終了', cx, 218, { size: 14 })

  // いいえ label (left path → loop back)
  txt(svg, 'いいえ', cx - 70, dy - 8, { anchor: 'end', size: 12, color: MUTED })
  pathArrow(svg, `M ${cx - 62} ${dy} L 18 ${dy} L 18 81 L 60 81`)
})
</script>

<template>
  <svg ref="svgEl" :width="W" :height="H" class="diagram" />
</template>

<style scoped>
.diagram {
  display: block;
  margin-top: 20px;
  max-width: 100%;
}
</style>
