<script setup lang="ts">
/**
 * 「R1 と R2 の値を入れ替える」スワップ手順を 3 ステップで示す手書き風 SVG 図解。
 * テンポラリレジスタが必要であることを学習者に直感的に伝えるためのもの。
 */
import { onMounted, ref } from 'vue'
import rough from 'roughjs'
import { INK, MUTED, BASE, txt } from './diagramUtils.ts'

const svgEl = ref<SVGSVGElement | null>(null)

const W = 370
const H = 158

// 4 states × 3 registers
const STATES = [
  { label: '初期',         r1: '5', r2: '8', r3: '_', changed: '' },
  { label: 'MOV R3, R1', r1: '5', r2: '8', r3: '5', changed: 'r3' },
  { label: 'MOV R1, R2', r1: '8', r2: '8', r3: '5', changed: 'r1' },
  { label: 'MOV R2, R3', r1: '8', r2: '5', r3: '5', changed: 'r2' },
]

const COL_CX = [88, 172, 256, 340]  // center x of each state column
const ROW_Y = [50, 88, 126]          // top y of each register row
const BW = 58
const BH = 26

onMounted(() => {
  const svg = svgEl.value!
  const rc = rough.svg(svg)

  // Register row labels
  ;['R1', 'R2', 'R3'].forEach((reg, ri) => {
    txt(svg, reg, 42, ROW_Y[ri] + 18, { anchor: 'end', size: 14 })
  })

  // State column labels
  STATES.forEach((state, ci) => {
    txt(svg, state.label, COL_CX[ci], ci === 0 ? 26 : 20, {
      size: ci === 0 ? 13 : 11,
      color: ci === 0 ? INK : MUTED,
    })
    if (ci > 0) {
      txt(svg, `(${ci})`, COL_CX[ci], 34, { size: 11, color: MUTED })
    }
  })

  // Value boxes
  const values = [
    (s: typeof STATES[0]) => [s.r1, 'r1'],
    (s: typeof STATES[0]) => [s.r2, 'r2'],
    (s: typeof STATES[0]) => [s.r3, 'r3'],
  ] as const

  STATES.forEach((state, ci) => {
    values.forEach((valFn, ri) => {
      const [val, key] = valFn(state)
      const bx = COL_CX[ci] - BW / 2
      const by = ROW_Y[ri]
      const changed = state.changed === key

      svg.appendChild(rc.rectangle(bx, by, BW, BH, {
        ...BASE,
        fill: changed ? 'rgba(180,140,30,0.18)' : 'none',
        fillStyle: 'solid',
      }))

      txt(svg, val === '_' ? '' : val, COL_CX[ci], by + 18, {
        size: 15,
        color: changed ? '#7a5500' : INK,
        weight: changed ? '600' : 'normal',
      })

      // Underscore for empty R3 in initial state
      if (val === '_') {
        txt(svg, '—', COL_CX[ci], by + 18, { size: 14, color: '#aaa' })
      }
    })
  })

  // Separator between label col and first state col
  const sepX = 50
  const sepY1 = 38
  const sepY2 = 155
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', String(sepX))
  line.setAttribute('y1', String(sepY1))
  line.setAttribute('x2', String(sepX))
  line.setAttribute('y2', String(sepY2))
  line.setAttribute('stroke', 'rgba(100,80,50,0.2)')
  line.setAttribute('stroke-width', '1')
  svg.appendChild(line)
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
