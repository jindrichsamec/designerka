import { useEffect, useMemo, useState } from 'react'
import { ClientDialog } from './components/ClientDialog'
import { buildCapsule } from './data/capsule'
import { suggestPalette } from './data/color'
import { buildLooks } from './data/looks'
import template from './data/template.json'
import {
  DEFAULT_CROP,
  deletePhoto,
  EMPTY_DRAFT,
  EMPTY_PROFILE,
  loadState,
  newId,
  putPhoto,
  saveState,
  usePhoto,
  type Client,
  type Profile,
  type State,
} from './store'
import { Body } from './views/Body'
import { Compare } from './views/Compare'
import { OutfitCompare } from './views/OutfitCompare'
import { Outfits } from './views/Outfits'
import { Overview } from './views/Overview'
import { Palette } from './views/Palette'
import { Style } from './views/Style'
import { Viewer } from './views/Viewer'
import { Wardrobe, type StepId } from './views/Wardrobe'

type ColorView = 'overview' | 'viewer' | 'compare' | 'palette'
type Dialog = 'new' | 'edit' | null

const STEPS: { id: StepId; name: string }[] = [
  { id: 'body', name: 'Postava' },
  { id: 'colors', name: 'Barvy' },
  { id: 'style', name: 'Styl' },
  { id: 'wardrobe', name: 'Šatník' },
  { id: 'outfits', name: 'Outfity' },
  { id: 'compare', name: 'Porovnání' },
]

const SEASON_PREFIX = 'sezona-'

