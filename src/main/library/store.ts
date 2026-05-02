import { app } from 'electron'
import path from 'path'
import { promises as fs } from 'fs'
import type {
  AddCollectionInput,
  AddCustomGameInput,
  Collection,
  CustomGame,
  LibraryState,
  UpdateCollectionInput,
  UpdateCustomGameInput
} from './types'

const EMPTY: LibraryState = { customGames: [], collections: [], version: 1 }

let cached: LibraryState | null = null
let writeChain: Promise<void> = Promise.resolve()

function libraryFile(): string {
  return path.join(app.getPath('userData'), 'library.json')
}

function uid(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (typeof v === 'string' && v.trim() === '') continue
    out[k] = v
  }
  return out as T
}

function sanitizeCustomGame(input: AddCustomGameInput): AddCustomGameInput {
  return clean({
    name: input.name?.trim() ?? '',
    jp: input.jp?.trim(),
    category: input.category?.trim(),
    installPath: input.installPath?.trim(),
    exePath: input.exePath?.trim(),
    launchUri: input.launchUri?.trim(),
    notes: input.notes?.trim()
  })
}

function sanitizeCollection(input: AddCollectionInput): AddCollectionInput {
  return clean({
    name: input.name?.trim() ?? '',
    jp: input.jp?.trim(),
    kanji: input.kanji?.trim().slice(0, 2),
    description: input.description?.trim(),
    gameIds: input.gameIds
  })
}

export async function loadLibrary(): Promise<LibraryState> {
  if (cached) return cached
  try {
    const text = await fs.readFile(libraryFile(), 'utf8')
    const parsed = JSON.parse(text) as Partial<LibraryState>
    cached = {
      ...EMPTY,
      ...parsed,
      customGames: Array.isArray(parsed.customGames) ? parsed.customGames : [],
      collections: Array.isArray(parsed.collections) ? parsed.collections : []
    }
    return cached
  } catch {
    cached = { ...EMPTY }
    return cached
  }
}

async function persist(state: LibraryState): Promise<LibraryState> {
  cached = state
  const file = libraryFile()
  const tmp = file + '.tmp'
  writeChain = writeChain
    .catch(() => undefined)
    .then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8')
      await fs.rename(tmp, file)
    })
  await writeChain
  return state
}

export async function addCustomGame(input: AddCustomGameInput): Promise<LibraryState> {
  const lib = await loadLibrary()
  const data = sanitizeCustomGame(input)
  if (!data.name) throw new Error('Game name is required')
  const now = Date.now()
  const game: CustomGame = {
    id: uid('custom'),
    addedAt: now,
    updatedAt: now,
    ...data,
    name: data.name
  }
  return persist({ ...lib, customGames: [...lib.customGames, game] })
}

export async function updateCustomGame(
  id: string,
  patch: UpdateCustomGameInput
): Promise<LibraryState> {
  const lib = await loadLibrary()
  const sanitized = sanitizeCustomGame({ name: '', ...patch })
  delete (sanitized as { name?: string }).name
  if (typeof patch.name === 'string' && patch.name.trim()) {
    ;(sanitized as { name?: string }).name = patch.name.trim()
  }
  const customGames = lib.customGames.map((g) =>
    g.id === id ? { ...g, ...sanitized, updatedAt: Date.now() } : g
  )
  return persist({ ...lib, customGames })
}

export async function removeCustomGame(id: string): Promise<LibraryState> {
  const lib = await loadLibrary()
  const customGames = lib.customGames.filter((g) => g.id !== id)
  const collections = lib.collections.map((c) =>
    c.gameIds.includes(id) ? { ...c, gameIds: c.gameIds.filter((g) => g !== id) } : c
  )
  return persist({ ...lib, customGames, collections })
}

export async function addCollection(input: AddCollectionInput): Promise<LibraryState> {
  const lib = await loadLibrary()
  const data = sanitizeCollection(input)
  if (!data.name) throw new Error('Collection name is required')
  const now = Date.now()
  const col: Collection = {
    id: uid('col'),
    createdAt: now,
    updatedAt: now,
    gameIds: data.gameIds ?? [],
    ...data,
    name: data.name
  }
  return persist({ ...lib, collections: [...lib.collections, col] })
}

export async function updateCollection(
  id: string,
  patch: UpdateCollectionInput
): Promise<LibraryState> {
  const lib = await loadLibrary()
  const sanitized = sanitizeCollection({ name: '', ...patch })
  delete (sanitized as { name?: string }).name
  if (typeof patch.name === 'string' && patch.name.trim()) {
    ;(sanitized as { name?: string }).name = patch.name.trim()
  }
  const collections = lib.collections.map((c) =>
    c.id === id ? { ...c, ...sanitized, updatedAt: Date.now() } : c
  )
  return persist({ ...lib, collections })
}

export async function removeCollection(id: string): Promise<LibraryState> {
  const lib = await loadLibrary()
  const collections = lib.collections.filter((c) => c.id !== id)
  return persist({ ...lib, collections })
}

export async function addGameToCollection(
  collectionId: string,
  gameId: string
): Promise<LibraryState> {
  const lib = await loadLibrary()
  const collections = lib.collections.map((c) =>
    c.id === collectionId && !c.gameIds.includes(gameId)
      ? { ...c, gameIds: [...c.gameIds, gameId], updatedAt: Date.now() }
      : c
  )
  return persist({ ...lib, collections })
}

export async function removeGameFromCollection(
  collectionId: string,
  gameId: string
): Promise<LibraryState> {
  const lib = await loadLibrary()
  const collections = lib.collections.map((c) =>
    c.id === collectionId
      ? { ...c, gameIds: c.gameIds.filter((g) => g !== gameId), updatedAt: Date.now() }
      : c
  )
  return persist({ ...lib, collections })
}

export function libraryFilePath(): string {
  return libraryFile()
}
