import { CUT_LABELS, SHAPES, shapeById, suggestShape, type CutKey, type Shape } from '../data/body'
import type { Profile } from '../store'

function Silhouette({ outline: [s, w, h] }: { outline: Shape['outline'] }) {
  const c = 50
  const side = (k: 1 | -1) =>
    `C${c + k * (s + 2)} 50 ${c + k * w} 58 ${c + k * w} 72 C${c + k * w} 86 ${c + k * h} 90 ${c + k * h} 104`
  // right side top→bottom, then mirror the same curve back up the left side
  const d =
    `M${c - s} 34 Q${c} 26 ${c + s} 34 ${side(1)} L${c + h * 0.86} 134 H${c - h * 0.86} L${c - h} 104 ` +
    `C${c - h} 90 ${c - w} 86 ${c - w} 72 C${c - w} 58 ${c - s - 2} 50 ${c - s} 34 Z`
  return (
    <svg className="silhouette" viewBox="0 0 100 140" aria-hidden="true">
      <circle cx={c} cy={14} r={9} />
      <path d={d} />
    </svg>
  )
}

const MEASURES = [
  ['bust', 'Prsa'],
  ['waist', 'Pas'],
  ['hips', 'Boky'],
] as const

export function Body(props: { profile: Profile; onChange: (patch: Partial<Profile>) => void }) {
  const { profile, onChange } = props
  const shape = shapeById(profile.shape)
  const suggested = shapeById(suggestShape(profile.measures))

  return (
    <div className="step">
      <header className="step-head">
        <h1>Postava a střihy</h1>
        <p>Vyber typ postavy. Podle něj se v šatníku určí střih každého kousku.</p>
      </header>

      <div className="shapes">
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`shape${profile.shape === s.id ? ' on' : ''}`}
            aria-pressed={profile.shape === s.id}
            onClick={() => onChange({ shape: s.id })}
          >
            <Silhouette outline={s.outline} />
            <strong>{s.name}</strong>
            <span>{s.hint}</span>
          </button>
        ))}
      </div>

      <section className="panel measures">
        <h2>Nevíš si rady? Změř obvody</h2>
        <div className="measure-row">
          {MEASURES.map(([key, label]) => (
            <label key={key} className="field">
              {label} (cm)
              <input
                type="number"
                inputMode="decimal"
                min={40}
                max={200}
                value={profile.measures[key] ?? ''}
                onChange={(e) =>
                  onChange({
                    measures: { ...profile.measures, [key]: e.target.value ? Number(e.target.value) : null },
                  })
                }
              />
            </label>
          ))}
          {suggested && (
            <div className="measure-result">
              <span>
                Podle měr vychází <strong>{suggested.name}</strong>
              </span>
              {suggested.id !== profile.shape && (
                <button type="button" className="button primary" onClick={() => onChange({ shape: suggested.id })}>
                  Použít
                </button>
              )}
            </div>
          )}
        </div>
        <p className="hint">Výpočet je jen orientační – rozhoduje pohled do zrcadla.</p>
      </section>

      {shape && (
        <section className="panel">
          <h2>{shape.name}</h2>
          <p className="goal">{shape.goal}</p>
          <dl className="cuts">
            {(Object.keys(CUT_LABELS) as CutKey[]).map((key) => (
              <div key={key}>
                <dt>{CUT_LABELS[key]}</dt>
                <dd>{shape.cuts[key]}</dd>
              </div>
            ))}
          </dl>
          <h3>Čemu se vyhnout</h3>
          <ul className="avoid">
            {shape.avoid.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
