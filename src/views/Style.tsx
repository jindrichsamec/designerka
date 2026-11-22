import { ELEMENT_GROUPS, MAX_STYLES, STYLES, type Preference } from '../data/style'
import type { Profile } from '../store'

const CHOICES: { value: Preference | null; label: string }[] = [
  { value: 'yes', label: 'Chci' },
  { value: null, label: 'Je mi to jedno' },
  { value: 'no', label: 'Nenosím' },
]

export function Style(props: { profile: Profile; onChange: (patch: Partial<Profile>) => void }) {
  const { profile, onChange } = props

  const toggleStyle = (id: (typeof STYLES)[number]['id']) =>
    onChange({
      styles: profile.styles.includes(id)
        ? profile.styles.filter((s) => s !== id)
        : [...profile.styles, id].slice(-MAX_STYLES),
    })

  const setElement = (id: string, value: Preference | null) => {
    const elements = { ...profile.elements }
    if (value) elements[id] = value
    else delete elements[id]
    onChange({ elements })
  }

  return (
    <div className="step">
      <header className="step-head">
        <h1>Styl</h1>
        <p>
          Vyber až {MAX_STYLES} styly, které ti sedí, a řekni, které prvky v šatníku chceš a které nenosíš.
        </p>
      </header>

      <div className="styles">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`style-card${profile.styles.includes(s.id) ? ' on' : ''}`}
            aria-pressed={profile.styles.includes(s.id)}
            onClick={() => toggleStyle(s.id)}
          >
            <strong>{s.name}</strong>
            <span>{s.text}</span>
          </button>
        ))}
      </div>

      {ELEMENT_GROUPS.map((group) => (
        <section key={group.name} className="panel">
          <h2>{group.name}</h2>
          <div className="elements">
            {group.items.map((item) => {
              const current = profile.elements[item.id] ?? null
              return (
                <div key={item.id} className="element" role="group" aria-label={item.name}>
                  <span>{item.name}</span>
                  <span className="tri">
                    {CHOICES.map((choice) => (
                      <button
                        key={choice.label}
                        type="button"
                        className={`${choice.value ?? 'any'}${current === choice.value ? ' on' : ''}`}
                        aria-pressed={current === choice.value}
                        title={choice.label}
                        onClick={() => setElement(item.id, choice.value)}
                      >
                        {choice.value === 'yes' ? 'Chci' : choice.value === 'no' ? 'Nenosím' : '–'}
                      </button>
                    ))}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
