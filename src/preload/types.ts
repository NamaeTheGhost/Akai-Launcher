export type PlatformId =
  | 'steam'
  | 'epic'
  | 'gog'
  | 'ubisoft'
  | 'ea'
  | 'origin'
  | 'battlenet'
  | 'riot'
  | 'xbox'
  | 'custom'

export interface Game {
  id: string
  platformId: PlatformId
  name: string
  installDir?: string
  installPath?: string
  sizeBytes?: number
  launchUri?: string
  launchExe?: string
  appId?: string
  jp?: string
  category?: string
  notes?: string
  custom?: boolean
}

export interface Platform {
  id: PlatformId
  name: string
  jp: string
  kanji: string
  installed: boolean
  installPath?: string
  launcherExe?: string
  launchUri?: string
  scannedAt: number
  error?: string
  games: Game[]
}

export interface ScanResult {
  scannedAt: number
  platform: string
  arch: string
  platforms: Platform[]
}

export interface CustomGame {
  id: string
  name: string
  jp?: string
  category?: string
  installPath?: string
  exePath?: string
  launchUri?: string
  notes?: string
  addedAt: number
  updatedAt: number
}

export interface Collection {
  id: string
  name: string
  jp?: string
  kanji?: string
  description?: string
  gameIds: string[]
  createdAt: number
  updatedAt: number
}

export interface LibraryState {
  customGames: CustomGame[]
  collections: Collection[]
  version: number
}

export interface AddCustomGameInput {
  name: string
  jp?: string
  category?: string
  installPath?: string
  exePath?: string
  launchUri?: string
  notes?: string
}

export type UpdateCustomGameInput = Partial<AddCustomGameInput>

export interface AddCollectionInput {
  name: string
  jp?: string
  kanji?: string
  description?: string
  gameIds?: string[]
}

export type UpdateCollectionInput = Partial<AddCollectionInput>

export interface PickFileOptions {
  title?: string
  directory?: boolean
  filters?: { name: string; extensions: string[] }[]
}

export interface WindowAPI {
  minimize: () => void
  toggleMaximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizeStateChange: (callback: (maximized: boolean) => void) => () => void
}

export interface LaunchGameInput {
  id: string
  name: string
  platformId: PlatformId
  jp?: string
  installPath?: string
  launchExe?: string
  launchUri?: string
}

export interface Session extends LaunchGameInput {
  startedAt: number
}

export interface SessionState {
  current: Session | null
  recent: Session[]
}

export interface LauncherAPI {
  scanPlatforms: () => Promise<ScanResult>
  openUri: (uri: string) => Promise<boolean>
  openPath: (target: string) => Promise<string>
  showInFolder: (target: string) => Promise<boolean>
  launchGame: (game: LaunchGameInput) => Promise<boolean>
}

export interface SessionAPI {
  get: () => Promise<SessionState>
  end: () => Promise<SessionState>
  kill: () => Promise<boolean>
  returnToLauncher: () => Promise<boolean>
  onUpdate: (cb: (state: SessionState) => void) => () => void
}

export interface OverlayAPI {
  show: () => Promise<boolean>
  hide: () => Promise<boolean>
  toggle: () => Promise<boolean>
  getShortcut: () => Promise<string>
  isOverlayWindow: () => boolean
}

export interface LibraryAPI {
  get: () => Promise<LibraryState>
  addCustomGame: (input: AddCustomGameInput) => Promise<LibraryState>
  updateCustomGame: (id: string, patch: UpdateCustomGameInput) => Promise<LibraryState>
  removeCustomGame: (id: string) => Promise<LibraryState>
  addCollection: (input: AddCollectionInput) => Promise<LibraryState>
  updateCollection: (id: string, patch: UpdateCollectionInput) => Promise<LibraryState>
  removeCollection: (id: string) => Promise<LibraryState>
  addGameToCollection: (collectionId: string, gameId: string) => Promise<LibraryState>
  removeGameFromCollection: (collectionId: string, gameId: string) => Promise<LibraryState>
  pickFile: (opts?: PickFileOptions) => Promise<string | null>
}

export interface AppAPI {
  window: WindowAPI
  launcher: LauncherAPI
  library: LibraryAPI
  session: SessionAPI
  overlay: OverlayAPI
}
