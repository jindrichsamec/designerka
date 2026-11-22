import type { ShapeId } from '../data/body'
import type { IconId, Piece } from '../data/capsule'
import { luma } from '../data/color'
import { wearOf } from '../data/outfit'
import type { Crop, Photo } from '../store'
import { PhotoIn } from './LookFigure'

/**
 * A front-view figure drawn from three half-widths (shoulders, waist, hips), dressed in flat
 * garment shapes that follow the same measurements. Everything is laid out on a 200×510 canvas,
 * symmetric around x = 100; points are written as [offset from centre, y].
 */
type P = [number, number]

const CX = 100
const HEAD = { cy: 46, rx: 26, ry: 34 }

const DIMS: Record<ShapeId, { S: number; W: number; H: number }> = {
  x: { S: 38, W: 22, H: 38 },
  a: { S: 31, W: 23, H: 42 },
  o: { S: 34, W: 36, H: 36 },
  h: { S: 35, W: 29, H: 34 },
  v: { S: 42, W: 27, H: 30 },
}

const pt = ([dx, y]: P, k = 1) => `${CX + k * dx} ${y}`

/** Smooth curve through the points (Catmull-Rom), continuing from pts[0]. k = -1 mirrors it. */
function curve(pts: P[], k = 1) {
  let d = ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${pt(c1, k)} ${pt(c2, k)} ${pt(p2, k)}`
  }
  return d
}

const lerp = (table: P[], y: number) => {
  if (y <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    const [y1, v1] = table[i]
    if (y <= y1) {
      const [y0, v0] = table[i - 1]
      return v0 + ((v1 - v0) * (y - y0)) / (y1 - y0)
    }
  }
  return table[table.length - 1][1]
}

type Part = { d: string; kind: 'fill' | 'skin' | 'detail' | 'strap'; color?: string; width?: number }

function build(shape: ShapeId | null, pieces: Piece[]): Part[] {
  const { S, W, H } = DIMS[shape ?? 'h']
  const widest = Math.max(S, W, H)
  const knee = { out: 14 + H * 0.3, in: 4 }
  const ankle = { out: 17, in: 6 }
  const wrist = widest + 9
  const elbow = (S - 3 + wrist) / 2 + 1

  /** Body half-width at height y (shoulders 104 → hips 262). */
  const half = (y: number) => lerp([[104, S], [128, S - 3], [190, W], [240, H], [262, H]], y)
  /** Half-width of a garment that skims (k = 0) or hangs straight from the widest point (k = 1). */
  const hang = (y: number, ease: number, k: number) => half(y) + ease + k * (widest - half(y))
  const armX = (y: number) => lerp([[108, S - 3], [185, elbow], [258, wrist]], y)
  const armW = (y: number) => lerp([[108, 8], [185, 6.5], [258, 5]], y)
  const legOut = (y: number) => lerp([[370, knee.out], [466, ankle.out]], y)
  const legIn = (y: number) => lerp([[370, knee.in], [466, ankle.in]], y)

  const parts: Part[] = []
  const skin = (d: string) => parts.push({ d, kind: 'skin' })

  /** Closed shape from the right-hand edge (top → bottom), mirrored; `top` draws the neckline. */
  const shell = (side: P[], top = '', dip = 0) => {
    const body = side.slice(1)
    const last = body[body.length - 1]
    const hem = dip ? `Q${CX} ${last[1] + dip} ${pt(last, -1)}` : `L${pt(last, -1)}`
    return `M${pt(side[0])}L${pt(side[1])}${curve(body)}${hem}${curve([...body].reverse(), -1)}L${pt(side[0], -1)}${top}Z`
  }
  const crew = (y: number, n: number, depth: number) => `Q${CX} ${y + depth} ${CX + n} ${y}`
  const vee = (y: number, n: number, depth: number) => `L${CX} ${y + depth}L${CX + n} ${y}`

  /** Sleeve (ease > 0) or bare arm (ease = 0) down to y1, on side k. */
  const arm = (k: number, y1: number, ease: number) => {
    const ys = [140, 185, 225].filter((y) => y < y1 - 8)
    const outer: P[] = [[half(104) + ease, 104], ...ys.map((y): P => [armX(y) + armW(y) + ease, y]), [armX(y1) + armW(y1) + ease, y1]]
    const inner: P[] = [[armX(y1) - armW(y1) - ease, y1], ...ys.reverse().map((y): P => [armX(y) - armW(y) - ease, y]), [S - 6, 124]]
    return `M${pt(outer[0], k)}${curve(outer, k)}L${pt(inner[0], k)}${curve(inner, k)}Z`
  }

  const leg = (k: number) =>
    `M${pt([H, 250], k)}${curve([[H, 250], [knee.out, 370], [ankle.out, 466]], k)}L${pt([ankle.in, 466], k)}` +
    `${curve([[ankle.in, 466], [knee.in, 370], [1, 270]], k)}Z`

  // --- body ---------------------------------------------------------------------------------
  skin(`M${CX - 8} 72H${CX + 8}V100H${CX - 8}Z`)
  skin(shell([[8, 96], [S, 104], [S - 3, 128], [W, 190], [H, 240], [H, 262]], '', 12))
  skin(leg(1))
  skin(leg(-1))

  const worn = (wear: ReturnType<typeof wearOf>) => pieces.filter((p) => wearOf(p) === wear)
  const one = (wear: ReturnType<typeof wearOf>) => worn(wear)[0]
  const draw = (piece: Piece, d: string, kind: Part['kind'] = 'fill', width?: number) =>
    parts.push({ d, kind, color: piece.color, width })

  const torso = (ease: number, k: number, hem: number, neckX = 10): P[] => [
    [neckX, 97],
    ...[104, 128, 160, 190, 215, 240].filter((y) => y < hem - 6).map((y): P => [hang(y, ease, k), y]),
    [hang(hem, ease, k), hem],
  ]

  // --- shoes (under trouser hems) -----------------------------------------------------------
  const shoes = one('shoes')
  if (shoes) {
    for (const k of [1, -1]) {
      const q = (dx: number, y: number) => pt([dx, y], k)
      const icon = shoes.garment.icon
      if (icon === 'pump') draw(shoes, `M${q(5, 465)}L${q(18, 465)}L${q(19.5, 475)}Q${q(17, 488)} ${q(11.5, 495)}Q${q(6, 488)} ${q(3.5, 475)}Z`)
      else if (icon === 'flat') draw(shoes, `M${q(5, 465)}L${q(18, 465)}Q${q(21, 482)} ${q(15, 490)}Q${q(11.5, 493)} ${q(8, 490)}Q${q(2, 482)} ${q(5, 465)}Z`)
      else if (icon === 'sneaker') {
        draw(shoes, `M${q(3, 463)}L${q(20, 463)}L${q(21, 485)}Q${q(11.5, 500)} ${q(2, 485)}Z`)
        draw(shoes, `M${q(4, 484)}Q${q(11.5, 476)} ${q(19, 484)}M${q(8, 468)}H${CX + k * 15}M${q(8, 473)}H${CX + k * 15}`, 'detail')
      } else {
        const top = icon === 'boot' ? 388 : 438
        draw(shoes, `M${q(legIn(top) - 1.5, top)}L${q(legOut(top) + 1.5, top)}L${q(ankle.out + 2, 466)}L${q(19.5, 478)}Q${q(11.5, 500)} ${q(3.5, 478)}L${q(ankle.in - 2, 466)}Z`)
      }
    }
  }

  // --- top, tucked in unless it is a sweater -------------------------------------------------
  const top = one('top')
  const overTop = top?.garment.icon === 'sweater'
  const drawTop = () => {
    if (!top) return
    const icon = top.garment.icon
    if (icon === 'cami') {
      const side: P[] = [[13, 98], [S - 5, 128], [half(190) + 2, 190], [half(240) + 2, 240], [half(252) + 2, 252]]
      draw(top, shell(side, `L${CX - 8} 98Q${CX} 134 ${CX + 8} 98`))
      return
    }
    if (icon === 'sweater') {
      draw(top, shell(torso(4, 0.5, 250), crew(97, 10, 11)))
      draw(top, `M${pt([hang(244, 4, 0.5), 244], -1)}H${CX + hang(244, 4, 0.5)}`, 'detail')
      return
    }
    const side = torso(2, 0, 252)
    draw(top, shell(side, icon === 'shirt' ? vee(97, 10, 20) : icon === 'turtleneck' ? '' : crew(97, 10, 12)))
    if (icon === 'teeprint') draw(top, `M${CX - 9} 152a9 9 0 1 0 18 0a9 9 0 1 0 -18 0`, 'detail')
    if (icon === 'shirt') draw(top, `M${CX - 10} 97L${CX - 6} 112L${CX} 117L${CX + 6} 112L${CX + 10} 97M${CX} 117V252`, 'detail')
    if (icon === 'turtleneck') draw(top, `M${CX - 9.5} 79H${CX + 9.5}V99H${CX - 9.5}Z`)
  }
  if (!overTop) drawTop()

  // --- bottoms ------------------------------------------------------------------------------
  const bottom = one('bottom')
  if (bottom) {
    const icon = bottom.garment.icon
    const waist: P = [W + 1.5, 186]
    const closed = (side: P[], dip: number) => {
      const last = side[side.length - 1]
      const hem = dip ? `Q${CX} ${last[1] + dip} ${pt(last, -1)}` : `L${pt(last, -1)}`
      return `M${pt(waist, -1)}L${pt(waist)}${curve(side)}${hem}${curve([...side].reverse(), -1)}Z`
    }
    if (icon === 'pencil') draw(bottom, closed([waist, [H + 2, 240], [H + 1.5, 290], [knee.out + 5, 374]], 0))
    else if (icon === 'askirt') draw(bottom, closed([waist, [H + 7, 240], [H + 24, 392]], 8))
    else {
      const wide = icon === 'wide'
      const outer: P[] = wide
        ? [waist, [H + 3, 240], [H + 4, 270], [knee.out + 12, 370], [ankle.out + 20, 470]]
        : [waist, [H + 2, 240], [H + 1.5, 265], [knee.out + 2, 370], [ankle.out + 2, 467]]
      const inner: P[] = wide ? [[ankle.in - 6, 470], [knee.in - 3, 370], [0, 280]] : [[ankle.in - 2, 467], [knee.in - 2, 370], [0, 278]]
      draw(
        bottom,
        `M${pt(waist, -1)}L${pt(waist)}${curve(outer)}L${pt(inner[0])}${curve(inner)}` +
          `${curve([...inner].reverse(), -1)}L${pt(outer[outer.length - 1], -1)}${curve([...outer].reverse(), -1)}Z`,
      )
    }
    draw(bottom, `M${pt([W + 1.5, 193], -1)}H${CX + W + 1.5}`, 'detail')
  }

  if (overTop) drawTop()

  // --- dress --------------------------------------------------------------------------------
  const dress = one('dress')
  if (dress) {
    if (dress.garment.icon === 'dress') {
      const side: P[] = [[12, 97], [S - 2, 105], [S - 3, 128], [W + 1.5, 190], [H + 9, 250], [H + 28, 404]]
      draw(dress, shell(side, vee(97, 12, 30), 8))
      draw(dress, `M${pt([W + 1.5, 190], -1)}H${CX + W + 1.5}`, 'detail')
    } else {
      const side: P[] = [[10, 97], ...[104, 128, 190, 240, 300].map((y): P => [hang(Math.min(y, 262), 3, 0.7), y]), [hang(262, 3, 0.7), 376]]
      draw(dress, shell(side, crew(97, 10, 12)))
    }
  }

  // --- waist and neck details ---------------------------------------------------------------
  for (const extra of worn('accessory')) {
    if (extra.garment.icon === 'belt') {
      const w = (overTop ? hang(190, 4, 0.5) : dress?.garment.icon === 'shift' ? hang(190, 3, 0.7) : half(190) + 2) + 0.5
      draw(extra, `M${CX - w} 186H${CX + w}V194H${CX - w}Z`)
      draw(extra, `M${CX - 5} 184H${CX + 5}V196H${CX - 5}Z`, 'detail')
    }
    if (extra.garment.icon === 'necklace') {
      draw(extra, `M${CX - 9} 93Q${CX} 126 ${CX + 9} 93`, 'strap', 1.6)
      draw(extra, `M${CX - 3.5} 109.5a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0`)
    }
  }

  // --- arms and sleeves ---------------------------------------------------------------------
  const sleeveTo: Partial<Record<IconId, number>> = { tee: 142, teeprint: 142, shift: 142, shirt: 258, turtleneck: 258, sweater: 258 }
  const sleeved = dress ?? top
  for (const k of [1, -1]) {
    skin(arm(k, 258, 0))
    skin(`M${pt([wrist - 5, 258], k)}Q${pt([wrist - 6, 280], k)} ${pt([wrist, 281], k)}Q${pt([wrist + 6, 280], k)} ${pt([wrist + 5, 258], k)}Z`)
    const to = sleeved && sleeveTo[sleeved.garment.icon]
    if (sleeved && to) draw(sleeved, arm(k, to, sleeved.garment.icon === 'sweater' ? 3 : 2))
  }

  // --- layer, worn open ---------------------------------------------------------------------
  const layer = one('layer')
  if (layer) {
    const icon = layer.garment.icon
    const spec = {
      blazer: { hem: 268, k: 0.3, gap: [5, 7] },
      jacket: { hem: 208, k: 0.3, gap: [6, 8] },
      cardigan: { hem: 264, k: 0.5, gap: [5, 6] },
      coat: { hem: 402, k: 0.8, gap: [5, 9] },
    }[icon as 'blazer' | 'jacket' | 'cardigan' | 'coat']
    const side: P[] = [
      ...[104, 128, 160, 190, 215, 240].filter((y) => y < spec.hem - 6).map((y): P => [hang(y, 4.5, spec.k), y]),
      ...(icon === 'coat' ? ([[widest + 9, 262], [widest + 11, 330], [widest + 13, 402]] as P[]) : ([[hang(spec.hem, 4.5, spec.k), spec.hem]] as P[])),
    ]
    for (const k of [1, -1]) {
      draw(layer, `M${pt([10, 96], k)}L${pt(side[0], k)}${curve(side, k)}L${pt([spec.gap[1], spec.hem], k)}L${pt([spec.gap[0], 150], k)}Z`)
      if (icon !== 'cardigan') draw(layer, `M${pt([10, 96], k)}L${pt([spec.gap[0] + 11, 130], k)}L${pt([spec.gap[0], 150], k)}`, 'detail')
      draw(layer, arm(k, 260, 4))
    }
  }

  // --- scarf, bag, bracelet -----------------------------------------------------------------
  for (const extra of worn('accessory')) {
    if (extra.garment.icon === 'scarf') {
      draw(extra, `M${CX - 9} 100L${CX} 105L${CX - 3} 160L${CX - 15} 156Z`)
      draw(extra, `M${CX - 13} 84Q${CX} 104 ${CX + 13} 84L${CX + 14} 96Q${CX} 118 ${CX - 14} 96Z`)
    }
    if (extra.garment.icon === 'bracelet') {
      const w = armW(250) + (layer || (sleeved && (sleeveTo[sleeved.garment.icon] ?? 0) > 200) ? 5 : 2)
      draw(extra, `M${pt([armX(250) - w, 246], -1)}L${pt([armX(250) + w, 246], -1)}L${pt([armX(250) + w, 253], -1)}L${pt([armX(250) - w, 253], -1)}Z`)
    }
  }

  const bag = one('bag')
  if (bag) {
    const icon = bag.garment.icon
    const x = CX + wrist
    if (icon === 'bag' || icon === 'tote') {
      const [w, y0, y1] = icon === 'bag' ? [16, 296, 330] : [20, 304, 356]
      draw(bag, `M${x - w * 0.55} ${y0}Q${x} ${icon === 'bag' ? 252 : 244} ${x + w * 0.55} ${y0}`, 'strap', 2.6)
      draw(bag, `M${x - w} ${y0}H${x + w}L${x + w + 3} ${y1}H${x - w - 3}Z`)
    } else if (icon === 'clutch') {
      draw(bag, `M${x - 15} 262H${x + 15}V282H${x - 15}Z`)
      draw(bag, `M${x - 15} 262L${x} 273L${x + 15} 262`, 'detail')
    } else if (icon === 'hobo') {
      draw(bag, `M${CX + S - 6} 102L${x + 3} 212`, 'strap', 3)
      draw(bag, `M${x - 12} 210Q${x + 4} 202 ${x + 19} 212Q${x + 24} 262 ${x + 4} 262Q${x - 16} 262 ${x - 12} 210Z`)
    } else if (icon === 'crossbody') {
      draw(bag, `M${CX - S + 8} 102L${CX + H + 2} 236`, 'strap', 2.4)
      draw(bag, `M${CX + H - 10} 232H${CX + H + 14}V254H${CX + H - 10}Z`)
      draw(bag, `M${CX + H - 10} 240H${CX + H + 14}`, 'detail')
    } else {
      // backpack: only the shoulder straps show from the front
      for (const k of [1, -1]) draw(bag, `M${pt([S - 11, 100], k)}Q${pt([S - 3, 126], k)} ${pt([S - 7, 156], k)}`, 'strap', 5)
    }
  }

  return parts
}

export function Mannequin(props: { shape: ShapeId | null; pieces: Piece[]; photo: Photo | null; crop: Crop }) {
  const { cy, rx, ry } = HEAD
  const edge = 'rgba(0,0,0,.24)'
  return (
    <svg className="mannequin" viewBox="0 0 200 510" role="img" aria-label="Postava v outfitu">
      {build(props.shape, props.pieces).map(({ d, kind, color = '#e9dfd9', width = 3 }, i) =>
        kind === 'skin' ? (
          <path key={i} d={d} fill="#e9dfd9" stroke="#d2c2b9" strokeWidth={0.8} strokeLinejoin="round" />
        ) : kind === 'fill' ? (
          <path key={i} d={d} fill={color} stroke={edge} strokeWidth={0.8} strokeLinejoin="round" />
        ) : kind === 'detail' ? (
          <path
            key={i}
            d={d}
            fill="none"
            // details must stay readable on both navy and cream
            stroke={luma(color) < 110 ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.3)'}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={d} stroke={edge} strokeWidth={width + 1.4} />
            <path d={d} stroke={color} strokeWidth={width} />
          </g>
        ),
      )}
      <ellipse cx={CX} cy={cy} rx={rx + 1.5} ry={ry + 1.5} fill="#fff" />
      <PhotoIn
        frame={{ x: CX - rx, y: cy - ry, w: rx * 2, h: ry * 2 }}
        photo={props.photo}
        crop={props.crop}
        clip={<ellipse cx={CX} cy={cy} rx={rx} ry={ry} />}
      />
    </svg>
  )
}