export default function App() {
  const [state, setState] = useState<State>(loadState)
  const [step, setStep] = useState<StepId>('body')
  const [colorView, setColorView] = useState<ColorView>('overview')
  const [lookId, setLookId] = useState<string | null>(null)
  const [paired, setPaired] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)

  useEffect(() => saveState(state), [state])

  const client = state.clients.find((c) => c.id === state.currentId) ?? null
  const photo = usePhoto(client)
  const looks = useMemo(() => buildLooks(state.custom), [state.custom])
  const favorites = useMemo(() => new Set(client?.favorites), [client?.favorites])
  const crop = client?.crop ?? DEFAULT_CROP

  const updateClient = (id: string, patch: (c: Client) => Client) =>
    setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? patch(c) : c)) }))

  const toggleFavorite = (id: string) =>
    client &&
    updateClient(client.id, (c) => ({
      ...c,
      favorites: c.favorites.includes(id) ? c.favorites.filter((f) => f !== id) : [...c.favorites, id],
    }))

  const open = (id: string) => {
    setLookId(id)
    setStep('colors')
    setColorView('viewer')
  }

  if (!client || dialog === 'new') {
    return (
      <ClientDialog
        key="new"
        client={null}
        photo={null}
        onClose={client ? () => setDialog(null) : undefined}
        onSave={async ({ name, crop, file }) => {
          const id = newId('k')
          if (file) await putPhoto(id, file)
          setState((s) => ({
            ...s,
            currentId: id,
            clients: [
              ...s.clients,
              {
                id,
                name,
                crop,
                favorites: [],
                photoVersion: file ? 1 : 0,
                profile: EMPTY_PROFILE,
                outfits: [],
                draft: EMPTY_DRAFT,
              },
            ],
          }))
          setDialog(null)
          setStep('body')
        }}
      />
    )
  }

  const { profile } = client
  const updateProfile = (patch: Partial<Profile>) =>
    updateClient(client.id, (c) => ({ ...c, profile: { ...c.profile, ...patch } }))

  const favoriteLooks = client.favorites.flatMap((id) => looks.find((l) => l.id === id) ?? [])
  const done: Record<StepId, boolean> = {
    body: !!profile.shape,
    colors: profile.neutrals.length === 3 && profile.accents.length === 3,
    style: profile.styles.length > 0,
    wardrobe: false,
    outfits: client.outfits.length > 0,
    compare: false,
  }
  const capsule = buildCapsule(profile)
  const goTo = (target: StepId) => {
    setStep(target)
    if (target === 'colors') setColorView('palette')
  }

  const colorTabs: { id: ColorView; label: string; count?: number }[] = [
    { id: 'overview', label: 'Přehled' },
    { id: 'viewer', label: 'Prohlížeč' },
    { id: 'compare', label: 'Porovnání', count: favoriteLooks.length },
    { id: 'palette', label: 'Moje paleta' },
  ]

  return (
    <div className="app">
      <header className="top">
        <span className="brand">Designérka</span>
        <nav className="tabs steps" aria-label="Kroky">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={step === s.id ? 'on' : ''}
              aria-current={step === s.id ? 'step' : undefined}
              onClick={() => setStep(s.id)}
            >
              <span className={`step-no${done[s.id] ? ' done' : ''}`}>{done[s.id] ? '✓' : i + 1}</span>
              {s.name}
            </button>
          ))}
        </nav>
        <span className="spacer" />
        <select
          className="client-select"
          aria-label="Klientka"
          value={client.id}
          onChange={(e) => {
            if (e.target.value === '+') setDialog('new')
            else setState((s) => ({ ...s, currentId: e.target.value }))
          }}
        >
          {state.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="+">＋ Nová klientka…</option>
        </select>
        <button type="button" className="button ghost" onClick={() => setDialog('edit')}>
          {client.photoVersion ? 'Fotka a ořez' : 'Nahrát fotku'}
        </button>
      </header>

      {step === 'colors' && (
        <nav className="tabs subtabs" aria-label="Barvy">
          {colorTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={colorView === t.id ? 'on' : ''}
              onClick={() => setColorView(t.id)}
            >
              {t.label}
              {t.count !== undefined && <span className="count">{t.count}</span>}
            </button>
          ))}
        </nav>
      )}

      <main>
        {step === 'body' && <Body profile={profile} onChange={updateProfile} />}

        {step === 'colors' && colorView === 'overview' && (
          <Overview
            looks={looks}
            photo={photo}
            crop={crop}
            favorites={favorites}
            onOpen={open}
            onToggleFavorite={toggleFavorite}
            onAddColor={(name, color) =>
              setState((s) => ({ ...s, custom: [...s.custom, { id: newId('vlastni'), name, color }] }))
            }
            onRemoveColor={(id) =>
              setState((s) => ({
                ...s,
                custom: s.custom.filter((c) => c.id !== id),
                clients: s.clients.map((c) => ({ ...c, favorites: c.favorites.filter((f) => f !== id) })),
              }))
            }
          />
        )}
        {step === 'colors' && colorView === 'viewer' && (
          <Viewer
            looks={looks}
            currentId={lookId ?? looks[0].id}
            paired={paired}
            photo={photo}
            crop={crop}
            favorites={favorites}
            onNavigate={setLookId}
            onTogglePaired={() => setPaired((p) => !p)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setColorView('overview')}
            seasonLookId={profile.season && SEASON_PREFIX + profile.season}
            onSetSeason={(id) => {
              const seasonId = id.slice(SEASON_PREFIX.length)
              const season = template.seasons.find((s) => s.id === seasonId)
              if (season) updateProfile({ season: seasonId, ...suggestPalette(season), pieceColors: {} })
            }}
          />
        )}
        {step === 'colors' && colorView === 'compare' && (
          <Compare
            looks={favoriteLooks}
            photo={photo}
            crop={crop}
            onOpen={open}
            onToggleFavorite={toggleFavorite}
            onClear={() => updateClient(client.id, (c) => ({ ...c, favorites: [] }))}
          />
        )}
        {step === 'colors' && colorView === 'palette' && (
          <Palette profile={profile} photo={photo} crop={crop} onChange={updateProfile} />
        )}

        {step === 'style' && <Style profile={profile} onChange={updateProfile} />}
        {step === 'wardrobe' && (
          <Wardrobe
            profile={profile}
            onChange={updateProfile}
            onGoTo={goTo}
          />
        )}
        {step === 'outfits' && (
          <Outfits
            profile={profile}
            capsule={capsule}
            photo={photo}
            crop={crop}
            draft={client.draft}
            savedCount={client.outfits.length}
            onDraft={(draft) => updateClient(client.id, (c) => ({ ...c, draft }))}
            onSave={(pieces, id) =>
              updateClient(client.id, (c) => ({
                ...c,
                outfits: c.outfits.some((o) => o.id === id)
                  ? c.outfits.map((o) => (o.id === id ? { ...o, pieces } : o))
                  : [...c.outfits, { id: newId('outfit'), pieces }],
              }))
            }
            onGoTo={goTo}
          />
        )}
        {step === 'compare' && (
          <OutfitCompare
            outfits={client.outfits}
            capsule={capsule}
            shape={profile.shape}
            photo={photo}
            crop={crop}
            onEdit={(outfit) => {
              updateClient(client.id, (c) => ({ ...c, draft: { id: outfit.id, pieces: outfit.pieces } }))
              setStep('outfits')
            }}
            onDelete={(id) =>
              updateClient(client.id, (c) => ({
                ...c,
                outfits: c.outfits.filter((o) => o.id !== id),
                draft: c.draft.id === id ? { ...c.draft, id: null } : c.draft,
              }))
            }
            onGoTo={goTo}
          />
        )}
      </main>

      {dialog === 'edit' && (
        <ClientDialog
          key={client.id}
          client={client}
          photo={photo}
          onClose={() => setDialog(null)}
          onSave={async ({ name, crop, file }) => {
            if (file) await putPhoto(client.id, file)
            updateClient(client.id, (c) => ({
              ...c,
              name,
              crop,
              photoVersion: file ? c.photoVersion + 1 : c.photoVersion,
            }))
            setDialog(null)
          }}
          onDelete={() => {
            if (!confirm(`Opravdu smazat klientku „${client.name}“ včetně fotky a výběru?`)) return
            void deletePhoto(client.id)
            setState((s) => {
              const clients = s.clients.filter((c) => c.id !== client.id)
              return { ...s, clients, currentId: clients[0]?.id ?? null }
            })
            setDialog(null)
          }}
        />
      )}
    </div>
  )
}
