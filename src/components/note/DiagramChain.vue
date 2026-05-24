<script setup lang="ts">
import { onMounted, ref } from 'vue'
import rough from 'roughjs'
import { INK, MUTED, BASE, txt, arrowDefs, arrow } from './diagramUtils.ts'

const svgEl = ref<SVGSVGElement | null>(null)

const W = 300
const H = 108

// Box dims
const BW = 48
const BH = 28

onMounted(() => {
  const svg = svgEl.value!
  const rc = rough.svg(svg)

  arrowDefs(svg)

  // Row 1: R1 + R2 → R4
  const r1 = [10, 16] as const
  const r2 = [78, 16] as const
  const r4a = [148, 16] as const

  svg.appendChild(rc.rectangle(r1[0], r1[1], BW, BH, { ...BASE, fill: 'none' }))
  svg.appendChild(rc.rectangle(r2[0], r2[1], BW, BH, { ...BASE, fill: 'none' }))
  svg.appendChild(rc.rectangle(r4a[0], r4a[1], BW, BH, { ...BASE, fill: 'none' }))
  txt(svg, 'R1', r1[0] + BW / 2, r1[1] + 19)
  txt(svg, 'R2', r2[0] + BW / 2, r2[1] + 19)
  txt(svg, 'R4', r4a[0] + BW / 2, r4a[1] + 19)
  txt(svg, '+', 71, 34, { size: 16 })
  arrow(svg, r2[0] + BW, 30, r4a[0], 30)
  txt(svg, '① R1 + R2 → R4', 210, 34, { anchor: 'start', size: 12, color: MUTED })

  // Row 2: R4 + R3 → R4
  const r4b = [10, 62] as const
  const r3 = [78, 62] as const
  const r4c = [148, 62] as const

  svg.appendChild(rc.rectangle(r4b[0], r4b[1], BW, BH, { ...BASE, fill: 'none' }))
  svg.appendChild(rc.rectangle(r3[0], r3[1], BW, BH, { ...BASE, fill: 'none' }))
  svg.appendChild(rc.rectangle(r4c[0], r4c[1], BW, BH, { ...BASE, fill: 'none' }))
  txt(svg, 'R4', r4b[0] + BW / 2, r4b[1] + 19)
  txt(svg, 'R3', r3[0] + BW / 2, r3[1] + 19)
  txt(svg, 'R4', r4c[0] + BW / 2, r4c[1] + 19)
  txt(svg, '+', 71, 80, { size: 16 })
  arrow(svg, r3[0] + BW, 76, r4c[0], 76)
  txt(svg, '② R4 + R3 → R4', 210, 80, { anchor: 'start', size: 12, color: MUTED })

  // Connect: R4 output of row1 → R4 input of row2 (small downward link)
  arrow(svg, r4a[0] + BW / 2, r4a[1] + BH, r4b[0] + BW / 2, r4b[1])
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
