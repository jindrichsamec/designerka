import type { ShapeId } from './body'
import type { Piece } from './capsule'
import { describeColor } from './color'
import { wearOf, type Wear } from './outfit'
import template from './template.json'

/**
 * Text for an external image model. The app never calls one: the stylist copies the prompt and
 * the reference images into whatever tool she uses. Prompts are English because image models
 * follow English most reliably.
 */

const GARMENT_EN: Record<string, string> = {
  'tricko-basic': 'plain T-shirt with no logo or print',
  'tricko-obrazek': 'T-shirt with a small graphic print',
  'tricko-logo': 'T-shirt with a large logo across the chest',
  'top-saten': 'satin camisole top with thin straps',
  'top-krajka': 'lace camisole top',
  'top-flitry': 'sequin camisole top',
  kosile: 'classic button-up shirt',
  halenka: 'soft blouse',
  'halenka-vzor': 'patterned blouse',
  rolak: 'fine-knit turtleneck',
  svetr: 'fine-knit crew-neck sweater',
  'svetr-oversize': 'oversized knit sweater',
  kardigan: 'cardigan, worn open',
  'kalhoty-rovne': 'straight-leg trousers',
  'kalhoty-cigaretky': 'slim cigarette trousers, ankle length',
  'kalhoty-siroke': 'wide-leg trousers',
  dziny: 'denim jeans',
  'sukne-pouzdrova': 'pencil skirt, knee length',
  'sukne-ackova': 'A-line midi skirt',
  'sukne-plisovana': 'pleated midi skirt',
  'saty-kosilove': 'shirt dress, knee length',
  'saty-pouzdrove': 'sheath dress, knee length',
  'saty-zavinovaci': 'wrap dress, midi length',
  'saty-upletove': 'knit dress, knee length',
  'saty-maxi': 'maxi dress',
  sako: 'tailored blazer, worn open',
  'bunda-kozena': 'leather biker jacket, worn open',
  'bunda-dzinova': 'denim jacket, worn open',
  trenckot: 'trench coat, worn open',
  kabat: 'wool coat, worn open',
  lodicky: 'pointed-toe pumps',
  baleriny: 'ballet flats',
  tenisky: 'clean minimalist sneakers',
  'masivni-boty': 'chunky lug-sole boots',
  kotnikove: 'heeled ankle boots',
  mokasiny: 'loafers',
  kozacky: 'knee-high boots',
  sandaly: 'heeled sandals',
  crossbody: 'small crossbody bag worn across the body',
  'do-ruky': 'top-handle handbag carried in one hand',
  tvarovana: 'structured handbag carried in one hand',
  mekka: 'soft slouchy shoulder bag',
  shopper: 'large tote bag carried in one hand',
  psanicko: 'clutch held in one hand',
  batoh: 'backpack',
  satek: 'scarf tied loosely around the neck',
  pasek: 'belt at the waist',
  naramky: 'bold statement bracelet',
  sperky: 'delicate necklace',
}

const SHAPE_EN: Record<ShapeId, string> = {
  x: 'hourglass figure: shoulders and hips equally wide, clearly defined waist',
  a: 'pear-shaped figure: hips wider than shoulders, slim waist',
  o: 'apple-shaped figure: fuller midsection, less defined waist, slim legs',
  h: 'rectangle figure: shoulders, waist and hips of similar width',
  v: 'inverted-triangle figure: shoulders wider than hips',
}

// the order a person would describe an outfit in
const ORDER: Wear[] = ['dress', 'top', 'bottom', 'layer', 'shoes', 'bag', 'accessory']

const TOP_NAMES = new Map(template.seasons.flatMap((s) => s.tops.map((t) => [t.color, t.name] as const)))

function colour(hex: string) {
  const named = TOP_NAMES.get(hex)
  return `${describeColor(hex)}${named ? `, "${named}"` : ''} (${hex})`
}

const outfitLines = (pieces: Piece[]) =>
  [...pieces]
    .sort((a, b) => ORDER.indexOf(wearOf(a)) - ORDER.indexOf(wearOf(b)))
    .map((p) => `- ${GARMENT_EN[p.garment.id] ?? p.garment.name}: ${colour(p.color)}`)
    .join('\n')

