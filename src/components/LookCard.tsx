import type { Look } from '../data/looks'
import type { Crop, Photo } from '../store'
import { LookFigure } from './LookFigure'

export function Star(props: { on: boolean; onToggle: () => void; large?: boolean }) {
  return (
    <button
      type="button"
      className={`star${props.on ? ' on' : ''}${props.large ? ' large' : ''}`}
      aria-pressed={props.on}
      title={props.on ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
      onClick={(e) => {
        e.stopPropagation()
        props.onToggle()
      }}
    >
      {props.on ? '★' : '☆'}
    </button>
  )
}

export function Caption({ look, showSection }: { look: Look; showSection?: boolean }) {
  return (
    <div className="caption">
      {showSection && <span className="caption-section">{look.section}</span>}
      <span className="caption-title">{look.title}</span>
      {look.subtitle && <span className="caption-sub">{look.subtitle}</span>}
    </div>
  )
}

/** Thumbnail tile used in the overview and the compare board. */
export function LookCard(props: {
  look: Look
  photo: Photo | null
  crop: Crop
  favorite: boolean
  showSection?: boolean
  onOpen: () => void
  onToggleFavorite: () => void
  onRemove?: () => void
}) {
  const { look } = props
  return (
    <article className="card">
      <button type="button" className="card-figure" onClick={props.onOpen} title="Otevřít">
        <LookFigure look={look} photo={props.photo} crop={props.crop} />
      </button>
      <div className="card-foot">
        <Caption look={look} showSection={props.showSection} />
        {props.onRemove && (
          <button type="button" className="icon" title="Smazat barvu" onClick={props.onRemove}>
            ×
          </button>
        )}
        <Star on={props.favorite} onToggle={props.onToggleFavorite} />
      </div>
    </article>
  )
}
