<script setup lang="ts">
import { onMounted, ref } from 'vue'
import rough from 'roughjs'

const svgEl = ref<SVGSVGElement | null>(null)

const W = 400
const H = 120
const INK = '#2e1f0e'
const BASE = { roughness: 1.5, stroke: INK, strokeWidth: 1.1, bowing: 0.8 }

const FLAGS = [
  { name: 'N', desc: '負' },
  { name: 'Z', desc: 'ゼロ' },
  { name: 'C', desc: '桁上がり' },
  { name: 'V', desc: '溢れ' },
]

const BOX_W = 68
const BOX_H = 52
const GAP = 14
const START_X = (W - (FLAGS.length * BOX_W + (FLAGS.length - 1) * GAP)) / 2
const BOX_Y = 28

function txt(
  svg: SVGElement,
  content: string,
  x: number,
  y: number,
  opts: { anchor?: string; size?: number; color?: string } = {},
) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  el.textContent = content
  el.setAttribute('x', String(x))
  el.setAttribute('y', String(y))
  el.setAttribute('text-anchor', opts.anchor ?? 'start')
  el.setAttribute('font-family', "'Caveat', cursive")
  el.setAttribute('font-size', String(opts.size ?? 14))
  el.setAttribute('fill', opts.color ?? INK)
  svg.appendChild(el)
}

onMounted(() => {
  const svg = svgEl.value!
  const rc = rough.svg(svg)

  txt(svg, 'フラグ', W / 2, 20, { anchor: 'middle', size: 16, color: INK })

  FLAGS.forEach((flag, i) => {
    const x = START_X + i * (BOX_W + GAP)
    svg.appendChild(rc.rectangle(x, BOX_Y, BOX_W, BOX_H, { ...BASE, fill: 'none' }))
    txt(svg, flag.name, x + BOX_W / 2, BOX_Y + 34, { anchor: 'middle', size: 24 })
    txt(svg, flag.desc, x + BOX_W / 2, BOX_Y + BOX_H + 16, { anchor: 'middle', size: 13, color: '#5a4020' })
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
