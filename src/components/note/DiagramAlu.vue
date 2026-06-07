<script setup lang="ts">
/**
 * ALU（加算装置）の入出力イメージを表す手書き風 SVG 図解。
 * `ADD R3, R1, R2` のような 3 オペランド命令の動きを直感的に説明するため使う。
 */
import { onMounted, ref } from 'vue'
import rough from 'roughjs'
import { INK, MUTED, BASE, txt, arrowDefs, arrow } from './diagramUtils.ts'

const svgEl = ref<SVGSVGElement | null>(null)

const W = 360
const H = 125

onMounted(() => {
  const svg = svgEl.value!
  const rc = rough.svg(svg)

  arrowDefs(svg)

  // R1, R2 boxes (inputs, left)
  svg.appendChild(rc.rectangle(10, 15, 62, 30, { ...BASE, fill: 'none' }))
  svg.appendChild(rc.rectangle(10, 78, 62, 30, { ...BASE, fill: 'none' }))
  txt(svg, 'R1', 41, 35)
  txt(svg, 'R2', 41, 98)

  // ALU box (center) — trapezoid, wider on left (inputs), narrower on right (output)
  svg.appendChild(rc.polygon([
    [138, 8],  [210, 22],
    [210, 102], [138, 116],
  ], { ...BASE, fill: 'none' }))
  txt(svg, 'ALU', 174, 54, { size: 18, weight: '600' })
  txt(svg, 'ADD', 174, 74, { size: 13, color: MUTED })

  // R3 box (output, right)
  svg.appendChild(rc.rectangle(278, 47, 62, 30, { ...BASE, fill: 'none' }))
  txt(svg, 'R3', 309, 67)

  // Arrows: R1 → ALU, R2 → ALU, ALU → R3
  arrow(svg, 72, 30, 137, 42)
  arrow(svg, 72, 93, 137, 82)
  arrow(svg, 211, 62, 278, 62)

  // Labels
  txt(svg, '入力', 104, 12, { size: 11, color: MUTED })
  txt(svg, '出力', 244, 12, { size: 11, color: MUTED })
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
