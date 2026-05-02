import { useEffect, useState } from 'react'

function Titlebar(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)
  const [clock, setClock] = useState<string>(formatClock())

  useEffect(() => {
    let cancelled = false
    void window.api.window.isMaximized().then((m) => {
      if (!cancelled) setMaximized(m)
    })
    const off = window.api.window.onMaximizeStateChange((m) => setMaximized(m))
    return () => {
      cancelled = true
      off()
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClock()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="drag flex h-8 select-none items-stretch border-b border-ink/20 bg-bone font-mono text-[10px] uppercase tracking-[0.15em] text-ink">
      {/* LEFT — Brand */}
      <div className="flex items-stretch">
        <div className="flex h-full w-8 items-center justify-center bg-ink text-bone">
          <span className="font-jp text-sm font-semibold leading-none">赤</span>
        </div>
        <div className="flex items-center gap-2 border-r border-ink/20 px-3">
          <span className="font-semibold tracking-[0.2em]">AKAI</span>
          <span className="text-[9px] text-ink/30">·</span>
          <span className="hidden text-[9px] text-ink/40 md:inline">v1.0.0</span>
        </div>
      </div>

      {/* CENTER — Clock */}
      <div className="flex flex-1 items-center justify-center text-ink/50">
        <span className="hidden md:inline">{clock}</span>
      </div>

      {/* RIGHT — Window controls */}
      <div className="no-drag flex items-stretch border-l border-ink/20">
        <TitlebarButton
          ariaLabel="Minimize"
          onClick={() => window.api.window.minimize()}
        >
          <svg width="10" height="10" viewBox="0 0 12 12">
            <rect x="1" y="6" width="10" height="2" fill="currentColor" />
          </svg>
        </TitlebarButton>
        <TitlebarButton
          ariaLabel={maximized ? 'Restore' : 'Maximize'}
          onClick={() => window.api.window.toggleMaximize()}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 12 12">
              <rect
                x="1"
                y="3"
                width="7"
                height="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect
                x="3.5"
                y="0.75"
                width="7"
                height="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 12 12">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </TitlebarButton>
        <TitlebarButton
          ariaLabel="Close"
          danger
          onClick={() => window.api.window.close()}
        >
          <svg width="10" height="10" viewBox="0 0 12 12">
            <path
              d="M1 1 L11 11 M11 1 L1 11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            />
          </svg>
        </TitlebarButton>
      </div>
    </div>
  )
}

function TitlebarButton({
  ariaLabel,
  onClick,
  children,
  danger
}: {
  ariaLabel: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}): React.JSX.Element {
  const base =
    'flex h-full w-10 items-center justify-center transition-colors'
  const tone = danger ? 'hover:bg-vermillion hover:text-bone' : 'hover:bg-ink/10'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${base} ${tone}`}
    >
      {children}
    </button>
  )
}

function formatClock(): string {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export default Titlebar
