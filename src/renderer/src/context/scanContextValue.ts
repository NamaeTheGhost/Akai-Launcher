import { createContext } from 'react'
import type {
  AddCollectionInput,
  AddCustomGameInput,
  Collection,
  CustomGame,
  Game,
  Platform,
  PlatformId,
  ScanResult,
  UpdateCollectionInput,
  UpdateCustomGameInput
} from '@preload/types'

export interface ScanState {
  scan: ScanResult | null
  scanning: boolean
  rescan: () => void
  platforms: Platform[]
  installedPlatforms: Platform[]
  allGames: Game[]
  totalSizeBytes: number
  getGame: (id: string) => Game | undefined
  getPlatform: (id: PlatformId) => Platform | undefined
  selectedGameId: string | null
  selectGame: (id: string | null) => void

  customGames: CustomGame[]
  collections: Collection[]
  libraryReady: boolean
  refreshLibrary: () => Promise<void>
  addCustomGame: (input: AddCustomGameInput) => Promise<void>
  updateCustomGame: (id: string, patch: UpdateCustomGameInput) => Promise<void>
  removeCustomGame: (id: string) => Promise<void>
  addCollection: (input: AddCollectionInput) => Promise<void>
  updateCollection: (id: string, patch: UpdateCollectionInput) => Promise<void>
  removeCollection: (id: string) => Promise<void>
  addGameToCollection: (collectionId: string, gameId: string) => Promise<void>
  removeGameFromCollection: (collectionId: string, gameId: string) => Promise<void>
  collectionsForGame: (gameId: string) => Collection[]
}

export const ScanCtx = createContext<ScanState | null>(null)
