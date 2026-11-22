import { GarmentIcon } from '../components/GarmentIcon'
import { shapeById } from '../data/body'
import { buildCapsule, CAPSULE_SIZE, capsulePalette } from '../data/capsule'
import { ELEMENT_GROUPS, STYLES } from '../data/style'
import template from '../data/template.json'
import type { Profile } from '../store'

export type StepId = 'body' | 'colors' | 'style' | 'wardrobe' | 'outfits' | 'compare'

const ELEMENT_NAMES = new Map(ELEMENT_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.name] as const)))

export function Wardrobe(props: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
  onGoTo: (step: StepId) => void
}) {
  const { profile, onChange, onGoTo } = props
  const shape = shapeById(profile.shape)
  const season = template.seasons.find((s) => s.id === profile.season)
  const palette = capsulePalette(profile)
  const pieces = buildCapsule(profile)
  const groups = [...new Set(pieces.map((p) => p.group))]

  const missing: { step: StepId; text: string }[] = []
  if (!shape) missing.push({ step: 'body', text: 'Vyber typ postavy – doplní se střihy.' })
  if (palette.all.length < 6) missing.push({ step: 'colors', text: 'Vyber 3 neutrální a 3 akcentní barvy.' })
  if (profile.styles.length === 0) missing.push({ step: 'style', text: 'Vyber styl – určí, které kousky se vyberou.' })

  const wanted = Object.entries(profile.elements).filter(([, v]) => v === 'yes').map(([id]) => ELEMENT_NAMES.get(id))
  const refused = Object.entries(profile.elements).filter(([, v]) => v === 'no').map(([id]) => ELEMENT_NAMES.get(id))

  return (
    <div className="step wide">
      <header className="step-head">
        <h1>Kapsulový šatník</h1>
        <p>
          {pieces.length} kousků ve tvých barvách a střizích, které jdou navzájem kombinovat.
          {pieces.length < CAPSULE_SIZE && ' Některá místa zůstala prázdná, protože vše, co do nich patří, nenosíš.'}
        </p>
      </header>

      {missing.length > 0 && (
        <ul className="todo">
          {missing.map((m) => (
            <li key={m.step}>
              <button type="button" className="link" onClick={() => onGoTo(m.step)}>
                {m.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="panel summary">
        <div>
          <span className="caption-section">Postava</span>
          <strong>{shape?.name ?? '—'}</strong>
        </div>
        <div>
          <span className="caption-section">Barevný typ</span>
          <strong>{season?.name ?? '—'}</strong>
          <span className="slot-row">
            {palette.all.map((c) => (
              <i key={c} style={{ background: c }} />
            ))}
          </span>
        </div>
        <div>
          <span className="caption-section">Styl</span>
          <strong>{profile.styles.map((id) => STYLES.find((s) => s.id === id)!.name).join(' · ') || '—'}</strong>
        </div>
        {wanted.length > 0 && (
          <div>
            <span className="caption-section">Chci</span>
            <span>{wanted.join(', ')}</span>
          </div>
        )}
        {refused.length > 0 && (
          <div>
            <span className="caption-section">Nenosím</span>
            <span>{refused.join(', ')}</span>
          </div>
        )}
      </section>

      {groups.map((group) => {
        const list = pieces.filter((p) => p.group === group)
        return (
          <section key={group} className="section">
            <header className="section-head">
              <h2>{group}</h2>
              <span className="count">{list.length}</span>
            </header>
            <div className="pieces">
              {list.map((piece) => (
                <article key={piece.slot} className="piece">
                  <GarmentIcon icon={piece.garment.icon} color={piece.color} />
                  <strong>{piece.garment.name}</strong>
                  {piece.cut && <p>{piece.cut}</p>}
                  {palette.all.length > 1 && (
                    <div className="piece-colors" role="group" aria-label="Barva kousku">
                      {palette.all.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={c === piece.color ? 'on' : ''}
                          style={{ background: c }}
                          aria-pressed={c === piece.color}
                          title="Změnit barvu"
                          onClick={() => onChange({ pieceColors: { ...profile.pieceColors, [piece.slot]: c } })}
                        />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )
      })}

      {Object.keys(profile.pieceColors).length > 0 && (
        <button type="button" className="button ghost" onClick={() => onChange({ pieceColors: {} })}>
          Vrátit původní rozložení barev
        </button>
      )}
    </div>
  )
}
