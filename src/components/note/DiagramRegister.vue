<script setup lang="ts">
import { onMounted, ref } from 'vue'
import rough from 'roughjs'

const svgEl = ref<SVGSVGElement | null>(null)

const W = 400
const H = 220
const BOX_X = 56
const BOX_W = 240
const ROW_H = 24
const GAP = 6
const START_Y = 36

const INK = '#2e1f0e'
const BASE = { roughness: 1.5, stroke: INK, strokeWidth: 1.1, bowing: 0.8 }

function txt(
  svg: SVGElement,
  content: string,
  x: number,
  y: number,
  opts: { anchor?: string; size?: number; color?: string; italic?: boolean; weight?: string } = {},
) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  el.textContent = content
  el.setAttribute('x', String(x))
  el.setAttribute('y', String(y))
  el.setAttribute('text-anchor', opts.anchor ?? 'start')
  el.setAttribute('font-family', "'Caveat', cursive")
  el.setAttribute('font-size', String(opts.size ?? 14))
  el.setAttribute('font-weight', opts.weight ?? 'normal')
  el.setAttribute('fill', opts.color ?? INK)
  if (opts.italic) el.setAttribute('font-style', 'italic')
  svg.appendChild(el)
}

onMounted(() => {
  const svg = svgEl.value!
  const rc = rough.svg(svg)

  txt(svg, 'レジスタ', W / 2, 20, { anchor: 'middle', size: 16, weight: '600' })
  svg.appendChild(rc.line(BOX_X, 28, BOX_X + BOX_W, 28, { ...BASE, roughness: 0.8, strokeWidth: 0.8 }))

  const regs = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5']
  regs.forEach((reg, i) => {
    const y = START_Y + i * (ROW_H + GAP)
    const isR0 = i === 0

    svg.appendChild(rc.rectangle(
      BOX_X, y, BOX_W, ROW_H,
      isR0
        ? { ...BASE, fill: 'rgba(100,80,50,0.1)', fillStyle: 'hachure', hachureAngle: -41, hachureGap: 7 }
        : { ...BASE, fill: 'none' },
    ))

    txt(svg, reg, BOX_X - 6, y + 17, { anchor: 'end' })

    if (isR0) {
      txt(svg, '← 常に 0', BOX_X + BOX_W + 10, y + 17, { size: 13, color: '#5a4020', italic: true })
    }
  })
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
