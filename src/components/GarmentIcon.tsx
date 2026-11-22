import type { IconId } from '../data/capsule'
import { luma } from '../data/color'

const TOP_LONG = 'M36 12Q50 22 64 12L84 22 93 74 81 77 74 42 73 90H27L26 42 19 77 7 74 16 22Z'

type Part = { kind: 'fill' | 'detail' | 'strap'; path: string; width?: number }

// fill = solid shape in the piece colour, detail = thin contrast line, strap = handle stroked in the piece colour
const f = (path: string): Part => ({ kind: 'fill', path })
const d = (path: string): Part => ({ kind: 'detail', path })
const s = (path: string, width = 5): Part => ({ kind: 'strap', path, width })

/** Flat garment silhouettes on a 100×100 canvas, listed back to front. */
function parts(icon: IconId): Part[] {
  switch (icon) {
    case 'tee':
      return [f('M35 12Q50 22 65 12L88 26 80 42 70 37V90H30V37L20 42 12 26Z')]
    case 'teeprint':
      return [f('M35 12Q50 22 65 12L88 26 80 42 70 37V90H30V37L20 42 12 26Z'), d('M43 52A7 7 0 1 0 57 52A7 7 0 1 0 43 52M40 68H60')]
    case 'cami':
      return [f('M36 8H40L42 28Q50 34 58 28L60 8H64L66 30 72 36 70 90H30L28 36 34 30Z')]
    case 'shirt':
      return [
        f('M38 10L50 18 62 10 84 22 92 70 80 73 74 40 72 92H28L26 40 20 73 8 70 16 22Z'),
        d('M38 10L46 24 50 18 54 24 62 10M50 18V92'),
      ]
    case 'turtleneck':
      return [f('M40 4H60V14L84 24 93 74 81 77 74 42 73 90H27L26 42 19 77 7 74 16 24 40 14Z'), d('M40 14H60')]
    case 'sweater':
      return [f(TOP_LONG), d('M27 84H73')]
    case 'cardigan':
      return [
        f('M38 12L50 40 62 12 84 22 93 74 81 77 74 42 73 90H27L26 42 19 77 7 74 16 22Z'),
        d('M50 40V90M55 52h.1M55 64h.1M55 76h.1'),
      ]
    case 'trousers':
      return [f('M30 8H70L74 92H56L50 34 44 92H26Z'), d('M30 16H70')]
    case 'wide':
      return [f('M32 8H68L86 92H56L50 32 44 92H14Z'), d('M31 16H69')]
    case 'pencil':
      return [f('M30 12H70L74 60 68 90H32L26 60Z'), d('M30 19H70')]
    case 'askirt':
      return [f('M36 12H64L86 86Q50 96 14 86Z'), d('M35 19H65')]
    case 'dress':
      return [f('M40 4Q50 14 60 4L65 7 63 24 60 38 82 92Q50 99 18 92L40 38 37 24 35 7Z'), d('M40 38H60')]
    case 'shift':
      return [f('M40 4Q50 12 60 4L74 12 70 24 63 21 71 96H29L37 21 30 24 26 12Z'), d('M35 44H65')]
    case 'blazer':
      return [
        f('M38 8L50 36 62 8 84 20 92 74 80 77 74 42V90H26V42L20 77 8 74 16 20Z'),
        d('M38 8L42 30 50 36 58 30 62 8M50 36V90M55 50h.1'),
      ]
    case 'coat':
      return [
        f('M38 6L50 30 62 6 82 16 90 64 79 67 74 36 78 96H22L26 36 21 67 10 64 18 16Z'),
        d('M38 6L42 24 50 30 58 24 62 6M50 30V96M25 52H75'),
      ]
    case 'jacket':
      return [
        f('M38 12L50 30 62 12 84 22 92 70 80 73 74 42 72 80H28L26 42 20 73 8 70 16 22Z'),
        d('M38 12L42 26 50 30 58 26 62 12M50 30L45 80'),
      ]
    case 'pump':
      return [f('M14 40Q20 38 24 44 40 62 70 64 88 66 92 74V78H50Q36 76 28 66L26 90H20L14 56Z')]
    case 'flat':
      return [f('M10 60Q14 52 22 58 40 68 66 64 88 62 92 72V76H12Q8 70 10 60Z')]
    case 'sneaker':
      return [f('M10 46H28Q34 58 50 60L74 64Q92 66 92 76V82H10Z'), d('M10 74H92M36 58L42 52M44 60L50 54')]
    case 'boot':
      return [f('M22 8H48V54Q70 58 86 68 92 72 92 80V88H22Z'), d('M22 79H92')]
    case 'ankle':
      return [f('M24 32H48V58Q70 62 86 70 92 74 92 82V86H58L52 80H40V86H24Z')]
    case 'bag':
      return [s('M36 42Q36 14 50 14 64 14 64 42'), f('M18 42H82L88 88H12Z'), d('M46 54H54')]
    case 'hobo':
      return [s('M20 48Q50 -4 80 48'), f('M14 48Q50 32 86 48 92 92 50 92 8 92 14 48Z')]
    case 'crossbody':
      return [s('M26 54L46 8H54L74 54', 3), f('M28 52H72Q78 52 78 58V84Q78 90 72 90H28Q22 90 22 84V58Q22 52 28 52Z'), d('M22 66Q50 78 78 66')]
    case 'clutch':
      return [f('M12 36H88V72H12Z'), d('M12 36L50 58 88 36')]
    case 'tote':
      return [s('M34 36V14Q34 8 40 8H60Q66 8 66 14V36'), f('M16 36H84L78 92H22Z')]
    case 'backpack':
      return [s('M42 12Q50 0 58 12', 4), f('M28 30Q28 12 50 12 72 12 72 30V84Q72 92 64 92H36Q28 92 28 84Z'), d('M36 58H64V80H36Z')]
    case 'scarf':
      return [f('M20 22Q50 10 80 22 72 40 60 44L66 90 52 86 50 50 48 86 34 90 40 44Q28 40 20 22Z')]
    case 'belt':
      return [f('M6 42H94V58H6Z'), d('M40 36H60V64H40Z')]
    case 'bracelet':
      return [s('M50 22A28 28 0 1 0 50.1 22', 13)]
    case 'necklace':
      return [s('M20 14Q50 92 80 14', 3), f('M50 46A8 8 0 1 0 50.1 46Z')]
  }
}

export function GarmentIcon({ icon, color }: { icon: IconId; color: string }) {
  // details must stay readable on both navy and cream
  const line = luma(color) < 110 ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.32)'
  const edge = 'rgba(0,0,0,.22)'
  return (
    <svg className="garment" viewBox="0 0 100 100" aria-hidden="true">
      {parts(icon).map(({ kind, path, width = 5 }, i) =>
        kind === 'fill' ? (
          <path key={i} d={path} fill={color} stroke={edge} strokeWidth={1.2} strokeLinejoin="round" />
        ) : kind === 'detail' ? (
          <path key={i} d={path} fill="none" stroke={line} strokeWidth={1.8} strokeLinecap="round" />
        ) : (
          <g key={i} fill="none" strokeLinecap="round">
            <path d={path} stroke={edge} strokeWidth={width + 2.4} />
            <path d={path} stroke={color} strokeWidth={width} />
          </g>
        ),
      )}
    </svg>
  )
}
