import { useState } from 'react'
import { Mannequin } from '../components/Mannequin'
import { PromptDialog } from '../components/PromptDialog'
import type { ShapeId } from '../data/body'
import type { Piece } from '../data/capsule'
import { resolveOutfit, type Outfit } from '../data/outfit'
import type { Crop, Photo } from '../store'
import type { StepId } from './Wardrobe'

export function OutfitCompare(props: {
  outfits: Outfit[]
  capsule: Piece[]
  shape: ShapeId | null
  photo: Photo | null
  crop: Crop
  onEdit: (outfit: Outfit) => void
  onDelete: (id: string) => void
  onGoTo: (step: StepId) => void
}) {
  const { outfits } = props
  const [columns, setColumns] = useState<number | null>(null)
  const [promptFor, setPromptFor] = useState<string | null>(null)
  const cols = columns ?? Math.min(Math.max(outfits.length, 2), 4)

  if (outfits.length === 0) {
    return (
      <div className="empty">
        <h2>Zatím žádný outfit</h2>
        <p>
          V kroku{' '}
          <button type="button" className="link" onClick={() => props.onGoTo('outfits')}>
            Outfity
          </button>{' '}
          oblékni postavu a kombinaci ulož. Tady pak uvidíš všechny vedle sebe.
        </p>
      </div>
    )
  }

  return (
    <div className="compare">
      <div className="compare-bar">
        <span>Vedle sebe</span>
        {[2, 3, 4, 6].map((n) => (
          <button key={n} type="button" className={`chip${cols === n ? ' on' : ''}`} onClick={() => setColumns(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {outfits.map((outfit, i) => {
          const pieces = resolveOutfit(outfit.pieces, props.capsule)
          return (
            <article key={outfit.id} className="card outfit-card">
              <div className="outfit-figure">
                <Mannequin shape={props.shape} pieces={pieces} photo={props.photo} crop={props.crop} />
              </div>
              <div className="outfit-foot">
                <span className="caption-title">Outfit {i + 1}</span>
                <ul className="outfit-pieces">
                  {pieces.map((p) => (
                    <li key={p.slot}>
                      <i style={{ background: p.color }} />
                      {p.garment.name}
                    </li>
                  ))}
                </ul>
                <div className="outfit-actions">
                  <button type="button" className="button primary" onClick={() => setPromptFor(outfit.id)}>
                    AI prompt
                  </button>
                  <button type="button" className="button ghost" onClick={() => props.onEdit(outfit)}>
                    Upravit
                  </button>
                  <button type="button" className="button danger" onClick={() => props.onDelete(outfit.id)}>
                    Smazat
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {outfits.map(
        (outfit, i) =>
          outfit.id === promptFor && (
            <PromptDialog
              key={outfit.id}
              title={`Outfit ${i + 1}`}
              pieces={resolveOutfit(outfit.pieces, props.capsule)}
              shape={props.shape}
              photo={props.photo}
              onClose={() => setPromptFor(null)}
            />
          ),
      )}
    </div>
  )
}
