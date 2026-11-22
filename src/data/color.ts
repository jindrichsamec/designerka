const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Perceived brightness, 0 (black) – 255 (white). */
export function luma(hex: string) {
  const [r, g, b] = rgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** How colourful: 0 (grey) – 255 (fully saturated). */
function chroma(hex: string) {
  const c = rgb(hex)
  return Math.max(...c) - Math.min(...c)
}

function hue(hex: string) {
  const [r, g, b] = rgb(hex)
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

const hueGap = (a: string, b: string) => {
  const d = Math.abs(hue(a) - hue(b))
  return Math.min(d, 360 - d)
}

/** Greys, creams, and anything dark enough to behave like navy/black/espresso in an outfit. */
export const isNeutral = (hex: string) => chroma(hex) < 58 || luma(hex) < 55

/**
 * A starting point the stylist can adjust: three neutrals from dark to light and three accents.
 *
 * Everything comes from the season's ten signature ("top") colours where possible, because those
 * are what make the season recognisable. Picking by raw saturation instead would hand a muted
 * season its loudest, least typical shades.
 */
export function suggestPalette(season: { palette: string[]; tops: { color: string }[] }) {
  const palette = [...new Set(season.palette)]
  const tops = [...new Set(season.tops.map((t) => t.color))]
  // Stricter than isNeutral: a dark red is dark, but it is not something to build a wardrobe on.
  const calm = (c: string) => chroma(c) < 45 || (luma(c) < 45 && chroma(c) < 80)
  const pool = [...new Set([...tops, ...palette])].filter(calm)
  const SIGNATURE_BONUS = 30

  /** Lowest-scoring calm colour that fits; signature colours get a head start over the rest. */
  const neutral = (score: (c: string) => number, fits: (c: string) => boolean, taken: string[]) => {
    const rank = (c: string) => score(c) - (tops.includes(c) ? SIGNATURE_BONUS : 0)
    const best = (list: string[]) => list.filter((c) => !taken.includes(c)).sort((x, y) => rank(x) - rank(y))[0]
    return best(pool.filter(fits)) ?? best(pool) ?? best(palette)
  }
  // chroma counts against a candidate so that, of two similar tones, the greyer one wins
  const dark = neutral((c) => luma(c) + chroma(c) * 0.5, (c) => luma(c) <= 110, [])
  const light = neutral((c) => chroma(c) * 0.5 - luma(c), (c) => luma(c) >= 170, [dark])
  const target = (luma(dark) + luma(light)) / 2
  const mid = neutral(
    (c) => Math.abs(luma(c) - target) + chroma(c) * 0.8,
    (c) => Math.abs(luma(c) - target) < 50,
    [dark, light],
  )
  const neutrals = [dark, mid, light]

  // The season's own five most colourful signature shades, however soft they are in absolute terms.
  const candidates = tops
    .filter((c) => !neutrals.includes(c))
    .sort((x, y) => chroma(y) - chroma(x))
    .slice(0, 5)
  const accents = candidates.slice(0, 1)
  while (accents.length < 3 && accents.length < candidates.length) {
    const rest = candidates.filter((c) => !accents.includes(c))
    const spread = (c: string) => Math.min(...accents.map((a) => hueGap(a, c)))
    accents.push(rest.reduce((best, c) => (spread(c) > spread(best) ? c : best)))
  }
  return { neutrals, accents }
}

/**
 * Plain-English colour name for image prompts ("muted olive", "navy blue"). Image models follow
 * words far better than hex codes, so this only needs to land in the right neighbourhood.
 */
export function describeColor(hex: string): string {
  const [r, g, b] = rgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
  const h = hue(hex)

  if (s < 0.1 || l < 0.08 || l > 0.96) {
    return l > 0.9 ? 'off-white' : l > 0.7 ? 'light grey' : l > 0.4 ? 'grey' : l > 0.15 ? 'charcoal grey' : 'black'
  }

  // [name, whether the name already says how light or dark it is]
  const base = ((): [string, boolean] => {
    if (h < 18 || h >= 345) {
      if (l < 0.3) return ['burgundy', true]
      if (l > 0.72) return ['pink', false]
      return s < 0.5 && l < 0.5 ? ['reddish brown', true] : ['red', false]
    }
    if (h < 38) {
      if (l > 0.85) return ['cream', true]
      if (l > 0.72) return s < 0.5 ? ['beige', true] : ['peach', true]
      if (l < 0.42) return s < 0.6 ? ['brown', false] : ['rust', true]
      return s < 0.5 ? ['camel', true] : ['orange', false]
    }
    if (h < 68) {
      if (l > 0.82) return ['cream', true]
      if (s < 0.5) return l < 0.6 ? ['olive', false] : ['khaki', true]
      return l < 0.5 ? ['mustard', true] : l < 0.7 ? ['golden yellow', true] : ['yellow', false]
    }
    if (h < 165) return h < 95 && s < 0.6 ? ['olive green', false] : ['green', false]
    if (h < 200) return l > 0.7 ? ['aqua', true] : ['teal', false]
    if (h < 250) return l < 0.25 ? ['navy blue', true] : ['blue', false]
    if (h < 290) return l > 0.72 ? ['lilac', true] : ['purple', false]
    if (l < 0.3) return ['plum', true]
    if (l > 0.72) return ['pink', false]
    return s < 0.45 ? ['mauve', true] : ['magenta', false]
  })()

  // near-black shades need saying even when the name is already dark ("plum", "navy")
  if (l < 0.18) return `very dark ${base[0]}`
  const tone = base[1] ? '' : l < 0.28 ? 'dark ' : l > 0.8 ? 'pale ' : l > 0.65 ? 'light ' : ''
  return `${tone}${s < 0.35 ? 'muted ' : ''}${base[0]}`
}
