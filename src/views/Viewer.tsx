import { useEffect, useMemo, useRef } from 'react'
import { Caption, Star } from '../components/LookCard'
import { figureAspect } from '../components/geometry'
import { LookFigure } from '../components/LookFigure'
import { buildPages, type Look } from '../data/looks'
import type { Crop, Photo } from '../store'

export function Viewer(props: {
  looks: Look[]
  currentId: string
  paired: boolean
  photo: Photo | null
  crop: Crop
  favorites: Set<string>
  onNavigate: (id: string) => void
  onTogglePaired: () => void
  onToggleFavorite: (id: string) => void
  onClose: () => void
  /** Look id of the season chosen as the client's colour type, if any. */
  seasonLookId: string | null
  onSetSeason: (lookId: string) => void
}) {
  const { looks, currentId, paired, onNavigate, onClose, onToggleFavorite, onTogglePaired } = props
  const pages = useMemo(() => buildPages(looks, paired), [looks, paired])
  const found = pages.findIndex((p) => p.some((l) => l.id === currentId))
  const index = found < 0 ? 0 : found
  const page = pages[index]
  const swipe = useRef<number | null>(null)

  const go = (delta: number) => {
    const next = pages[(index + delta + pages.length) % pages.length]
    onNavigate(next[0].id)
  }
  const goSection = (delta: number) => {
    const here = page[0].section
    const order = [...new Set(pages.map((p) => p[0].section))]
    const target = order[(order.indexOf(here) + delta + order.length) % order.length]
    onNavigate(pages.find((p) => p[0].section === target)![0].id)
  }

  // No dependency list: the handler closes over the current page, and re-binding is cheap.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target
      // let text fields and the client picker keep their own keys
      const typing = (t instanceof HTMLInputElement && t.type !== 'checkbox') || t instanceof HTMLSelectElement
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      const actions: Record<string, () => void> = {
        ArrowRight: () => go(1),
        ArrowLeft: () => go(-1),
        ArrowDown: () => goSection(1),
        ArrowUp: () => goSection(-1),
        Escape: onClose,
        f: () => page.forEach((l) => onToggleFavorite(l.id)),
        d: onTogglePaired,
      }
      const action = actions[e.key.length === 1 ? e.key.toLowerCase() : e.key]
      if (action) {
        e.preventDefault()
        action()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="viewer">
      <div
        className="stage"
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          const dx = swipe.current === null ? 0 : e.clientX - swipe.current
          swipe.current = null
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
        }}
      >
        <button type="button" className="nav prev" onClick={() => go(-1)} aria-label="Předchozí">
          ‹
        </button>
        <div className="page">
          {page.map((look) => (
            <figure key={look.id} className="slot" style={{ aspectRatio: figureAspect(look) }}>
              <LookFigure look={look} photo={props.photo} crop={props.crop} />
              <figcaption>
                <Caption look={look} />
                <Star large on={props.favorites.has(look.id)} onToggle={() => onToggleFavorite(look.id)} />
              </figcaption>
            </figure>
          ))}
        </div>
        <button type="button" className="nav next" onClick={() => go(1)} aria-label="Další">
          ›
        </button>
      </div>

      {page.length === 1 && page[0].type === 'season' && (
        <div className="set-season">
          {props.seasonLookId === page[0].id ? (
            <span className="chosen">✓ Můj barevný typ</span>
          ) : (
            <button type="button" className="button primary" onClick={() => props.onSetSeason(page[0].id)}>
              Tohle je můj typ
            </button>
          )}
        </div>
      )}
      {page.length === 1 && page[0].type === 'season' && (
        <ul className="tops">
          {page[0].tops.map((top) => (
            <li key={top.name}>
              <i style={{ background: top.color }} />
              {top.name}
            </li>
          ))}
        </ul>
      )}

      <div className="viewer-bar">
        <span className="where">
          {page[0].section} · {index + 1} / {pages.length}
        </span>
        <span className="spacer" />
        <label className="toggle" title="Zobrazit obě poloviny dvojice vedle sebe (D)">
          <input type="checkbox" checked={paired} onChange={onTogglePaired} />
          Dvojice vedle sebe
        </label>
        <span className="keys">← → přepnout · ↑ ↓ sekce · F oblíbené · D dvojice</span>
      </div>
    </div>
  )
}
