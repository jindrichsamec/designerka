import { useState } from 'react'
import { LookFigure } from '../components/LookFigure'
import { isNeutral, luma, suggestPalette } from '../data/color'
import type { Look } from '../data/looks'
import template from '../data/template.json'
import type { Crop, Photo, Profile } from '../store'

type Group = 'neutrals' | 'accents'
const LIMIT = 3
const LABEL: Record<Group, string> = { neutrals: 'Neutrální', accents: 'Akcentní' }

const SEASON_GROUPS = ['zima', 'leto', 'jaro', 'podzim'].map((suffix) => ({
  suffix,
  seasons: template.seasons.filter((s) => s.id.endsWith(suffix)),
}))
const GROUP_NAME: Record<string, string> = { zima: 'Zima', leto: 'Léto', jaro: 'Jaro', podzim: 'Podzim' }

export function Palette(props: {
  profile: Profile
  photo: Photo | null
  crop: Crop
  onChange: (patch: Partial<Profile>) => void
}) {
  const { profile, onChange } = props
  const [active, setActive] = useState<Group>('neutrals')
  const season = template.seasons.find((s) => s.id === profile.season)

  const pickSeason = (id: string) => {
    const next = template.seasons.find((s) => s.id === id)!
    // a new season invalidates the old picks, so start from a sensible suggestion
    onChange({ season: id, ...suggestPalette(next), pieceColors: {} })
  }

  const toggle = (color: string) => {
    const other: Group = active === 'neutrals' ? 'accents' : 'neutrals'
    const current = profile[active]
    if (current.includes(color)) return onChange({ [active]: current.filter((c) => c !== color) })
    // when the group is full the newest pick replaces the oldest
    const next = [...current, color].slice(-LIMIT)
    onChange({ [active]: next, [other]: profile[other].filter((c) => c !== color) })
  }

  const chosen = [...profile.neutrals, ...profile.accents]
  const preview: Look | null =
    chosen.length > 0
      ? { id: 'moje-paleta', section: '', title: 'Moje paleta', type: 'drape', fill: { kind: 'wheel', rings: [chosen] } }
      : null

  const colors = season ? [...new Set(season.palette)] : []
  const sorted = (list: string[]) => [...list].sort((a, b) => luma(a) - luma(b))
  const nameOf = (color: string) => season?.tops.find((t) => t.color === color)?.name

  return (
    <div className="step">
      <header className="step-head">
        <h1>Moje paleta</h1>
        <p>Urči barevný typ a vyber tři neutrální a tři akcentní barvy, ze kterých se poskládá šatník.</p>
      </header>

      <section className="panel">
        <h2>Barevný typ</h2>
        <div className="seasons">
          {SEASON_GROUPS.map(({ suffix, seasons }) => (
            <div key={suffix} className="season-group">
              <span className="caption-section">{GROUP_NAME[suffix]}</span>
              {seasons.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`season${profile.season === s.id ? ' on' : ''}`}
                  aria-pressed={profile.season === s.id}
                  onClick={() => pickSeason(s.id)}
                >
                  <span className="season-dots">
                    {s.tops.slice(0, 5).map((t) => (
                      <i key={t.name} style={{ background: t.color }} />
                    ))}
                  </span>
                  <strong>{s.name}</strong>
                  <small>{s.tagline}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
        {!season && <p className="hint">Nejsi si jistá? Projdi si Přehled a Prohlížeč a porovnej sezóny u obličeje.</p>}
      </section>

      {season && (
        <section className="panel palette">
          <div className="palette-pick">
            <h2>{season.name}</h2>
            <p className="goal">{season.suits}</p>

            <div className="slots">
              {(['neutrals', 'accents'] as Group[]).map((group) => (
                <button
                  key={group}
                  type="button"
                  className={`slot-group${active === group ? ' on' : ''}`}
                  aria-pressed={active === group}
                  onClick={() => setActive(group)}
                >
                  <span>
                    {LABEL[group]} {profile[group].length}/{LIMIT}
                  </span>
                  <span className="slot-row">
                    {Array.from({ length: LIMIT }, (_, i) => (
                      <i key={i} className={profile[group][i] ? '' : 'empty'} style={{ background: profile[group][i] }} />
                    ))}
                  </span>
                </button>
              ))}
              <button type="button" className="button ghost" onClick={() => onChange({ ...suggestPalette(season), pieceColors: {} })}>
                Navrhnout znovu
              </button>
            </div>
            <p className="hint">
              Klikni na skupinu a pak na barvy v paletě. Vybíráš teď: <strong>{LABEL[active].toLowerCase()}</strong>.
            </p>

            {(
              [
                ['Neutrální odstíny', sorted(colors.filter(isNeutral))],
                ['Barevné odstíny', colors.filter((c) => !isNeutral(c))],
              ] as const
            ).map(([title, list]) => (
              <div key={title}>
                <h3>{title}</h3>
                <div className="swatches">
                  {list.map((color) => {
                    const group = profile.neutrals.includes(color) ? 'N' : profile.accents.includes(color) ? 'A' : null
                    return (
                      <button
                        key={color}
                        type="button"
                        className={`swatch${group ? ' on' : ''}`}
                        style={{ background: color, color: luma(color) < 140 ? '#fff' : '#1d1b1a' }}
                        title={nameOf(color) ?? color}
                        aria-pressed={!!group}
                        onClick={() => toggle(color)}
                      >
                        {group}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {preview && (
            <figure className="palette-preview">
              <LookFigure look={preview} photo={props.photo} crop={props.crop} />
              <figcaption className="hint">Tvoje barvy u obličeje</figcaption>
            </figure>
          )}
        </section>
      )}
    </div>
  )
}
