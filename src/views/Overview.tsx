import { useState } from 'react'
import { LookCard } from '../components/LookCard'
import { SECTION_CUSTOM, SECTIONS, type Look } from '../data/looks'
import type { Crop, Photo } from '../store'

function AddColor({ onAdd }: { onAdd: (name: string, color: string) => void }) {
  const [color, setColor] = useState('#c2185b')
  const [name, setName] = useState('')
  return (
    <form
      className="add-color"
      onSubmit={(e) => {
        e.preventDefault()
        onAdd(name.trim(), color)
        setName('')
      }}
    >
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Barva" />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Název (nepovinný)" />
      <button type="submit" className="button primary">
        Přidat barvu
      </button>
    </form>
  )
}

export function Overview(props: {
  looks: Look[]
  photo: Photo | null
  crop: Crop
  favorites: Set<string>
  onOpen: (id: string) => void
  onToggleFavorite: (id: string) => void
  onAddColor: (name: string, color: string) => void
  onRemoveColor: (id: string) => void
}) {
  return (
    <div className="overview">
      {SECTIONS.map((section) => {
        const looks = props.looks.filter((l) => l.section === section)
        const custom = section === SECTION_CUSTOM
        return (
          <section key={section} className="section">
            <header className="section-head">
              <h2>{section}</h2>
              <span className="count">{looks.length}</span>
            </header>
            {custom && <AddColor onAdd={props.onAddColor} />}
            {custom && looks.length === 0 && (
              <p className="hint">Vyber barvu a přidej ji — vznikne nový snímek s obličejem, bez kopírování.</p>
            )}
            <div className={`cards cards-${looks[0]?.type ?? 'drape'}`}>
              {looks.map((look) => (
                <LookCard
                  key={look.id}
                  look={look}
                  photo={props.photo}
                  crop={props.crop}
                  favorite={props.favorites.has(look.id)}
                  onOpen={() => props.onOpen(look.id)}
                  onToggleFavorite={() => props.onToggleFavorite(look.id)}
                  onRemove={custom ? () => props.onRemoveColor(look.id) : undefined}
                />
              ))}
            </div>
          </section>
        )
      })}
      <footer className="notice">
        Content copyright © Style Coaching Ltd 2005 – 2020. All Rights Reserved. Authorised for use
        exclusively by licensed Style Coaches™ (terms &amp; conditions apply). Please do not remove or
        edit this notice. www.stylecoachinginstitute.com | www.stylecoachingassociation.com
      </footer>
    </div>
  )
}
