import { useCallback, useEffect, useState, type ReactNode } from 'react'
import type {
  AddCollectionInput,
  AddCustomGameInput,
  Collection,
  CustomGame,
  Game,
  LibraryState,
  Platform,
  PlatformId,
  ScanResult,
  UpdateCollectionInput,
  UpdateCustomGameInput
} from '@preload/types'
import { ScanCtx, type ScanState } from './scanContextValue'
import { PLATFORM_META } from '../lib/platformMeta'

function customGameToGame(g: CustomGame): Game {
  return {
    id: g.id,
    platformId: 'custom',
    name: g.name,
    jp: g.jp,
    category: g.category,
    notes: g.notes,
    installPath: g.installPath,
    launchExe: g.exePath,
    launchUri: g.launchUri,
    custom: true
  }
}

function buildCustomPlatform(customGames: CustomGame[]): Platform {
  return {
    id: 'custom',
    name: PLATFORM_META.custom.name,
    jp: PLATFORM_META.custom.jp,
    kanji: PLATFORM_META.custom.kanji,
    installed: customGames.length > 0,
    scannedAt: Date.now(),
    games: customGames.map(customGameToGame)
  }
}

export function ScanProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(true)
  const [token, setToken] = useState(0)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [library, setLibrary] = useState<LibraryState>({
    customGames: [],
    collections: [],
    version: 1
  })
  const [libraryReady, setLibraryReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    window.api.launcher
      .scanPlatforms()
      .then((res) => {
        if (!cancelled) setScan(res)
      })
      .finally(() => {
        if (!cancelled) setScanning(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    let cancelled = false
    window.api.library
      .get()
      .then((lib) => {
        if (!cancelled) {
          setLibrary(lib)
          setLibraryReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLibraryReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const rescan = useCallback((): void => {
    setScanning(true)
    setToken((n) => n + 1)
  }, [])

  const selectGame = useCallback((id: string | null): void => {
    setSelectedGameId(id)
  }, [])

  const refreshLibrary = useCallback(async (): Promise<void> => {
    const lib = await window.api.library.get()
    setLibrary(lib)
  }, [])

  const addCustomGame = useCallback(async (input: AddCustomGameInput): Promise<void> => {
    const lib = await window.api.library.addCustomGame(input)
    setLibrary(lib)
  }, [])

  const updateCustomGame = useCallback(
    async (id: string, patch: UpdateCustomGameInput): Promise<void> => {
      const lib = await window.api.library.updateCustomGame(id, patch)
      setLibrary(lib)
    },
    []
  )

  const removeCustomGame = useCallback(async (id: string): Promise<void> => {
    const lib = await window.api.library.removeCustomGame(id)
    setLibrary(lib)
  }, [])

  const addCollection = useCallback(async (input: AddCollectionInput): Promise<void> => {
    const lib = await window.api.library.addCollection(input)
    setLibrary(lib)
  }, [])

  const updateCollection = useCallback(
    async (id: string, patch: UpdateCollectionInput): Promise<void> => {
      const lib = await window.api.library.updateCollection(id, patch)
      setLibrary(lib)
    },
    []
  )

  const removeCollection = useCallback(async (id: string): Promise<void> => {
    const lib = await window.api.library.removeCollection(id)
    setLibrary(lib)
  }, [])

  const addGameToCollection = useCallback(
    async (collectionId: string, gameId: string): Promise<void> => {
      const lib = await window.api.library.addGameToCollection(collectionId, gameId)
      setLibrary(lib)
    },
    []
  )

  const removeGameFromCollection = useCallback(
    async (collectionId: string, gameId: string): Promise<void> => {
      const lib = await window.api.library.removeGameFromCollection(collectionId, gameId)
      setLibrary(lib)
    },
    []
  )

  const customPlatform = buildCustomPlatform(library.customGames)
  const platforms: Platform[] = [...(scan?.platforms ?? []), customPlatform]
  const installedPlatforms = platforms.filter((p) => p.installed)
  const allGames: Game[] = platforms.flatMap((p) => p.games)
  const totalSizeBytes = allGames.reduce((acc, g) => acc + (g.sizeBytes ?? 0), 0)

  const getGame = (id: string): Game | undefined => allGames.find((g) => g.id === id)
  const getPlatform = (id: PlatformId): Platform | undefined => platforms.find((p) => p.id === id)
  const collectionsForGame = (gameId: string): Collection[] =>
    library.collections.filter((c) => c.gameIds.includes(gameId))

  const value: ScanState = {
    scan,
    scanning,
    rescan,
    platforms,
    installedPlatforms,
    allGames,
    totalSizeBytes,
    getGame,
    getPlatform,
    selectedGameId,
    selectGame,
    customGames: library.customGames,
    collections: library.collections,
    libraryReady,
    refreshLibrary,
    addCustomGame,
    updateCustomGame,
    removeCustomGame,
    addCollection,
    updateCollection,
    removeCollection,
    addGameToCollection,
    removeGameFromCollection,
    collectionsForGame
  }

  return <ScanCtx.Provider value={value}>{children}</ScanCtx.Provider>
}
