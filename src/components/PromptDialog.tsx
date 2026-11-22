import { useEffect, useRef, useState } from 'react'
import type { ShapeId } from '../data/body'
import type { Piece } from '../data/capsule'
import { buildPrompt, NEGATIVE_PROMPT, SCENES, type PromptKind, type SceneId } from '../data/prompt'
import { DEFAULT_CROP, type Photo } from '../store'
import { Mannequin } from './Mannequin'

/** The Clipboard API only exists on https/localhost; on the LAN we fall back to execCommand. */
async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // blocked or unavailable: try the legacy path below
  }
  const area = document.createElement('textarea')
  area.value = text
  area.style.cssText = 'position:fixed;opacity:0'
  document.body.append(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  return ok
}

const canCopyImages = () => typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write

function toPng(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })

/** Rasterise the on-page outfit drawing so it can be handed to an image model. */
async function svgToPng(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  const { width, height } = svg.viewBox.baseVal
  const scale = 4
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width * scale))
  clone.setAttribute('height', String(height * scale))
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }))
  try {
    return await toPng(await loadImage(url), width * scale, height * scale)
  } finally {
    URL.revokeObjectURL(url)
  }
}

const SCENE_KEY = 'designerka:scene'

/** The scene is a habit, not a per-outfit choice: remember the last one used. */
function savedScene(): SceneId {
  try {
    const id = localStorage.getItem(SCENE_KEY)
    if (SCENES.some((s) => s.id === id)) return id as SceneId
  } catch {
    // storage unavailable: fall through to the default
  }
  return 'studio'
}

function CopyButton(props: { label: string; run: () => Promise<boolean>; primary?: boolean }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  return (
    <button
      type="button"
      className={`button ${props.primary ? 'primary' : 'ghost'}`}
      onClick={async () => {
        setState((await props.run().catch(() => false)) ? 'done' : 'failed')
        setTimeout(() => setState('idle'), 1800)
      }}
    >
      {state === 'done' ? 'Zkopírováno ✓' : state === 'failed' ? 'Nepovedlo se' : props.label}
    </button>
  )
}

function Reference(props: { title: string; note: string; url: string; file: string; png: () => Promise<Blob | null> }) {
  return (
    <figure className="reference">
      <img src={props.url} alt={props.title} />
      <figcaption>
        <strong>{props.title}</strong>
        <span>{props.note}</span>
        <span className="reference-actions">
          <a className="button ghost" href={props.url} download={props.file}>
            Stáhnout
          </a>
          {canCopyImages() && (
            <CopyButton
              label="Kopírovat"
              run={async () => {
                const blob = await props.png()
                if (!blob) return false
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                return true
              }}
            />
          )}
        </span>
      </figcaption>
    </figure>
  )
}

export function PromptDialog(props: {
  title: string
  pieces: Piece[]
  shape: ShapeId | null
  photo: Photo | null
  onClose: () => void
}) {
  const { pieces, shape, photo } = props
  const [kind, setKind] = useState<PromptKind>('references')
  const [scene, setScene] = useState<SceneId>(savedScene)
  const [sketch, setSketch] = useState<{ url: string; blob: Blob } | null>(null)
  const holder = useRef<HTMLDivElement>(null)
  const prompt = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const svg = holder.current?.querySelector('svg')
    if (!svg) return
    let url: string | null = null
    let cancelled = false
    svgToPng(svg)
      .then((blob) => {
        if (!blob || cancelled) return
        url = URL.createObjectURL(blob)
        setSketch({ url, blob })
      })
      .catch(() => {
        // no sketch image: the prompt itself is still usable
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [pieces, shape])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const text = buildPrompt(kind, pieces, shape, !!photo, scene)

  return (
    <div className="backdrop" onClick={props.onClose}>
      <div className="dialog prompt-dialog" role="dialog" aria-label="AI prompt" onClick={(e) => e.stopPropagation()}>
        {/* drawn off-screen with a blank head, then rasterised: the model gets the outfit, not the face */}
        <div ref={holder} className="offscreen" aria-hidden="true">
          <Mannequin shape={shape} pieces={pieces} photo={null} crop={DEFAULT_CROP} />
        </div>

        <h2>AI prompt · {props.title}</h2>
        <p className="hint">
          Zkopíruj prompt a obrázky do nástroje na generování obrázků. Appka sama nic nikam neposílá.
        </p>

        <div className="tabs prompt-tabs">
          <button type="button" className={kind === 'references' ? 'on' : ''} onClick={() => setKind('references')}>
            S obrázky
          </button>
          <button type="button" className={kind === 'text' ? 'on' : ''} onClick={() => setKind('text')}>
            Jen text
          </button>
        </div>

        <div className="scene-row" role="group" aria-label="Scéna">
          <span>Scéna</span>
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip wide${scene === s.id ? ' on' : ''}`}
              aria-pressed={scene === s.id}
              onClick={() => {
                setScene(s.id)
                try {
                  localStorage.setItem(SCENE_KEY, s.id)
                } catch {
                  // not remembered next time, nothing else lost
                }
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* keyed so switching variant or scene resets any hand edits to the generated text */}
        <textarea key={kind + scene} ref={prompt} className="prompt-text" defaultValue={text} rows={14} spellCheck={false} />
        <div className="prompt-actions">
          <CopyButton primary label="Kopírovat prompt" run={() => copyText(prompt.current?.value ?? text)} />
          <CopyButton label="Kopírovat negativní prompt" run={() => copyText(NEGATIVE_PROMPT)} />
        </div>
        <p className="hint">
          Prompt můžeš před zkopírováním upravit. Negativní prompt je pro nástroje, které ho mají jako zvláštní pole.
        </p>

        {kind === 'references' && (
          <>
            <div className="references">
              {photo && (
                <Reference
                  title="Obrázek 1 – obličej"
                  note="Fotka klientky. Nahraj ji jako první."
                  url={photo.url}
                  file="oblicej.jpg"
                  png={async () => {
                    const img = await loadImage(photo.url)
                    return toPng(img, img.naturalWidth, img.naturalHeight)
                  }}
                />
              )}
              {sketch && (
                <Reference
                  title={`Obrázek ${photo ? 2 : 1} – outfit`}
                  note="Kresba outfitu bez obličeje."
                  url={sketch.url}
                  file="outfit.png"
                  png={async () => sketch.blob}
                />
              )}
            </div>
            <p className="hint">
              {!photo && 'Klientka nemá nahranou fotku, prompt proto počítá jen s kresbou outfitu. '}
              Obrázek jde zkopírovat i pravým tlačítkem nebo přetáhnout. Fotku klientky nahrávej do cizí služby jen
              s jejím souhlasem.
            </p>
          </>
        )}

        <div className="dialog-actions">
          <span className="spacer" />
          <button type="button" className="button ghost" onClick={props.onClose}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}
