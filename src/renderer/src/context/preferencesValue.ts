import { createContext } from 'react'

export type ThemeMode = 'PAPER' | 'INK'
export type DensityMode = 'COMPACT' | 'NORMAL' | 'WIDE'

export interface Preferences {
  displayName: string
  theme: ThemeMode
  density: DensityMode
  showJp: boolean
  notifications: boolean
  autoLaunch: boolean
}

export const DEFAULT_PREFS: Preferences = {
  displayName: '',
  theme: 'PAPER',
  density: 'NORMAL',
  showJp: true,
  notifications: true,
  autoLaunch: false
}

export interface PreferencesState extends Preferences {
  ready: boolean
  setDisplayName: (v: string) => void
  setTheme: (v: ThemeMode) => void
  toggleTheme: () => void
  setDensity: (v: DensityMode) => void
  setShowJp: (v: boolean) => void
  toggleShowJp: () => void
  setNotifications: (v: boolean) => void
  setAutoLaunch: (v: boolean) => void
  reset: () => void
}

export const PreferencesCtx = createContext<PreferencesState | null>(null)

export const PREFS_STORAGE_KEY = 'namaetype.prefs.v1'
