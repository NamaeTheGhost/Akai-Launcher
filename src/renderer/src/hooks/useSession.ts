import { useEffect, useState } from 'react'
import type { SessionState } from '@preload/types'

const EMPTY: SessionState = { current: null, recent: [] }

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>(EMPTY)

  useEffect(() => {
    let cancelled = false
    window.api.session
      .get()
      .then((s) => {
        if (!cancelled) setState(s)
      })
      .catch(() => undefined)
    const off = window.api.session.onUpdate((s) => {
      if (!cancelled) setState(s)
    })
    return () => {
      cancelled = true
      off()
    }
  }, [])

  return state
}
