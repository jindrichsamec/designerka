import { useState } from 'react'
import { LookCard } from '../components/LookCard'
import type { Look } from '../data/looks'
import type { Crop, Photo } from '../store'

export function Compare(props: {
  looks: Look[] // favourites, in the order they were picked
  photo: Photo | null
  crop: Crop
  onOpen: (id: string) => void
  onToggleFavorite: (id: string) => void
  onClear: () => void
}) {
  const { looks } = props
  const [columns, setColumns] = useState<number | null>(null)
  const cols = columns ?? Math.min(Math.max(looks.length, 2), 4)

  if (looks.length === 0) {
    return (
      <div className="empty">
        <h2>Zatím nic k porovnání</h2>
        <p>
          V přehledu nebo v prohlížeči označ hvězdičkou kombinace, které se ti líbí. Tady je pak
          uvidíš vedle sebe.
        </p>
      </div>
    )
  }

  return (
    <div className="compare">
      <div className="compare-bar">
        <span>Vedle sebe</span>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={`chip${cols === n ? ' on' : ''}`}
            onClick={() => setColumns(n)}
          >
            {n}
          </button>
        ))}
        <span className="spacer" />
        <button type="button" className="button ghost" onClick={props.onClear}>
          Vymazat výběr
        </button>
      </div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {looks.map((look) => (
          <LookCard
            key={look.id}
            look={look}
            photo={props.photo}
            crop={props.crop}
            favorite
            showSection
            onOpen={() => props.onOpen(look.id)}
            onToggleFavorite={() => props.onToggleFavorite(look.id)}
          />
        ))}
      </div>
    </div>
  )
}
