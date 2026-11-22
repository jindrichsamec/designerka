import { useId, type ReactNode } from 'react'
import type { Fill, Look } from '../data/looks'
import type { Crop, Photo } from '../store'
import { placePhoto, VIEWBOX, type Frame } from './geometry'

export function PhotoIn(props: {
  frame: Frame
  photo: Photo | null
  crop: Crop
  k?: number
  clip: ReactNode // the clipping shape, e.g. <ellipse …/>
}) {
  const id = useId()
  const { frame, photo, crop, k, clip } = props
  const cx = frame.x + frame.w / 2
  return (
    <>
      <clipPath id={id}>{clip}</clipPath>
      <g clipPath={`url(#${id})`}>
        {photo ? (
          <image
            href={photo.url}
            preserveAspectRatio="none"
            {...placePhoto(frame, photo.aspect, crop, k)}
          />
        ) : (
          <>
            <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="#f1ebe8" />
            <circle cx={cx} cy={frame.y + frame.h * 0.42} r={frame.h * 0.19} fill="#dccfc9" />
            <ellipse
              cx={cx}
              cy={frame.y + frame.h * 1.04}
              rx={frame.h * 0.4}
              ry={frame.h * 0.32}
              fill="#dccfc9"
            />
          </>
        )}
      </g>
    </>
  )
}

// --- drape: oval face above a coloured half-disc -------------------------------------------

const OVAL = { cx: 350, cy: 262, rx: 178, ry: 231 }
const DRAPE = { cx: 350, top: 361, rx: 296, ry: 276 }
const GAP = 11

const METALS: Record<string, string[]> = {
  gold: ['#a9792a', '#ecc866', '#c4922d', '#f3da86', '#b07e23'],
  silver: ['#8b8b8b', '#e4e4e4', '#a5a5a5', '#f0f0f0', '#888888'],
  copper: ['#8a4f36', '#dba07f', '#ad694a', '#cc8c66', '#7b4833'],
  rosegold: ['#bd7c74', '#f4c3b9', '#d1918a', '#f7d1c9', '#b6756d'],
}

function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180
    return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`
  }
  // angles run clockwise on screen from the left (180°) through the bottom to the right (0°)
  return `M${p(r1, a0)} A${r1} ${r1} 0 0 0 ${p(r1, a1)} L${p(r0, a1)} A${r0} ${r0} 0 0 1 ${p(r0, a0)} Z`
}

function DrapeFill({ fill }: { fill: Fill }) {
  const id = useId()
  const { cx, top, rx, ry } = DRAPE
  const half = `M${cx - rx} ${top} A${rx} ${ry} 0 0 0 ${cx + rx} ${top} Z`

  if (fill.kind === 'wheel') {
    // rings share the band between the outer edge and the face oval
    const band = 156 / fill.rings.length
    return (
      <g stroke="#fff" strokeWidth={3} strokeLinejoin="round">
        {fill.rings.flatMap((ring, r) =>
          ring.map((color, s) => {
            const step = 180 / ring.length
            return (
              <path
                key={`${r}-${s}`}
                d={sector(cx, top, rx - band * (r + 1), rx - band * r, 180 - s * step, 180 - (s + 1) * step)}
                fill={color}
              />
            )
          }),
        )}
      </g>
    )
  }

  return (
    <>
      <defs>
        <pattern
          id={`${id}q`}
          width={92}
          height={92}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${cx} ${top}) rotate(45)`}
        >
          <path d="M0 0H92M0 0V92" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.3} fill="none" />
        </pattern>
        {fill.kind === 'metal' && (
          <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0.6">
            {METALS[fill.metal].map((c, i, all) => (
              <stop key={i} offset={i / (all.length - 1)} stopColor={c} />
            ))}
          </linearGradient>
        )}
      </defs>
      <path d={half} fill={fill.kind === 'solid' ? fill.color : `url(#${id}m)`} />
      <path d={half} fill={`url(#${id}q)`} />
    </>
  )
}

function Drape({ fill, photo, crop }: { fill: Fill; photo: Photo | null; crop: Crop }) {
  const { cx, cy, rx, ry } = OVAL
  return (
    <>
      <DrapeFill fill={fill} />
      <ellipse cx={cx} cy={cy} rx={rx + GAP} ry={ry + GAP} fill="#fff" />
      <PhotoIn
        frame={{ x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2 }}
        photo={photo}
        crop={crop}
        clip={<ellipse cx={cx} cy={cy} rx={rx} ry={ry} />}
      />
    </>
  )
}

