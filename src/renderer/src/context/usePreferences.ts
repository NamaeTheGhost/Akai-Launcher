import { useContext } from 'react'
import { PreferencesCtx, type PreferencesState } from './preferencesValue'

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesCtx)
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>')
  return ctx
}
