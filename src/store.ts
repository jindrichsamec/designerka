import { useEffect, useState } from 'react'
import type { Measures, ShapeId } from './data/body'
import type { CustomColor } from './data/looks'
import type { Outfit } from './data/outfit'
import type { Preference, StyleId } from './data/style'

/** Where the face sits in the photo: centre (0–1 of width/height) and zoom. */
export type Crop = { u: number; v: number; zoom: number }

/** Everything decided about a client on the way to her capsule wardrobe. */
export type Profile = {
  shape: ShapeId | null
  measures: Measures
  season: string | null // id from template.json seasons
  neutrals: string[] // up to 3 hex colours
  accents: string[] // up to 3 hex colours
  styles: StyleId[]
  elements: Record<string, Preference> // missing = no opinion
  pieceColors: Record<string, string> // capsule slot id -> hand-picked colour
}

export const EMPTY_PROFILE: Profile = {
  shape: null,
  measures: { bust: null, waist: null, hips: null },
  season: null,
  neutrals: [],
  accents: [],
  styles: [],
  elements: {},
  pieceColors: {},
}

export type Client = {
  id: string
  name: string
  crop: Crop
  favorites: string[]
  photoVersion: number // 0 = no photo yet; bumped on every upload
  profile: Profile
  outfits: Outfit[]
  /** What the figure is wearing right now; `id` is set while a saved outfit is being edited. */
  draft: Draft
}

export type Draft = { id: string | null; pieces: string[] }

export const EMPTY_DRAFT: Draft = { id: null, pieces: [] }

export type State = {
  clients: Client[]
  currentId: string | null
  custom: CustomColor[]
}

export const DEFAULT_CROP: Crop = { u: 0.5, v: 0.45, zoom: 1.2 }

const KEY = 'designerka:v1'

// crypto.randomUUID needs a secure context; the app is served over plain http on the LAN.
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export function loadState(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const state = JSON.parse(raw) as State
      // clients saved by earlier versions lack the fields added since
      state.clients = state.clients.map((c) => ({
        ...c,
        profile: { ...EMPTY_PROFILE, ...c.profile },
        outfits: c.outfits ?? [],
        draft: c.draft ?? EMPTY_DRAFT,
      }))
      return state
    }
  } catch {
    // corrupted or unavailable storage: start clean
  }
  return { clients: [], currentId: null, custom: [] }
}

export function saveState(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full/blocked: the session still works, it just won't persist
  }
}

// --- photo blobs live in IndexedDB (too big for localStorage) ---

const DB = 'designerka'
const STORE = 'photos'

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  const d = await db()
  return new Promise<T>((resolve, reject) => {
    const req = run(d.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Safari's private mode refuses Blobs in IndexedDB, so photos are stored as raw bytes.
type StoredPhoto = { data: ArrayBuffer; type: string }

export async function putPhoto(clientId: string, blob: Blob) {
  // read the bytes first: awaiting inside a transaction would let it auto-commit
  const record: StoredPhoto = { data: await blob.arrayBuffer(), type: blob.type }
  await tx('readwrite', (s) => s.put(record, clientId))
}
export const deletePhoto = (clientId: string) => tx('readwrite', (s) => s.delete(clientId))
async function getPhoto(clientId: string): Promise<Blob | undefined> {
  const stored = await tx<Blob | StoredPhoto | undefined>('readonly', (s) => s.get(clientId))
  // photos saved by earlier versions are plain Blobs
  if (!stored || stored instanceof Blob) return stored
  return new Blob([stored.data], { type: stored.type })
}

export type Photo = { url: string; aspect: number }

/** Object URL + aspect ratio of the client's photo; null while loading or when absent. */
export function usePhoto(client: Client | null): Photo | null {
  const [loaded, setLoaded] = useState<(Photo & { key: string }) | null>(null)
  const id = client?.id
  const key = id && client.photoVersion ? `${id}:${client.photoVersion}` : null

  useEffect(() => {
    if (!id || !key) return
    let cancelled = false
    let url: string | null = null
    getPhoto(id)
      .then(async (blob) => {
        if (!blob || cancelled) return
        const bitmap = await createImageBitmap(blob)
        const aspect = bitmap.width / bitmap.height
        bitmap.close()
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setLoaded({ key, url, aspect })
      })
      .catch(() => {
        // unreadable blob: figures fall back to the placeholder silhouette
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, key])

  // A photo loaded for another client/version is stale, never shown.
  return loaded && loaded.key === key ? loaded : null
}

const MAX_SIDE = 1600

/** Decode an uploaded file and shrink it so dozens of on-screen copies stay fast. */
export async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.92),
  )
}
