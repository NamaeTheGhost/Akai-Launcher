import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_PREFS,
  PreferencesCtx,
  PREFS_STORAGE_KEY,
  type DensityMode,
  type Preferences,
  type ThemeMode
} from './preferencesValue'

function loadInitial(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      // Guard against invalid persisted enums
      theme: parsed.theme === 'INK' ? 'INK' : 'PAPER',
      density: parsed.density === 'COMPACT' || parsed.density === 'WIDE' ? parsed.density : 'NORMAL'
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function applyBodyClasses(prefs: Preferences): void {
  if (typeof document === 'undefined') return
  const body = document.body
  body.classList.toggle('theme-ink', prefs.theme === 'INK')
  body.classList.toggle('theme-paper', prefs.theme === 'PAPER')
  body.classList.toggle('hide-jp', !prefs.showJp)
  body.classList.remove('density-compact', 'density-normal', 'density-wide')
  body.classList.add(`density-${prefs.density.toLowerCase()}`)
}

function PreferencesProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [prefs, setPrefs] = useState<Preferences>(loadInitial)
  const [ready, setReady] = useState(false)
  const firstApply = useRef(false)

  // Apply body classes on every prefs change (and on first mount).
  useEffect(() => {
    applyBodyClasses(prefs)
    if (!firstApply.current) {
      firstApply.current = true
      setReady(true)
    }
  }, [prefs])

  // Persist on change (skip pre-ready in case loadInitial threw).
  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // ignore quota/unavailable
    }
  }, [prefs, ready])

  // Cross-window sync (main launcher <-> overlay share localStorage)
  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key !== PREFS_STORAGE_KEY || !e.newValue) return
      try {
        const next = JSON.parse(e.newValue) as Preferences
        setPrefs((prev) => ({ ...prev, ...next }))
      } catch {
        // ignore
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setDisplayName = useCallback((v: string) => setPrefs((p) => ({ ...p, displayName: v })), [])
  const setTheme = useCallback((v: ThemeMode) => setPrefs((p) => ({ ...p, theme: v })), [])
  const toggleTheme = useCallback(
    () => setPrefs((p) => ({ ...p, theme: p.theme === 'PAPER' ? 'INK' : 'PAPER' })),
    []
  )
  const setDensity = useCallback((v: DensityMode) => setPrefs((p) => ({ ...p, density: v })), [])
  const setShowJp = useCallback((v: boolean) => setPrefs((p) => ({ ...p, showJp: v })), [])
  const toggleShowJp = useCallback(() => setPrefs((p) => ({ ...p, showJp: !p.showJp })), [])
  const setNotifications = useCallback(
    (v: boolean) => setPrefs((p) => ({ ...p, notifications: v })),
    []
  )
  const setAutoLaunch = useCallback((v: boolean) => setPrefs((p) => ({ ...p, autoLaunch: v })), [])
  const reset = useCallback(() => setPrefs(DEFAULT_PREFS), [])

  const value = useMemo(
    () => ({
      ...prefs,
      ready,
      setDisplayName,
      setTheme,
      toggleTheme,
      setDensity,
      setShowJp,
      toggleShowJp,
      setNotifications,
      setAutoLaunch,
      reset
    }),
    [
      prefs,
      ready,
      setDisplayName,
      setTheme,
      toggleTheme,
      setDensity,
      setShowJp,
      toggleShowJp,
      setNotifications,
      setAutoLaunch,
      reset
    ]
  )

  return <PreferencesCtx.Provider value={value}>{children}</PreferencesCtx.Provider>
}

export { PreferencesProvider }
