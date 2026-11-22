import { shapeById, type CutKey, type ShapeId } from './body'
import { luma } from './color'
import type { Preference, StyleId } from './style'

export type IconId =
  | 'tee' | 'teeprint' | 'cami' | 'shirt' | 'turtleneck' | 'sweater' | 'cardigan'
  | 'trousers' | 'wide' | 'pencil' | 'askirt'
  | 'dress' | 'shift'
  | 'blazer' | 'coat' | 'jacket'
  | 'pump' | 'flat' | 'sneaker' | 'boot' | 'ankle'
  | 'bag' | 'hobo' | 'crossbody' | 'clutch' | 'tote' | 'backpack'
  | 'scarf' | 'belt' | 'bracelet' | 'necklace'

export type Garment = {
  id: string
  name: string
  icon: IconId
  styles: StyleId[]
  cut?: CutKey
  /** Style element this garment stands for: "nenosím" removes it, "chci" pulls it in. */
  element?: string
  /** Niche pieces that only appear when their element is explicitly wanted. */
  optIn?: boolean
}

const g = (
  id: string,
  name: string,
  icon: IconId,
  styles: StyleId[],
  extra: Partial<Garment> = {},
): Garment => ({ id, name, icon, styles, ...extra })

const GARMENTS: Garment[] = [
  // tops
  g('tricko-basic', 'Tričko bez loga', 'tee', ['minimal', 'prirozeny', 'klasicky'], { cut: 'top', element: 'tricko-bez-loga' }),
  g('tricko-obrazek', 'Tričko s obrázkem', 'teeprint', ['kreativni', 'prirozeny'], { cut: 'top', element: 'tricko-obrazek' }),
  g('tricko-logo', 'Tričko s velkým logem', 'teeprint', ['dramaticky'], { cut: 'top', element: 'velka-loga', optIn: true }),
  g('top-saten', 'Saténový top', 'cami', ['elegantni', 'romanticky'], { cut: 'top' }),
  g('top-krajka', 'Krajkový top', 'cami', ['romanticky'], { cut: 'top', element: 'krajka', optIn: true }),
  g('top-flitry', 'Flitrový top', 'cami', ['dramaticky'], { cut: 'top', element: 'flitry', optIn: true }),
  g('kosile', 'Košile', 'shirt', ['klasicky', 'minimal', 'elegantni'], { cut: 'top' }),
  g('halenka', 'Halenka', 'shirt', ['romanticky', 'elegantni'], { cut: 'top' }),
  g('halenka-vzor', 'Vzorovaná halenka', 'shirt', ['romanticky', 'kreativni'], { cut: 'top', element: 'vzory', optIn: true }),
  g('rolak', 'Rolák', 'turtleneck', ['minimal', 'klasicky', 'elegantni', 'dramaticky'], { cut: 'knit', element: 'rolak' }),
  g('svetr', 'Jemný svetr', 'sweater', ['klasicky', 'prirozeny', 'romanticky'], { cut: 'knit' }),
  g('svetr-oversize', 'Oversize svetr', 'sweater', ['prirozeny', 'kreativni'], { cut: 'knit', element: 'oversize-svetr' }),
  g('kardigan', 'Kardigan', 'cardigan', ['prirozeny', 'romanticky', 'klasicky'], { cut: 'knit' }),
  // bottoms
  g('kalhoty-rovne', 'Rovné kalhoty', 'trousers', ['klasicky', 'minimal', 'elegantni'], { cut: 'trousers' }),
  g('kalhoty-cigaretky', 'Cigaretové kalhoty', 'trousers', ['klasicky', 'elegantni'], { cut: 'trousers' }),
  g('kalhoty-siroke', 'Široké kalhoty', 'wide', ['dramaticky', 'kreativni', 'elegantni'], { cut: 'trousers', element: 'siroke-kalhoty' }),
  g('dziny', 'Džíny', 'trousers', ['prirozeny', 'kreativni', 'minimal'], { cut: 'trousers', element: 'dziny' }),
  g('sukne-pouzdrova', 'Pouzdrová sukně', 'pencil', ['klasicky', 'elegantni', 'dramaticky'], { cut: 'skirt', element: 'pouzdrova-sukne' }),
  g('sukne-ackova', 'Áčková sukně', 'askirt', ['romanticky', 'prirozeny', 'kreativni'], { cut: 'skirt', element: 'ackova-sukne' }),
  g('sukne-plisovana', 'Plisovaná sukně', 'askirt', ['romanticky', 'elegantni'], { cut: 'skirt' }),
  // dresses
  g('saty-kosilove', 'Košilové šaty', 'shift', ['klasicky', 'prirozeny', 'minimal'], { cut: 'dress', element: 'kosilove-saty' }),
  g('saty-pouzdrove', 'Pouzdrové šaty', 'shift', ['klasicky', 'elegantni', 'dramaticky'], { cut: 'dress' }),
  g('saty-zavinovaci', 'Zavinovací šaty', 'dress', ['romanticky', 'elegantni'], { cut: 'dress' }),
  g('saty-upletove', 'Úpletové šaty', 'shift', ['minimal', 'prirozeny'], { cut: 'dress' }),
  g('saty-maxi', 'Maxi šaty', 'dress', ['kreativni', 'romanticky'], { cut: 'dress' }),
  // layers
  g('sako', 'Sako', 'blazer', ['klasicky', 'elegantni', 'minimal', 'dramaticky'], { cut: 'jacket', element: 'sako' }),
  g('bunda-kozena', 'Kožená bunda', 'jacket', ['dramaticky', 'kreativni'], { cut: 'jacket', element: 'kozena-bunda' }),
  g('bunda-dzinova', 'Džínová bunda', 'jacket', ['prirozeny', 'kreativni'], { cut: 'jacket' }),
  g('trenckot', 'Trenčkot', 'coat', ['klasicky', 'elegantni', 'minimal'], { cut: 'coat', element: 'trenckot' }),
  g('kabat', 'Vlněný kabát', 'coat', ['klasicky', 'elegantni', 'minimal', 'dramaticky'], { cut: 'coat' }),
  // shoes
  g('lodicky', 'Lodičky', 'pump', ['klasicky', 'elegantni', 'dramaticky'], { element: 'lodicky' }),
  g('baleriny', 'Baleríny', 'flat', ['romanticky', 'klasicky'], { element: 'baleriny' }),
  g('tenisky', 'Tenisky', 'sneaker', ['prirozeny', 'minimal', 'kreativni'], { element: 'tenisky' }),
  g('masivni-boty', 'Masivní boty', 'boot', ['dramaticky', 'kreativni'], { element: 'masivni-boty' }),
  g('kotnikove', 'Kotníkové boty', 'ankle', ['klasicky', 'elegantni', 'minimal'], { element: 'kotnikove' }),
  g('mokasiny', 'Mokasíny', 'flat', ['klasicky', 'minimal', 'prirozeny'], { element: 'mokasiny' }),
  g('kozacky', 'Kozačky', 'boot', ['elegantni', 'dramaticky', 'romanticky'], { element: 'kozacky' }),
  g('sandaly', 'Sandály na podpatku', 'pump', ['romanticky', 'elegantni'], { element: 'sandaly' }),
  // bags
  g('crossbody', 'Crossbody kabelka', 'crossbody', ['prirozeny', 'minimal', 'kreativni'], { element: 'crossbody' }),
  g('do-ruky', 'Kabelka do ruky', 'bag', ['klasicky', 'elegantni'], { element: 'do-ruky' }),
  g('tvarovana', 'Kabelka, co drží tvar', 'bag', ['klasicky', 'dramaticky', 'minimal'], { element: 'tvarovana' }),
  g('mekka', 'Měkká kabelka', 'hobo', ['prirozeny', 'romanticky', 'kreativni'], { element: 'mekka' }),
  g('shopper', 'Velká taška', 'tote', ['prirozeny', 'minimal'], { element: 'shopper' }),
  g('psanicko', 'Psaníčko', 'clutch', ['elegantni', 'romanticky', 'dramaticky'], { element: 'psanicko' }),
  g('batoh', 'Batoh', 'backpack', ['prirozeny'], { element: 'batoh' }),
  // accessories
  g('satek', 'Šátek', 'scarf', ['klasicky', 'elegantni', 'romanticky', 'kreativni'], { element: 'satek' }),
  g('pasek', 'Pásek', 'belt', ['klasicky', 'prirozeny', 'minimal', 'dramaticky'], { element: 'pasek' }),
  g('naramky', 'Výrazný náramek', 'bracelet', ['dramaticky', 'kreativni'], { element: 'vyrazne-naramky' }),
  g('sperky', 'Jemné šperky', 'necklace', ['elegantni', 'romanticky', 'minimal'], { element: 'jemne-sperky' }),
]

