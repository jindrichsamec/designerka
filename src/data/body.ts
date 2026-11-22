/** Which body-shape advice applies to a garment. */
export type CutKey = 'top' | 'knit' | 'trousers' | 'skirt' | 'dress' | 'jacket' | 'coat'

export type ShapeId = 'x' | 'a' | 'o' | 'h' | 'v'

export type Shape = {
  id: ShapeId
  name: string
  hint: string // how to recognise it
  goal: string
  /** Half-widths of shoulders / waist / hips for the silhouette drawing. */
  outline: [number, number, number]
  cuts: Record<CutKey, string>
  avoid: string[]
}

export const CUT_LABELS: Record<CutKey, string> = {
  top: 'Topy a košile',
  knit: 'Svetry',
  trousers: 'Kalhoty',
  skirt: 'Sukně',
  dress: 'Šaty',
  jacket: 'Saka a bundy',
  coat: 'Kabáty',
}

export const SHAPES: Shape[] = [
  {
    id: 'x',
    name: 'Přesýpací hodiny',
    hint: 'Ramena a boky stejně široké, výrazný pas.',
    goal: 'Zachovat rovnováhu a zdůraznit pas.',
    outline: [26, 14, 26],
    cuts: {
      top: 'přiléhavý nebo zavinovací, výstřih do V, zastrčený do pasu',
      knit: 'jemný úplet kopírující postavu, délka k pasu',
      trousers: 'vyšší pas, rovné nebo mírně rozšířené nohavice',
      skirt: 'pouzdrová nebo áčková s vysokým pasem',
      dress: 'projmuté v pase nebo zavinovací, s páskem',
      jacket: 'projmuté, na jeden knoflík, délka k bokům',
      coat: 's páskem v pase',
    },
    avoid: ['rovné pytlovité střihy bez pasu', 'objemné vrstvy přes pas'],
  },
  {
    id: 'a',
    name: 'Hruška',
    hint: 'Boky širší než ramena, útlý pas.',
    goal: 'Opticky rozšířit ramena a zjemnit boky.',
    outline: [20, 15, 29],
    cuts: {
      top: 'lodičkový nebo široký výstřih, detail na ramenou, délka nad nejširší místo boků',
      knit: 'struktura nebo objem nahoře, končí nad boky',
      trousers: 'rovné nebo mírně do zvonu, vyšší pas, hladké bez kapes na bocích',
      skirt: 'áčková, ke kolenům nebo midi',
      dress: 'projmuté v pase s rozšířenou sukní',
      jacket: 'strukturovaná ramena, délka nad nebo pod nejširší místo boků',
      coat: 'áčkový s výrazným límcem',
    },
    avoid: ['světlé úzké kalhoty', 'kapsy a detaily na bocích', 'topy končící v nejširším místě boků'],
  },
  {
    id: 'o',
    name: 'Jablko',
    hint: 'Plnější střed těla, pas málo výrazný, štíhlé nohy.',
    goal: 'Prodloužit siluetu, zvýraznit dekolt a nohy.',
    outline: [21, 27, 23],
    cuts: {
      top: 'výstřih do V, splývavý materiál, délka přes boky',
      knit: 'jemný splývavý úplet s véčkem, bez objemu',
      trousers: 'rovné nohavice, hladký předek, střední až vyšší pas',
      skirt: 'rovná nebo mírně áčková, hladký pas, nad kolena',
      dress: 'empírový nebo rovný střih s výstřihem do V',
      jacket: 'delší, nošené rozepnuté, tvoří svislou linii',
      coat: 'rovný jednořadý, délka ke kolenům',
    },
    avoid: ['pásky a detaily v pase', 'krátké hranaté topy', 'tuhé materiály přes břicho'],
  },
  {
    id: 'h',
    name: 'Obdélník',
    hint: 'Ramena, pas i boky podobně široké.',
    goal: 'Vytvořit dojem pasu a přidat křivky.',
    outline: [23, 20, 23],
    cuts: {
      top: 'řasení, volánky nebo peplum, kulatý či lodičkový výstřih',
      knit: 'kratší svetr k pasu, výraznější struktura',
      trousers: 'se sklady v pase nebo paperbag, rozšířené nohavice',
      skirt: 'áčková, plisovaná nebo se sklady',
      dress: 'zavinovací nebo s páskem, řasení v pase',
      jacket: 'projmuté, peplum nebo s páskem',
      coat: 'přepásaný v pase',
    },
    avoid: ['rovné střihy bez tvarování od ramen dolů'],
  },
  {
    id: 'v',
    name: 'Obrácený trojúhelník',
    hint: 'Ramena širší než boky.',
    goal: 'Zjemnit ramena a přidat objem bokům.',
    outline: [29, 18, 19],
    cuts: {
      top: 'úzký výstřih do V, hladká ramena bez zdobení',
      knit: 'jemný hladký úplet, raglánový rukáv',
      trousers: 'široké nebo do zvonu, kapsy na bocích, klidně světlé',
      skirt: 'áčková, kolová nebo plisovaná',
      dress: 'véčkový výstřih, rozšířená sukně',
      jacket: 'měkká ramena bez vycpávek, jednořadé, délka přes boky',
      coat: 'áčkový, bez vycpávek',
    },
    avoid: ['vycpávky a zdobená ramena', 'lodičkový výstřih', 'úzké kalhoty k objemnému topu'],
  },
]

export const shapeById = (id: ShapeId | null) => SHAPES.find((s) => s.id === id) ?? null

export type Measures = { bust: number | null; waist: number | null; hips: number | null }

/** Rough guide from three circumferences (cm); the stylist's eye has the last word. */
export function suggestShape({ bust, waist, hips }: Measures): ShapeId | null {
  if (!bust || !waist || !hips) return null
  if (waist >= 0.88 * Math.max(bust, hips)) return 'o'
  if (hips >= bust * 1.05) return 'a'
  if (bust >= hips * 1.05) return 'v'
  return waist <= 0.75 * ((bust + hips) / 2) ? 'x' : 'h'
}
