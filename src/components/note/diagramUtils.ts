export const INK = '#2e1f0e'
export const MUTED = '#5a4020'
export const BASE = { roughness: 1.5, stroke: INK, strokeWidth: 1.1, bowing: 0.8 }

const NS = 'http://www.w3.org/2000/svg'

export function el(tag: string) {
  return document.createElementNS(NS, tag)
}

export function txt(
  parent: SVGElement,
  content: string,
  x: number,
  y: number,
  opts: { anchor?: string; size?: number; color?: string; weight?: string; italic?: boolean } = {},
) {
  const node = el('text')
  node.textContent = content
  node.setAttribute('x', String(x))
  node.setAttribute('y', String(y))
  node.setAttribute('text-anchor', opts.anchor ?? 'middle')
  node.setAttribute('font-family', "'Caveat', cursive")
  node.setAttribute('font-size', String(opts.size ?? 14))
  node.setAttribute('font-weight', opts.weight ?? 'normal')
  node.setAttribute('fill', opts.color ?? INK)
  if (opts.italic) node.setAttribute('font-style', 'italic')
  parent.appendChild(node)
}

export function arrowDefs(svg: SVGSVGElement, id = 'arr') {
  const defs = el('defs')
  const marker = el('marker')
  marker.setAttribute('id', id)
  marker.setAttribute('markerWidth', '8')
  marker.setAttribute('markerHeight', '6')
  marker.setAttribute('refX', '7')
  marker.setAttribute('refY', '3')
  marker.setAttribute('orient', 'auto')
  const poly = el('polygon')
  poly.setAttribute('points', '0 0, 8 3, 0 6')
  poly.setAttribute('fill', INK)
  marker.appendChild(poly)
  defs.appendChild(marker)
  svg.appendChild(defs)
}

export function arrow(parent: SVGElement, x1: number, y1: number, x2: number, y2: number, id = 'arr') {
  const line = el('line')
  line.setAttribute('x1', String(x1))
  line.setAttribute('y1', String(y1))
  line.setAttribute('x2', String(x2))
  line.setAttribute('y2', String(y2))
  line.setAttribute('stroke', INK)
  line.setAttribute('stroke-width', '1.2')
  line.setAttribute('marker-end', `url(#${id})`)
  parent.appendChild(line)
}

export function pathArrow(parent: SVGElement, d: string, id = 'arr') {
  const path = el('path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', INK)
  path.setAttribute('stroke-width', '1.2')
  path.setAttribute('fill', 'none')
  path.setAttribute('marker-end', `url(#${id})`)
  parent.appendChild(path)
}
