import { useEffect, useRef, useState } from 'react'
import { DEFAULT_CROP, prepareImage, type Client, type Crop, type Photo } from '../store'
import { placePhoto } from './geometry'

const OVAL = { w: 356, h: 462 }
const ZOOM = { min: 1, max: 4 }

function CropEditor(props: { photo: Photo; crop: Crop; onChange: (c: Crop) => void }) {
  const { photo, crop, onChange } = props
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; crop: Crop } | null>(null)
  const frame = { x: 0, y: 0, w: OVAL.w, h: OVAL.h }
  const placed = placePhoto(frame, photo.aspect, crop)
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

  const zoomBy = (factor: number) =>
    onChange({ ...crop, zoom: Math.min(ZOOM.max, Math.max(ZOOM.min, crop.zoom * factor)) })

  return (
    <div className="crop">
      <svg
        ref={svg}
        className="crop-stage"
        viewBox={`0 0 ${OVAL.w} ${OVAL.h}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, y: e.clientY, crop }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d || !svg.current) return
          const unitsPerPx = OVAL.w / svg.current.clientWidth
          onChange({
            ...crop,
            u: clamp01(d.crop.u - ((e.clientX - d.x) * unitsPerPx) / placed.width),
            v: clamp01(d.crop.v - ((e.clientY - d.y) * unitsPerPx) / placed.height),
          })
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onWheel={(e) => zoomBy(e.deltaY < 0 ? 1.06 : 1 / 1.06)}
      >
        <clipPath id="crop-oval">
          <ellipse cx={OVAL.w / 2} cy={OVAL.h / 2} rx={OVAL.w / 2} ry={OVAL.h / 2} />
        </clipPath>
        <image href={photo.url} preserveAspectRatio="none" opacity={0.25} {...placed} />
        <image
          href={photo.url}
          preserveAspectRatio="none"
          clipPath="url(#crop-oval)"
          {...placed}
        />
        <ellipse
          cx={OVAL.w / 2}
          cy={OVAL.h / 2}
          rx={OVAL.w / 2 - 1}
          ry={OVAL.h / 2 - 1}
          fill="none"
          stroke="#fff"
          strokeWidth={2}
        />
      </svg>
      <label className="crop-zoom">
        Přiblížení
        <input
          type="range"
          min={ZOOM.min}
          max={ZOOM.max}
          step={0.01}
          value={crop.zoom}
          onChange={(e) => onChange({ ...crop, zoom: Number(e.target.value) })}
        />
      </label>
      <p className="hint">Táhni fotku tak, aby byl obličej uprostřed oválu. Kolečkem nebo posuvníkem přiblížíš.</p>
    </div>
  )
}

export function ClientDialog(props: {
  client: Client | null // null = creating a new one
  photo: Photo | null
  onSave: (data: { name: string; crop: Crop; file: Blob | null }) => void | Promise<void>
  onDelete?: () => void
  onClose?: () => void // absent when there is nothing to go back to
}) {
  const { client } = props
  const [name, setName] = useState(client?.name ?? '')
  const [crop, setCrop] = useState<Crop>(client?.crop ?? DEFAULT_CROP)
  const [picked, setPicked] = useState<{ blob: Blob; photo: Photo } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pickedUrl = picked?.photo.url

  useEffect(() => () => void (pickedUrl && URL.revokeObjectURL(pickedUrl)), [pickedUrl])

  const photo = picked?.photo ?? props.photo

  async function pick(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const blob = await prepareImage(file)
      const bitmap = await createImageBitmap(blob)
      const aspect = bitmap.width / bitmap.height
      bitmap.close()
      setPicked({ blob, photo: { url: URL.createObjectURL(blob), aspect } })
      setCrop(DEFAULT_CROP)
    } catch {
      setError('Tenhle soubor se nepodařilo načíst. Zkus JPG nebo PNG.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="backdrop" onClick={props.onClose}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError(null)
          try {
            await props.onSave({ name: name.trim() || 'Bez jména', crop, file: picked?.blob ?? null })
            // on success the parent closes the dialog
          } catch {
            setError('Fotku se nepodařilo uložit. Zkus to znovu nebo mimo anonymní režim.')
            setBusy(false)
          }
        }}
      >
        <h2>{client ? 'Klientka' : 'Nová klientka'}</h2>
        <label className="field">
          Jméno
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="např. Jana" autoFocus />
        </label>

        {photo && <CropEditor photo={photo} crop={crop} onChange={setCrop} />}

        <label className={photo ? 'button ghost' : 'button upload'}>
          {busy ? 'Načítám…' : photo ? 'Vyměnit fotku' : 'Nahrát fotku obličeje'}
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {error && <p className="error">{error}</p>}

        <div className="dialog-actions">
          {props.onDelete && (
            <button type="button" className="button danger" onClick={props.onDelete}>
              Smazat klientku
            </button>
          )}
          <span className="spacer" />
          {props.onClose && (
            <button type="button" className="button ghost" onClick={props.onClose}>
              Zrušit
            </button>
          )}
          <button type="submit" className="button primary" disabled={busy}>
            {client ? 'Uložit' : 'Vytvořit'}
          </button>
        </div>
      </form>
    </div>
  )
}
