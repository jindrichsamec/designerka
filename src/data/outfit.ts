import type { IconId, Piece } from './capsule'

/** A saved combination: capsule slot ids, so it follows the wardrobe when colours change. */
export type Outfit = { id: string; pieces: string[] }

/** Where on the body a piece goes. One piece per place, except accessories. */
export type Wear = 'top' | 'bottom' | 'dress' | 'layer' | 'shoes' | 'bag' | 'accessory'

const WEAR: Record<IconId, Wear> = {
  tee: 'top', teeprint: 'top', cami: 'top', shirt: 'top', turtleneck: 'top', sweater: 'top',
  trousers: 'bottom', wide: 'bottom', pencil: 'bottom', askirt: 'bottom',
  dress: 'dress', shift: 'dress',
  // a cardigan sits in the wardrobe with the knits, but is worn open over a top
  cardigan: 'layer', blazer: 'layer', coat: 'layer', jacket: 'layer',
  pump: 'shoes', flat: 'shoes', sneaker: 'shoes', boot: 'shoes', ankle: 'shoes',
  bag: 'bag', hobo: 'bag', crossbody: 'bag', clutch: 'bag', tote: 'bag', backpack: 'bag',
  scarf: 'accessory', belt: 'accessory', bracelet: 'accessory', necklace: 'accessory',
}

export const wearOf = (piece: Piece) => WEAR[piece.garment.icon]

function clashes(a: Piece, b: Piece) {
  const [wa, wb] = [wearOf(a), wearOf(b)]
  // one scarf, one belt… but a scarf and a belt go together
  if (wa === 'accessory' && wb === 'accessory') return a.garment.icon === b.garment.icon
  if (wa === wb) return true
  const separates = (w: Wear) => w === 'top' || w === 'bottom'
  return (wa === 'dress' && separates(wb)) || (wb === 'dress' && separates(wa))
}

/** Put a piece on (taking off whatever it cannot be worn with) or take it off. */
export function toggleWorn(worn: string[], slot: string, capsule: Piece[]): string[] {
  if (worn.includes(slot)) return worn.filter((s) => s !== slot)
  const piece = capsule.find((p) => p.slot === slot)
  if (!piece) return worn
  const keep = worn.filter((s) => {
    const other = capsule.find((p) => p.slot === s)
    return other && !clashes(piece, other)
  })
  return [...keep, slot]
}

/** Resolve stored slot ids against the current capsule, dropping pieces that no longer exist. */
export const resolveOutfit = (slots: string[], capsule: Piece[]) =>
  slots.flatMap((s) => capsule.find((p) => p.slot === s) ?? [])

export const SUGGESTION_COUNT = 6

/**
 * A handful of ready-made combinations. Rules of thumb: one colourful piece against neutrals,
 * every base worn at most once, shoes/bags/layers rotated so the set shows the wardrobe's range.
 */
export function suggestOutfits(capsule: Piece[]): string[][] {
  const of = (wear: Wear) => capsule.filter((p) => wearOf(p) === wear)
  const [tops, bottoms, dresses, layers, shoes, bags, extras] = (
    ['top', 'bottom', 'dress', 'layer', 'shoes', 'bag', 'accessory'] as Wear[]
  ).map(of)
  // by role, not by saturation: in a muted season even the accents are soft
  const accent = (p: Piece) => p.accent

  const pairs = tops
    .flatMap((top) => bottoms.map((bottom) => ({ top, bottom })))
    .map((pair) => {
      const colourful = Number(accent(pair.top)) + Number(accent(pair.bottom))
      const score = (colourful === 1 ? 2 : colourful === 0 ? 1 : -2) - (pair.top.color === pair.bottom.color ? 3 : 0)
      return { ...pair, score }
    })
    .sort((a, b) => b.score - a.score)

  const bases: Piece[][] = []
  const used = new Set<string>()
  const dressShare = Math.min(dresses.length, 2)
  for (const { top, bottom } of pairs) {
    if (bases.length >= SUGGESTION_COUNT - dressShare) break
    if (used.has(top.slot) || used.has(bottom.slot)) continue
    used.add(top.slot).add(bottom.slot)
    bases.push([top, bottom])
  }
  dresses.slice(0, dressShare).forEach((dress, i) => bases.splice(2 + i * 2, 0, [dress]))

  const pick = (list: Piece[], i: number) => (list.length ? [list[i % list.length]] : [])
  return bases.map((base, i) => {
    const mainColor = base[0].color
    // every other outfit gets a layer, ideally one that does not disappear into the top
    const contrast = layers.filter((l) => l.color !== mainColor)
    const layer = i % 2 === 0 ? pick(contrast.length ? contrast : layers, i / 2) : []
    return [...base, ...layer, ...pick(shoes, i), ...pick(bags, i), ...pick(extras, i)].map((p) => p.slot)
  })
}
