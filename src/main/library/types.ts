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
