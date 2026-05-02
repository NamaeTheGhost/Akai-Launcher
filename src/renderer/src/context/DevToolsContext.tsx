import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ============================================================
// Types
// ============================================================

export type ComponentNode = {
  id: string
  name: string
  props: Record<string, unknown>
  children: ComponentNode[]
  depth: number
}

export type StateEntry = {
  id: string
  name: string
  value: unknown
  prevValue: unknown
  updatedAt: number
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export type LogEntry = {
  id: number
  level: LogLevel
  message: string
  data?: unknown
  timestamp: number
  source: string
}

export type IpcEntry = {
  id: number
  direction: 'send' | 'receive' | 'invoke' | 'handle'
  channel: string
  payload?: unknown
  timestamp: number
  duration?: number
}

export type TimelineEntry = {
  id: number
  type: string
  label: string
  detail?: string
  timestamp: number
  duration?: number
}

export type ThrottleState = {
  fps: number | null
  cpu: 'none' | '4x' | '8x' | '16x'
  network: 'online' | 'slow' | 'offline'
}

export type ThemeToken = {
  name: string
  value: string
  category: 'color' | 'font' | 'other'
}

export type DevPanelTab =
  | 'tree'
  | 'states'
  | 'css'
  | 'perf'
  | 'log'
  | 'edit'
  | 'ipc'
  | 'timeline'
  | 'theme'
  | 'prefs'
  | 'pick'
  | 'throttle'

// ============================================================
// Global registries
// ============================================================

let componentSeq = 0
const componentMap = new Map<string, ComponentNode>()
const stateMap = new Map<string, StateEntry>()
const mutableStateMap = new Map<string, { set: (v: unknown) => void }>()
let stateSeq = 0
let stateTick = 0

const logSeq = { current: 0 }
const logEntries: LogEntry[] = []
const MAX_LOGS = 500

const ipcSeq = { current: 0 }
const ipcEntries: IpcEntry[] = []
const MAX_IPC = 300

const timelineSeq = { current: 0 }
const timelineEntries: TimelineEntry[] = []
const MAX_TIMELINE = 300

// ============================================================
// Logger API
// ============================================================

function pushLog(level: LogLevel, message: string, data?: unknown, source = 'app'): void {
  if (logEntries.length >= MAX_LOGS) logEntries.shift()
  logEntries.push({
    id: ++logSeq.current,
    level,
    message,
    data,
    timestamp: Date.now(),
    source,
  })
  stateTick++
}

export const devLog = {
  info: (msg: string, data?: unknown) => pushLog('info', msg, data),
  warn: (msg: string, data?: unknown) => pushLog('warn', msg, data),
  error: (msg: string, data?: unknown) => pushLog('error', msg, data),
  debug: (msg: string, data?: unknown) => pushLog('debug', msg, data),
  clear: () => {
    logEntries.length = 0
    stateTick++
  },
  get: () => [...logEntries],
}

// ============================================================
// IPC Monitor
// ============================================================

function pushIpc(entry: IpcEntry): void {
  if (ipcEntries.length >= MAX_IPC) ipcEntries.shift()
  ipcEntries.push(entry)
  stateTick++
}

export const devIpc = {
  track: (channel: string, payload?: unknown, direction: IpcEntry['direction'] = 'send') => {
    pushIpc({
      id: ++ipcSeq.current,
      channel,
      payload,
      timestamp: Date.now(),
      direction,
    })
  },
  clear: () => {
    ipcEntries.length = 0
    stateTick++
  },
  get: () => [...ipcEntries],
}

// ============================================================
// Event Timeline
// ============================================================

function pushTimeline(entry: Omit<TimelineEntry, 'id'>): void {
  if (timelineEntries.length >= MAX_TIMELINE) timelineEntries.shift()
  timelineEntries.push({ ...entry, id: ++timelineSeq.current })
  stateTick++
}

export const devTimeline = {
  track: (type: string, label: string, detail?: string) => {
    pushTimeline({ type, label, detail, timestamp: Date.now() })
  },
  trackAsync: async (type: string, label: string, fn: () => Promise<void>) => {
    const start = Date.now()
    pushTimeline({ type, label, detail: 'started', timestamp: start })
    try {
      await fn()
      pushTimeline({
        type,
        label,
        detail: 'completed',
        timestamp: Date.now(),
        duration: Date.now() - start,
      })
    } catch (err) {
      pushTimeline({
        type,
        label,
        detail: `error: ${err}`,
        timestamp: Date.now(),
        duration: Date.now() - start,
      })
    }
  },
  clear: () => {
    timelineEntries.length = 0
    stateTick++
  },
  get: () => [...timelineEntries],
}

// Auto-track IPC is disabled — breaks window.api proxy
// If needed, implement with manual tracking instead

// ============================================================
// Context
// ============================================================

type DevToolsState = {
  open: boolean
  activeTab: DevPanelTab
  pinnedElement: HTMLElement | null
  selectedComponentId: string | null
  highlightElement: HTMLElement | null
  pickMode: boolean
  throttle: ThrottleState
}

interface DevToolsContextType extends DevToolsState {
  setOpen: (v: boolean) => void
  setActiveTab: (t: DevPanelTab) => void
  setPinnedElement: (el: HTMLElement | null) => void
  setSelectedComponentId: (id: string | null) => void
  setPickMode: (v: boolean) => void
  setThrottle: (t: Partial<ThrottleState>) => void
  registerComponent: (
    name: string,
    props: Record<string, unknown>,
    children?: ComponentNode[]
  ) => string
  updateComponentProps: (id: string, props: Record<string, unknown>) => void
  tick: () => void
  // State editor
  setMutableState: (id: string, value: unknown) => void
}

const Ctx = createContext<DevToolsContextType | null>(null)

export function useDevTools(): DevToolsContextType {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDevTools must be used within DevToolsProvider')
  return ctx
}

// ============================================================
// Hook: useDevState — track any value in the dev panel
// ============================================================

export function useDevState<T>(name: string, value: T): T {
  const ref = useRef<StateEntry | null>(null)
  const mutableRef = useRef(false)

  useEffect(() => {
    if (!ref.current) {
      const id = uid('s')
      ref.current = {
        id,
        name,
        value,
        prevValue: value,
        updatedAt: Date.now(),
      }
      stateMap.set(id, ref.current)
    } else {
      ref.current.prevValue = ref.current.value
      ref.current.value = value
      ref.current.updatedAt = Date.now()
      ref.current.name = name
      stateMap.set(ref.current.id, ref.current)
      stateTick++
    }
    return () => {
      if (ref.current) stateMap.delete(ref.current.id)
      if (mutableRef.current && ref.current) mutableStateMap.delete(ref.current.id)
    }
  }, [name, value])

  return value
}

// ============================================================
// Hook: useMutableDevState — editable from panel
// ============================================================

export function useMutableDevState<T>(name: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial)
  const ref = useRef<StateEntry | null>(null)
  const mutableRef = useRef(false)

  useEffect(() => {
    if (!ref.current) {
      const id = uid('s')
      ref.current = {
        id,
        name,
        value,
        prevValue: value,
        updatedAt: Date.now(),
      }
      stateMap.set(id, ref.current)
      mutableStateMap.set(id, { set: (v) => setValue(v as T) })
      mutableRef.current = true
    } else {
      ref.current.prevValue = ref.current.value
      ref.current.value = value
      ref.current.updatedAt = Date.now()
      ref.current.name = name
      stateMap.set(ref.current.id, ref.current)
      stateTick++
    }
    return () => {
      if (ref.current) {
        stateMap.delete(ref.current.id)
        mutableStateMap.delete(ref.current.id)
      }
    }
  }, [name, value])

  return [value, setValue]
}

