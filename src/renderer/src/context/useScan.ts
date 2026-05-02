import { useContext } from 'react'
import { ScanCtx, type ScanState } from './scanContextValue'

export function useScan(): ScanState {
  const ctx = useContext(ScanCtx)
  if (!ctx) throw new Error('useScan must be used inside <ScanProvider>')
  return ctx
}
