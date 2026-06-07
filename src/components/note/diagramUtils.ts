/**
 * Diagram*.vue で共用する SVG 描画ヘルパー。
 *
 * 「ノートに手書きしたような図」を出すための共通スタイル定数と、
 * SVG ノード生成・テキスト配置・矢印描画の薄いラッパーを提供する。
 *
 * 線の不揃いさは `roughness` / `bowing` で個別 Diagram 側が roughjs に渡す想定。
 */
export const INK = '#2e1f0e'
export const MUTED = '#5a4020'
/** roughjs に渡す共通スタイル。手書き風の濃さと揺らぎを統一する。 */
export const BASE = { roughness: 1.5, stroke: INK, strokeWidth: 1.1, bowing: 0.8 }

const NS = 'http://www.w3.org/2000/svg'

/** 名前空間付きで SVG 要素を生成するショートカット。 */
export function el(tag: string) {
  return document.createElementNS(NS, tag)
}

/**
 * SVG にテキストノードを追加する。
 * 既定で Caveat（手書きフォント）・センター揃え・本文インクカラー。
 */
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

/**
 * 矢印先端の `marker` 定義を SVG の <defs> に登録する。
 * `arrow()` / `pathArrow()` を使う前に 1 度呼ぶ。
 */
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

/** (x1,y1) → (x2,y2) の直線に矢印先端を付けて描く。 */
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

/** SVG path 文字列を矢印付きで描く。曲線などに使う。 */
export function pathArrow(parent: SVGElement, d: string, id = 'arr') {
  const path = el('path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', INK)
  path.setAttribute('stroke-width', '1.2')
  path.setAttribute('fill', 'none')
  path.setAttribute('marker-end', `url(#${id})`)
  parent.appendChild(path)
}