const byId = new Map(GARMENTS.map((x) => [x.id, x]))

/** n0–n2: neutrals dark → light. a0–a2: accents in the order they were picked. */
type Role = 'n0' | 'n1' | 'n2' | 'a0' | 'a1' | 'a2'

type Slot = { id: string; group: string; options: string[]; role: Role; unique?: boolean }

const pool = (group: string, prefix: string, options: string[], roles: Role[]): Slot[] =>
  roles.map((role, i) => ({ id: `${prefix}${i + 1}`, group, options, role, unique: true }))

const TOPS = 'Topy'
const BOTTOMS = 'Spodní díly'

/** The capsule template: 30 slots, each offering alternatives in order of preference. */
const SLOTS: Slot[] = [
  { id: 'top1', group: TOPS, role: 'n2', options: ['tricko-basic', 'tricko-obrazek', 'tricko-logo'] },
  { id: 'top2', group: TOPS, role: 'a0', options: ['tricko-obrazek', 'tricko-basic', 'tricko-logo'] },
  { id: 'top3', group: TOPS, role: 'a1', options: ['top-saten', 'top-krajka', 'top-flitry', 'tricko-basic'] },
  { id: 'top4', group: TOPS, role: 'n2', options: ['kosile', 'halenka', 'halenka-vzor'] },
  { id: 'top5', group: TOPS, role: 'a2', options: ['halenka', 'halenka-vzor', 'kosile', 'top-krajka'] },
  { id: 'top6', group: TOPS, role: 'n0', options: ['rolak', 'svetr'] },
  { id: 'top7', group: TOPS, role: 'a0', options: ['svetr', 'svetr-oversize', 'rolak'] },
  { id: 'top8', group: TOPS, role: 'n1', options: ['svetr-oversize', 'svetr', 'kardigan'] },
  { id: 'top9', group: TOPS, role: 'a1', options: ['kardigan', 'rolak', 'svetr', 'svetr-oversize'] },

  { id: 'bot1', group: BOTTOMS, role: 'n0', options: ['kalhoty-rovne', 'kalhoty-cigaretky', 'kalhoty-siroke'] },
  { id: 'bot2', group: BOTTOMS, role: 'n1', options: ['kalhoty-siroke', 'kalhoty-cigaretky', 'kalhoty-rovne'] },
  { id: 'bot3', group: BOTTOMS, role: 'n0', options: ['dziny', 'kalhoty-rovne', 'kalhoty-cigaretky'] },
  { id: 'bot4', group: BOTTOMS, role: 'n2', options: ['kalhoty-cigaretky', 'kalhoty-siroke', 'kalhoty-rovne', 'dziny'] },
  { id: 'bot5', group: BOTTOMS, role: 'n1', options: ['sukne-pouzdrova', 'sukne-ackova', 'sukne-plisovana'] },
  { id: 'bot6', group: BOTTOMS, role: 'a2', options: ['sukne-ackova', 'sukne-plisovana', 'sukne-pouzdrova'] },

  ...pool('Šaty', 'saty', ['saty-kosilove', 'saty-pouzdrove', 'saty-zavinovaci', 'saty-upletove', 'saty-maxi'], ['n0', 'a0', 'a1']),

  { id: 'vrstva1', group: 'Vrstvy', role: 'n0', unique: true, options: ['sako', 'bunda-kozena', 'bunda-dzinova'] },
  { id: 'vrstva2', group: 'Vrstvy', role: 'n1', unique: true, options: ['bunda-kozena', 'bunda-dzinova', 'sako'] },
  { id: 'vrstva3', group: 'Vrstvy', role: 'n2', unique: true, options: ['trenckot', 'kabat'] },
  { id: 'vrstva4', group: 'Vrstvy', role: 'n1', unique: true, options: ['kabat', 'trenckot'] },

  ...pool(
    'Boty',
    'boty',
    ['lodicky', 'tenisky', 'kotnikove', 'baleriny', 'mokasiny', 'kozacky', 'masivni-boty', 'sandaly'],
    ['n0', 'n2', 'n1', 'a0'],
  ),
  ...pool('Kabelky', 'kabelka', ['do-ruky', 'crossbody', 'tvarovana', 'mekka', 'shopper', 'psanicko', 'batoh'], ['n1', 'a1']),
  ...pool('Doplňky', 'doplnek', ['satek', 'pasek', 'sperky', 'naramky'], ['a2', 'n0']),
]