// --- grid: face framed by an 8×8 colour chart ----------------------------------------------

const CELL = { w: 65.625, h: 96 }

function Grid({ cells, photo, crop }: { cells: (string | null)[][]; photo: Photo | null; crop: Crop }) {
  const hole = { x: CELL.w * 2, y: CELL.h * 2, w: CELL.w * 4, h: CELL.h * 4 }
  const inset = 9
  const frame = { x: hole.x + inset, y: hole.y + inset, w: hole.w - inset * 2, h: hole.h - inset * 2 }
  return (
    <>
      {cells.flatMap((row, r) =>
        row.map(
          (color, c) =>
            color && (
              <rect
                key={`${r}-${c}`}
                x={c * CELL.w}
                y={r * CELL.h}
                // overlap by a hair so no background seams show between cells
                width={CELL.w + 0.5}
                height={CELL.h + 0.5}
                fill={color}
              />
            ),
        ),
      )}
      <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} fill="#fff" />
      <PhotoIn
        frame={frame}
        photo={photo}
        crop={crop}
        k={1.2}
        clip={<rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} />}
      />
    </>
  )
}

// --- backdrop: round face against an undertone block ---------------------------------------

function Backdrop({ color, title, photo, crop }: { color: string; title: string; photo: Photo | null; crop: Crop }) {
  const c = { cx: 400, cy: 410, r: 368 }
  const words = `${title} pleti`.toUpperCase().split(' ')
  return (
    <>
      <rect x={680} y={150} width={720} height={670} fill={color} />
      <circle cx={c.cx} cy={c.cy} r={c.r + 14} fill="#fff" />
      <PhotoIn
        frame={{ x: c.cx - c.r, y: c.cy - c.r, w: c.r * 2, h: c.r * 2 }}
        photo={photo}
        crop={crop}
        k={1.15}
        clip={<circle cx={c.cx} cy={c.cy} r={c.r} />}
      />
      <text className="figure-display" x={1090} y={400} fontSize={76} fill="#fff" textAnchor="middle">
        {words.map((w, i) => (
          <tspan key={i} x={1090} dy={i === 0 ? 0 : 84}>
            {w}
          </tspan>
        ))}
      </text>
    </>
  )
}

// --- season: face ringed by its ten top colours, full palette alongside --------------------

const BUBBLES: [number, number][] = [
  [206, 132], [130, 262], [104, 400], [130, 538], [206, 668],
  [524, 132], [600, 262], [626, 400], [600, 538], [524, 668],
]

function Season(props: {
  palette: string[]
  tops: { name: string; color: string }[]
  photo: Photo | null
  crop: Crop
}) {
  const frame = { x: 176, y: 136, w: 378, h: 528 }
  const pitch = 67
  const size = 58
  return (
    <>
      <rect x={156} y={116} width={418} height={568} fill="none" stroke="#f7ddd3" strokeWidth={12} />
      <PhotoIn
        frame={frame}
        photo={props.photo}
        crop={props.crop}
        k={1.05}
        clip={<rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} />}
      />
      {props.tops.map((top, i) => (
        <circle key={i} cx={BUBBLES[i][0]} cy={BUBBLES[i][1]} r={64} fill={top.color}>
          <title>{top.name}</title>
        </circle>
      ))}
      {props.palette.map((color, i) => (
        <rect
          key={i}
          x={720 + (i % 7) * pitch}
          y={66 + Math.floor(i / 7) * pitch}
          width={size}
          height={size}
          fill={color}
        />
      ))}
    </>
  )
}

export function LookFigure({ look, photo, crop }: { look: Look; photo: Photo | null; crop: Crop }) {
  const [w, h] = VIEWBOX[look.type]
  return (
    <svg className="figure" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={look.title}>
      {look.type === 'drape' && <Drape fill={look.fill} photo={photo} crop={crop} />}
      {look.type === 'grid' && <Grid cells={look.cells} photo={photo} crop={crop} />}
      {look.type === 'backdrop' && (
        <Backdrop color={look.color} title={look.title} photo={photo} crop={crop} />
      )}
      {look.type === 'season' && (
        <Season palette={look.palette} tops={look.tops} photo={photo} crop={crop} />
      )}
    </svg>
  )
}
