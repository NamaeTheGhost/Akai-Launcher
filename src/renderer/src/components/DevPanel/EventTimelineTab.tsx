import { useEffect, useState } from 'react'
import { devTimeline, getStateTick, type TimelineEntry } from '../../context/DevToolsContext'

const TYPE_COLORS: Record<string, string> = {
  click: '#60a5fa',
  navigate: '#a78bfa',
  system: '#f59e0b',
  launch: '#34d399',
  scan: '#c8102e',
}

function EventTimelineTab(): React.JSX.Element {
  const [entries, setEntries] = useState<TimelineEntry[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      getStateTick()
      setEntries([...devTimeline.get()])
    }, 300)
    return () => clearInterval(id)
  }, [])

  // Auto-track clicks
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      const el = e.target as HTMLElement | null
      if (!el || el.closest('.dev-panel')) return
      const tag = el.tagName.toLowerCase()
      const text = el.textContent?.trim().slice(0, 40) ?? ''
      const label = text ? `${tag} "${text}"` : tag
      devTimeline.track('click', label, el.className?.split(' ')[0])
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // Auto-track route changes
  useEffect(() => {
    const handler = (): void => {
      devTimeline.track('navigate', window.location.hash || '/', 'hash change')
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          EVENT TIMELINE · {entries.length}
        </span>
        <button
          onClick={() => devTimeline.clear()}
          className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] text-[#ece6d6]/40 hover:text-[#ece6d6]/70"
        >
          CLEAR
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-4 font-mono text-[10px] text-[#ece6d6]/30">
            No events tracked.
            <br />
            <span className="text-[8px]">Clicks and navigation are auto-tracked.</span>
          </div>
        ) : (
          <ul className="relative p-2.5">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-[#ece6d6]/10" />

            {[...entries].reverse().map((e, i) => {
              const color = TYPE_COLORS[e.type] ?? '#ece6d6'
              return (
                <li key={e.id} className="relative flex gap-3 py-1.5 pl-2">
                  {/* Dot */}
                  <div className="relative z-10 mt-1">
                    <div
                      className="h-2 w-2 border"
                      style={{
                        borderColor: color,
                        backgroundColor: color,
                        borderRadius: i === 0 ? '50%' : '0',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] font-bold text-[#ece6d6]/80">
                        {e.label}
                      </span>
                      <span
                        className="font-mono text-[7px] px-1 py-0.5 border"
                        style={{ color, borderColor: color + '40' }}
                      >
                        {e.type}
                      </span>
                    </div>
                    {e.detail && (
                      <div className="mt-0.5 font-mono text-[8px] text-[#ece6d6]/30">
                        {e.detail}
                      </div>
                    )}
                    <div className="mt-0.5 flex gap-2 font-mono text-[7px] text-[#ece6d6]/15">
                      <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
                      {e.duration && <span>{e.duration}ms</span>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default EventTimelineTab
