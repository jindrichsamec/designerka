import { useState } from 'react'
import { GarmentIcon } from '../components/GarmentIcon'
import { Mannequin } from '../components/Mannequin'
import { PromptDialog } from '../components/PromptDialog'
import type { Piece } from '../data/capsule'
import { resolveOutfit, suggestOutfits, toggleWorn } from '../data/outfit'
import type { Crop, Draft, Photo, Profile } from '../store'
import type { StepId } from './Wardrobe'

export function Outfits(props: {
  profile: Profile
  capsule: Piece[]
  photo: Photo | null
  crop: Crop
  draft: Draft
  savedCount: number
  onDraft: (draft: Draft) => void
  /** Stores the given pieces; with `id` it replaces that saved outfit. */
  onSave: (pieces: string[], id: string | null) => void
  onGoTo: (step: StepId) => void
}) {
  const { profile, capsule, draft, onDraft, onSave, onGoTo } = props
  const [suggestions, setSuggestions] = useState<string[][] | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const worn = resolveOutfit(draft.pieces, capsule)
  const groups = [...new Set(capsule.map((p) => p.group))]
  const paletteReady = profile.neutrals.length + profile.accents.length > 0

  const wear = (pieces: string[]) => {
    setJustSaved(false)
    onDraft({ ...draft, pieces })
  }
  const save = (pieces: string[], id: string | null) => {
    onSave(pieces, id)
    setJustSaved(true)
  }

  return (
    <div className="step wide outfits">
      <aside className="dressing">
        <Mannequin shape={profile.shape} pieces={worn} photo={props.photo} crop={props.crop} />
        <div className="dressing-actions">
          <button
            type="button"
            className="button primary"
            disabled={worn.length === 0}
            onClick={() => {
              save(worn.map((p) => p.slot), draft.id)
              onDraft({ id: null, pieces: [] })
            }}
          >
            {draft.id ? 'Uložit změny' : 'Uložit outfit'}
          </button>
          <button type="button" className="button ghost" disabled={worn.length === 0} onClick={() => wear([])}>
            Svléknout
          </button>
        </div>
        <button type="button" className="button ghost" disabled={worn.length === 0} onClick={() => setPromptOpen(true)}>
          Vygenerovat AI prompt
        </button>
        {promptOpen && (
          <PromptDialog
            title="aktuální outfit"
            pieces={worn}
            shape={profile.shape}
            photo={props.photo}
            onClose={() => setPromptOpen(false)}
          />
        )}
        {justSaved && (
          <p className="saved">
            Uloženo.{' '}
            <button type="button" className="link" onClick={() => onGoTo('compare')}>
              Porovnat outfity ({props.savedCount})
            </button>
          </p>
        )}
      </aside>

      <div className="closet">
        <header className="step-head">
          <h1>Outfity</h1>
          <p>Ťukni na kousky ze šatníku a postava si je oblékne. Co se ti líbí, ulož a porovnej na další stránce.</p>
        </header>

        {(!profile.shape || !paletteReady) && (
          <ul className="todo">
            {!profile.shape && (
              <li>
                <button type="button" className="link" onClick={() => onGoTo('body')}>
                  Vyber typ postavy – figurína teď má obecný tvar.
                </button>
              </li>
            )}
            {!paletteReady && (
              <li>
                <button type="button" className="link" onClick={() => onGoTo('colors')}>
                  Vyber barvy – kousky jsou zatím šedé.
                </button>
              </li>
            )}
          </ul>
        )}

        <section className="panel">
          <div className="suggest-head">
            <h2>Návrhy kombinací</h2>
            <button type="button" className="button ghost" onClick={() => setSuggestions(suggestOutfits(capsule))}>
              {suggestions ? 'Navrhnout znovu' : 'Navrhnout kombinace'}
            </button>
          </div>
          {suggestions ? (
            <div className="suggestions">
              {suggestions.map((slots, i) => (
                <div key={i} className="suggestion">
                  <button type="button" className="suggestion-figure" title="Obléct na postavu" onClick={() => wear(slots)}>
                    <Mannequin shape={profile.shape} pieces={resolveOutfit(slots, capsule)} photo={props.photo} crop={props.crop} />
                  </button>
                  <button type="button" className="button ghost" onClick={() => save(slots, null)}>
                    Uložit
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">Appka poskládá pár kombinací ze šatníku. Ťuknutím si návrh oblékneš a můžeš ho dál upravit.</p>
          )}
        </section>

        {groups.map((group) => (
          <section key={group} className="section">
            <header className="section-head">
              <h2>{group}</h2>
            </header>
            <div className="picks">
              {capsule
                .filter((p) => p.group === group)
                .map((piece) => {
                  const on = draft.pieces.includes(piece.slot)
                  return (
                    <button
                      key={piece.slot}
                      type="button"
                      className={`pick${on ? ' on' : ''}`}
                      aria-pressed={on}
                      onClick={() => wear(toggleWorn(draft.pieces, piece.slot, capsule))}
                    >
                      <GarmentIcon icon={piece.garment.icon} color={piece.color} />
                      <span>{piece.garment.name}</span>
                    </button>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