function uid(prefix: string): string {
  if (prefix === 'c') return `c${++componentSeq}`
  return `s${++stateSeq}`
}

export function getComponentTree(): ComponentNode[] {
  return [...componentMap.values()]
}

export function getStateEntries(): StateEntry[] {
  return [...stateMap.values()]
}

export function getStateTick(): number {
  return stateTick
}

export function getThemeTokens(): ThemeToken[] {
  const cs = getComputedStyle(document.documentElement)
  const colorTokens: ThemeToken[] = []
  for (const prop of ['--color-bone', '--color-ink', '--color-vermillion', '--color-vermillion-deep', '--color-sumi', '--color-paper']) {
    colorTokens.push({
      name: prop,
      value: cs.getPropertyValue(prop).trim(),
      category: 'color',
    })
  }
  return colorTokens
}

// ============================================================
// Provider
// ============================================================

export function DevToolsProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, setState] = useState<DevToolsState>({
    open: false,
    activeTab: 'css',
    pinnedElement: null,
    selectedComponentId: null,
    highlightElement: null,
    pickMode: false,
    throttle: { fps: null, cpu: 'none', network: 'online' },
  })

  const [, rerender] = useState(0)
  const highlightElRef = useRef<HTMLElement | null>(null)

  // Ctrl+Shift+D toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setState((s) => ({ ...s, open: !s.open }))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Hover tracking for CSS inspector (throttled)
  useEffect(() => {
    if (!state.open || state.pinnedElement || (state.activeTab !== 'css' && state.activeTab !== 'pick')) return

    let currentEl: HTMLElement | null = null
    let ticking = false

    const onMove = (e: MouseEvent): void => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
        if (el && !el.closest('.dev-panel') && el !== currentEl) {
          currentEl = el
          setState((s) => (s.highlightElement === el ? s : { ...s, highlightElement: el }))
        }
      })
    }
    const onLeave = (): void => {
      currentEl = null
      setState((s) => ({ ...s, highlightElement: null }))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [state.open, state.pinnedElement, state.activeTab])

  // Highlight outline
  useEffect(() => {
    const prevEl = highlightElRef.current
    const newEl = state.highlightElement

    // Remove from old
    if (prevEl && prevEl !== newEl) {
      prevEl.style.outline = ''
      prevEl.style.outlineOffset = ''
      prevEl.style.cursor = ''
    }

    // Add to new
    if (newEl) {
      highlightElRef.current = newEl
      const isPick = state.activeTab === 'pick'
      newEl.style.outline = isPick ? '2px solid #3b82f6' : '2px solid #c8102e'
      newEl.style.outlineOffset = '1px'
      newEl.style.cursor = isPick ? 'crosshair' : ''
    } else {
      highlightElRef.current = null
    }

    return () => {
      if (newEl) {
        newEl.style.outline = ''
        newEl.style.outlineOffset = ''
        newEl.style.cursor = ''
      }
    }
  }, [state.highlightElement, state.activeTab])

  // Click handler for picker mode
  useEffect(() => {
    if (!state.pickMode) return
    const onClick = (e: MouseEvent): void => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      if (el && !el.closest('.dev-panel')) {
        e.preventDefault()
        e.stopPropagation()
        setState((s) => ({ ...s, pinnedElement: el, highlightElement: el, activeTab: 'css', pickMode: false }))
      }
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [state.pickMode])

  // Auto-track IPC (disabled by default — breaks window.api proxy if not careful)
  useEffect(() => {
    devTimeline.track('system', 'DevTools initialized')
    devLog.info('DevTools ready')
  }, [])

  // FPS throttle
  useEffect(() => {
    const fps = state.throttle.fps
    if (!fps) return
    const interval = 1000 / fps
    let last = 0
    const handler = (e: Event): void => {
      const now = Date.now()
      if (now - last < interval) {
        e.stopImmediatePropagation()
      } else {
        last = now
      }
    }
    for (const evt of ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup', 'click']) {
      window.addEventListener(evt, handler as EventListener, true)
    }
    return () => {
      for (const evt of ['mousemove', 'mousedown', 'mouseup', 'keydown', 'keyup', 'click']) {
        window.removeEventListener(evt, handler as EventListener, true)
      }
    }
  }, [state.throttle.fps])

  // CPU throttle simulation
  useEffect(() => {
    if (state.throttle.cpu === 'none') return
    const multipliers = { '4x': 4, '8x': 8, '16x': 16 }
    const m = multipliers[state.throttle.cpu]
    const origSetTimeout = window.setTimeout.bind(window)
    const newSetTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]): number =>
      origSetTimeout(fn, (ms ?? 0) * m, ...args)) as typeof window.setTimeout
    window.setTimeout = newSetTimeout
    return () => {
      window.setTimeout = origSetTimeout
    }
  }, [state.throttle.cpu])

  // Network throttle (simulate via performance API)
  useEffect(() => {
    if (state.throttle.network === 'online') return
    devLog.warn(`Network throttled: ${state.throttle.network}`)
    return () => {
      devLog.info('Network throttle removed')
    }
  }, [state.throttle.network])

  // Tick for updates
  useEffect(() => {
    const id = setInterval(() => rerender((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [])

  const setOpen = useCallback((v: boolean) => setState((s) => ({ ...s, open: v })), [])
  const setActiveTab = useCallback((t: DevPanelTab) => setState((s) => ({ ...s, activeTab: t })), [])
  const setPinnedElement = useCallback(
    (el: HTMLElement | null) => setState((s) => ({ ...s, pinnedElement: el, highlightElement: el })),
    []
  )
  const setSelectedComponentId = useCallback(
    (id: string | null) => setState((s) => ({ ...s, selectedComponentId: id })),
    []
  )
  const setPickMode = useCallback(
    (v: boolean) => setState((s) => ({ ...s, pickMode: v })),
    []
  )
  const setThrottle = useCallback(
    (t: Partial<ThrottleState>) => setState((s) => ({ ...s, throttle: { ...s.throttle, ...t } })),
    []
  )

  const registerComponent = useCallback(
    (name: string, props: Record<string, unknown>, children?: ComponentNode[]): string => {
      const id = uid('c')
      const node: ComponentNode = { id, name, props: { ...props }, children: children ?? [], depth: 0 }
      componentMap.set(id, node)
      return id
    },
    []
  )

  const updateComponentProps = useCallback((id: string, props: Record<string, unknown>) => {
    const node = componentMap.get(id)
    if (node) {
      node.props = { ...props }
      componentMap.set(id, node)
    }
  }, [])

  const tick = useCallback(() => rerender((n) => n + 1), [])

  const setMutableState = useCallback((id: string, value: unknown) => {
    const entry = mutableStateMap.get(id)
    if (entry) entry.set(value)
  }, [])

  const ctx = useMemo<DevToolsContextType>(
    () => ({
      ...state,
      setOpen,
      setActiveTab,
      setPinnedElement,
      setSelectedComponentId,
      setPickMode,
      setThrottle,
      registerComponent,
      updateComponentProps,
      tick,
      setMutableState,
    }),
    [
      state, setOpen, setActiveTab, setPinnedElement,
      setSelectedComponentId, setPickMode, setThrottle,
      registerComponent, updateComponentProps, tick,
      setMutableState,
    ]
  )

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}