export type SceneId = 'studio' | 'park' | 'street' | 'interior'

// every scene keeps the whole outfit visible and the colours honest, so results stay comparable
const LOOK = 'True-to-life colours with no colour grading, sharp focus on her, natural skin texture.'
const WALKING =
  'Full-body shot from head to toe, the whole outfit clearly visible. She is walking towards the camera, ' +
  'mid-stride, with a relaxed natural smile.'

export const SCENES: { id: SceneId; name: string; text: string }[] = [
  {
    id: 'studio',
    name: 'Studio',
    text:
      'Full-body shot from head to toe, standing upright and facing the camera, arms relaxed at her sides, ' +
      `plain light-grey studio background, soft even daylight, 50 mm lens at eye level. ${LOOK}`,
  },
  {
    id: 'park',
    name: 'Park',
    text:
      `${WALKING} Setting: a paved path in a city park in early autumn on a sunny day, soft dappled light ` +
      'through the trees, green and golden foliage, park benches and a few out-of-focus passers-by far in the ' +
      `background. Shallow depth of field, 85 mm lens at eye level. ${LOOK}`,
  },
  {
    id: 'street',
    name: 'Ulice',
    text:
      `${WALKING} Setting: a quiet city street with historic facades and shop windows, soft overcast daylight, ` +
      `background softly out of focus. Shallow depth of field, 85 mm lens at eye level. ${LOOK}`,
  },
  {
    id: 'interior',
    name: 'Interiér',
    text:
      'Full-body shot from head to toe, the whole outfit clearly visible. She is standing relaxed, facing the ' +
      'camera, with a natural smile. Setting: a bright, minimalist apartment with light walls and a wooden floor, ' +
      `soft daylight from a large window, background softly out of focus. 50 mm lens at eye level. ${LOOK}`,
  },
]

const RULES =
  'Show exactly the garments listed and nothing else: no extra accessories, jewellery, logos or text. ' +
  'Keep every garment in the stated colour.'

export const NEGATIVE_PROMPT =
  'illustration, drawing, sketch, cartoon, 3D render, mannequin, doll, extra accessories, logos, text, watermark, ' +
  'cropped body, cut-off feet, distorted hands, changed face, heavy retouching, colour filter'

export type PromptKind = 'references' | 'text'

/** `hasFace` is false when the client has no photo, so the prompt must not refer to one. */
export function buildPrompt(
  kind: PromptKind,
  pieces: Piece[],
  shape: ShapeId | null,
  hasFace: boolean,
  scene: SceneId = 'studio',
) {
  const SCENE = (SCENES.find((s) => s.id === scene) ?? SCENES[0]).text
  const body = shape ? `Body: ${SHAPE_EN[shape]}. Realistic, natural proportions.` : 'Body: realistic, natural proportions.'
  const outfit = `Outfit, with colours matched exactly:\n${outfitLines(pieces)}`

  if (kind === 'text') {
    return [
      'A photorealistic full-body fashion photograph of a woman wearing the outfit described below.',
      body,
      outfit,
      SCENE,
      RULES,
    ].join('\n\n')
  }

  const sketch = hasFace ? 'Image 2' : 'Image 1'
  const references = [
    'Reference images:',
    ...(hasFace
      ? [
          '- Image 1 (portrait): this is the woman in the photograph. Keep her face, hair, skin tone and age ' +
            'exactly as they are. Do not beautify, slim or otherwise change her features.',
        ]
      : []),
    `- ${sketch} (outfit sketch): a flat illustration showing which garments she wears, their colours and how ` +
      'they are layered. Use it for the outfit only. Do not copy its drawing style, its blank head or its proportions.',
  ].join('\n')

  return [
    hasFace
      ? 'Create a photorealistic full-body fashion photograph of the woman from image 1, dressed in the outfit shown in image 2.'
      : 'Create a photorealistic full-body fashion photograph of a woman dressed in the outfit shown in image 1.',
    references,
    body,
    outfit,
    SCENE,
    RULES,
  ].join('\n\n')
}