export const CAPSULE_SIZE = SLOTS.length

export type CapsuleInput = {
  shape: ShapeId | null
  neutrals: string[]
  accents: string[]
  styles: StyleId[]
  elements: Record<string, Preference>
  pieceColors: Record<string, string>
}

export type Piece = {
  slot: string
  group: string
  garment: Garment
  color: string
  /** True when the colour is one of her accents rather than a neutral. */
  accent: boolean
  cut: string | null
}

const PLACEHOLDER = '#d9d2ce'

export function capsulePalette(input: Pick<CapsuleInput, 'neutrals' | 'accents'>) {
  const neutrals = [...input.neutrals].sort((a, b) => luma(a) - luma(b))
  return { neutrals, accents: input.accents, all: [...neutrals, ...input.accents] }
}

export function buildCapsule(input: CapsuleInput): Piece[] {
  const shape = shapeById(input.shape)
  const { neutrals, accents, all } = capsulePalette(input)
  const colorFor = (role: Role) => {
    const list = role[0] === 'n' ? neutrals : accents
    return list.length ? list[Number(role[1]) % list.length] : PLACEHOLDER
  }

  const used = new Map<string, number>()
  const pieces: Piece[] = []

  for (const slot of SLOTS) {
    let best: { garment: Garment; score: number } | null = null
    slot.options.forEach((id, index) => {
      const garment = byId.get(id)!
      const pref = garment.element ? input.elements[garment.element] : undefined
      if (pref === 'no') return
      if (garment.optIn && pref !== 'yes') return
      const times = used.get(id) ?? 0
      if (slot.unique && times > 0) return
      const score =
        (pref === 'yes' ? 5 : 0) +
        2 * garment.styles.filter((s) => input.styles.includes(s)).length -
        4 * times - // a repeat is fine in another colour, but only when it's clearly preferred
        0.1 * index
      if (!best || score > best.score) best = { garment, score }
    })
    // Everything this slot offers is on her "nenosím" list: leave the slot out.
    if (!best) continue
    const { garment } = best as { garment: Garment }
    used.set(garment.id, (used.get(garment.id) ?? 0) + 1)
    const override = input.pieceColors[slot.id]
    const color = override && all.includes(override) ? override : colorFor(slot.role)
    pieces.push({
      slot: slot.id,
      group: slot.group,
      garment,
      color,
      accent: accents.includes(color),
      cut: garment.cut && shape ? shape.cuts[garment.cut] : null,
    })
  }
  return pieces
}
