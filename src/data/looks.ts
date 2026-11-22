import template from './template.json'

export type Fill =
  | { kind: 'solid'; color: string }
  | { kind: 'metal'; metal: 'gold' | 'silver' | 'copper' | 'rosegold' }
  | { kind: 'wheel'; rings: string[][] }

type Base = {
  id: string
  section: string
  title: string
  subtitle?: string
  /** Looks sharing a pairId are the two halves of one template slide. */
  pairId?: string
}

export type Look =
  | (Base & { type: 'drape'; fill: Fill })
  | (Base & { type: 'grid'; cells: (string | null)[][] })
  | (Base & { type: 'backdrop'; color: string })
  | (Base & {
      type: 'season'
      palette: string[]
      tops: { name: string; color: string }[]
      suits: string
    })

export type CustomColor = { id: string; name: string; color: string }

export const SECTION_CUSTOM = 'Vlastní barvy'

const solid = (color: string): Fill => ({ kind: 'solid', color })

function pair(
  section: string,
  slug: string,
  name: string,
  labels: [string, string],
  fills: [Fill, Fill],
): Look[] {
  return fills.map((fill, i) => ({
    id: `${slug}-${i === 0 ? 'a' : 'b'}`,
    pairId: slug,
    section,
    title: name,
    subtitle: labels[i],
    type: 'drape' as const,
    fill,
  }))
}

const pairs = template.pairs as Record<string, string[]>
const solidPair = (n: number): [Fill, Fill] => [solid(pairs[n][0]), solid(pairs[n][1])]

const UNDERTONE = 'Podtón pleti'
const GROUPS = 'Skupiny barev'
const BRIGHT = 'Jasné × tlumené'
const WARM = 'Teplé × studené'
const SEASONS = 'Sezóny'

const grids = template.grids as Record<string, (string | null)[][]>

const builtIn: Look[] = [
  ...(['Studený', 'Neutrální', 'Teplý'] as const).map((title, i): Look => ({
    id: `podton-${i}`,
    section: UNDERTONE,
    title: `${title} podtón`,
    type: 'backdrop',
    color: template.backdrops[i],
  })),

  ...(
    [
      ['zarive', 'Zářivé barvy', 'jasné a živé barvy'],
      ['tlumene', 'Tlumené barvy', 'měkké a jemné barvy'],
      ['tmave', 'Tmavé barvy', 'pestré tmavé barvy'],
      ['svetle', 'Světlé barvy', 'jemné barvy'],
      ['teple', 'Teplé barvy', 'teplý podtón'],
      ['studene', 'Studené barvy', 'studený podtón'],
    ] as const
  ).map(([key, title, subtitle]): Look => ({
    id: `mrizka-${key}`,
    section: GROUPS,
    title,
    subtitle,
    type: 'grid',
    cells: grids[key],
  })),

  ...(
    [
      [12, 'zelena', 'Zelená'],
      [13, 'ruzova', 'Růžová'],
      [14, 'modra', 'Modrá'],
      [15, 'cervena', 'Červená'],
      [16, 'fialova', 'Fialová'],
      [17, 'oranzova', 'Oranžová'],
      [18, 'zluta', 'Žlutá'],
    ] as const
  ).flatMap(([n, slug, name]) =>
    pair(BRIGHT, `jt-${slug}`, name, ['jasná', 'tlumená'], solidPair(n)),
  ),

  ...pair(WARM, 'ts-kolo', 'Barevné kolo', ['teplé', 'studené'], [
    { kind: 'wheel', rings: template.wheels[0] },
    { kind: 'wheel', rings: template.wheels[1] },
  ]),
  ...pair(WARM, 'ts-kov', 'Kov', ['zlatá', 'stříbrná'], [
    { kind: 'metal', metal: 'gold' },
    { kind: 'metal', metal: 'silver' },
  ]),
  ...pair(WARM, 'ts-med', 'Kov', ['měď', 'růžové zlato'], [
    { kind: 'metal', metal: 'copper' },
    { kind: 'metal', metal: 'rosegold' },
  ]),
  ...(
    [
      [23, 'fialova', 'Fialová'],
      [24, 'lila', 'Lila'],
      [25, 'petrolejova', 'Petrolejová × modrá'],
      [26, 'modra', 'Modrá'],
      [27, 'cervena', 'Červená'],
      [28, 'zluta', 'Žlutá'],
      [29, 'zelena', 'Zelená'],
    ] as const
  ).flatMap(([n, slug, name]) =>
    pair(WARM, `ts-${slug}`, name, ['teplá', 'studená'], solidPair(n)),
  ),

  ...template.seasons.map((s): Look => ({
    id: `sezona-${s.id}`,
    section: SEASONS,
    title: s.name,
    subtitle: s.tagline,
    type: 'season',
    palette: s.palette,
    tops: s.tops,
    suits: s.suits,
  })),
]

export function buildLooks(custom: CustomColor[]): Look[] {
  return [
    ...builtIn,
    ...custom.map((c): Look => ({
      id: c.id,
      section: SECTION_CUSTOM,
      title: c.name || c.color.toUpperCase(),
      type: 'drape',
      fill: solid(c.color),
    })),
  ]
}

export const SECTIONS = [UNDERTONE, GROUPS, BRIGHT, WARM, SEASONS, SECTION_CUSTOM]

/** One viewer page: a single look, or both halves of a template pair. */
export function buildPages(looks: Look[], paired: boolean): Look[][] {
  if (!paired) return looks.map((l) => [l])
  const pages: Look[][] = []
  const byPair = new Map<string, Look[]>()
  for (const look of looks) {
    if (!look.pairId) {
      pages.push([look])
      continue
    }
    const existing = byPair.get(look.pairId)
    if (existing) existing.push(look)
    else {
      const page = [look]
      byPair.set(look.pairId, page)
      pages.push(page)
    }
  }
  return pages
}
