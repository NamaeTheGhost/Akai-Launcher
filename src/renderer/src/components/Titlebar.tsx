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
    <div className="drag flex h-10 select-none items-stretch border-b-[3px] border-ink bg-bone font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
      {/* LEFT — Brand block */}
      <div className="flex items-stretch">
        <div className="flex h-full w-10 items-center justify-center bg-ink text-bone">
          <span className="font-jp text-base font-black leading-none">名</span>
        </div>
        <div className="flex items-center gap-3 border-r-[3px] border-ink px-4">
          <span className="font-bold tracking-[0.32em]">NAMAETYPE</span>
          <span className="text-[10px] text-ink/50">/</span>
          <span className="font-jp text-[12px] font-bold tracking-[0.2em]">ナマエタイプ</span>
        </div>
      </div>

      {/* CENTER — Status strip */}
      <div className="flex flex-1 items-center justify-center gap-6 px-4 text-ink/70">
        <span className="hidden items-center gap-2 md:flex">
          <span className="inline-block h-2 w-2 bg-vermillion" />
          <span>SYS_OK</span>
        </span>
        <span className="hidden md:inline">v1.0.0</span>
        <span className="hidden md:inline">·</span>
        <span className="hidden md:inline">{clock}</span>
      </div>

      {/* RIGHT — Window controls */}
      <div className="no-drag flex items-stretch border-l-[3px] border-ink">
        <TitlebarButton
          label="MIN"
          ariaLabel="Minimize"
          onClick={() => window.api.window.minimize()}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="6" width="10" height="2" fill="currentColor" />
          </svg>
        </TitlebarButton>
        <TitlebarButton
          label={maximized ? 'RST' : 'MAX'}
          ariaLabel={maximized ? 'Restore' : 'Maximize'}
          onClick={() => window.api.window.toggleMaximize()}
        >
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
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
            <svg width="12" height="12" viewBox="0 0 12 12">
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
          label="EXT"
          ariaLabel="Close"
          danger
          onClick={() => window.api.window.close()}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
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
  label,
  ariaLabel,
  onClick,
  children,
  danger
}: {
  label: string
  ariaLabel: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}): React.JSX.Element {
  const base =
    'flex h-full w-14 items-center justify-center gap-1.5 border-r-[3px] border-ink last:border-r-0 transition-colors'
  const tone = danger ? 'hover:bg-vermillion hover:text-bone' : 'hover:bg-ink hover:text-bone'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${base} ${tone} brutal-focus`}
    >
      <span className="flex items-center justify-center">{children}</span>
      <span className="hidden text-[9px] font-bold lg:inline">{label}</span>
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
