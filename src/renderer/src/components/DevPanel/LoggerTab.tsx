import { useEffect, useState, useRef } from 'react'
import { devLog, type LogEntry, type LogLevel } from '../../context/DevToolsContext'
import { getStateTick } from '../../context/DevToolsContext'

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: '#60a5fa',
  warn: '#f59e0b',
  error: '#ef4444',
  debug: '#6b7280',
}

const LEVEL_ICONS: Record<LogLevel, string> = {
  info: 'ℹ',
  warn: '⚠',
  error: '✕',
  debug: '·',
}

function LoggerTab(): React.JSX.Element {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoScroll = useRef(true)

  useEffect(() => {
    const id = setInterval(() => {
      getStateTick()
      setLogs([...devLog.get()])
    }, 300)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (autoScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs.length])

  const filtered = logs.filter((l) => {
    if (filter !== 'all' && l.level !== filter) return false
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    info: logs.filter((l) => l.level === 'info').length,
    warn: logs.filter((l) => l.level === 'warn').length,
    error: logs.filter((l) => l.level === 'error').length,
    debug: logs.filter((l) => l.level === 'debug').length,
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          LOGGER · {logs.length}
        </span>
        <button
          onClick={() => devLog.clear()}
          className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] text-[#ece6d6]/40 hover:text-[#ece6d6]/70"
        >
          CLEAR
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 border-b border-[#ece6d6]/10 px-2 py-1.5">
        <div className="flex gap-0.5">
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setFilter(lv)}
              className={[
                'border px-1.5 py-0.5 font-mono text-[7px] font-bold',
                filter === lv
                  ? 'bg-[#ece6d6]/15 border-[#ece6d6]/20 text-[#ece6d6]'
                  : 'border-transparent text-[#ece6d6]/30 hover:text-[#ece6d6]/60',
              ].join(' ')}
            >
              {lv === 'all' ? `ALL ${logs.length}` : `${LEVEL_ICONS[lv]} ${counts[lv]}`}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search..."
          className="ml-auto w-20 bg-[#0a0a0a] border border-[#ece6d6]/10 px-1 py-0.5 font-mono text-[7px] text-[#ece6d6]/70 placeholder:text-[#ece6d6]/20 focus:border-vermillion focus:outline-none"
        />
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 font-mono text-[10px] text-[#ece6d6]/30">
            No logs. Use devLog.info() / warn() / error()
          </div>
        ) : (
          <ul>
            {filtered.map((l) => (
              <li
                key={l.id}
                className="border-b border-[#ece6d6]/5 px-2 py-1 hover:bg-[#ece6d6]/3"
              >
                <div className="flex items-start gap-1.5">
                  <span
                    className="mt-0.5 text-[10px]"
                    style={{ color: LEVEL_COLORS[l.level] }}
                  >
                    {LEVEL_ICONS[l.level]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[9px] text-[#ece6d6]/80">
                      {l.message}
                    </div>
                    {l.data != null && (
                      <pre className="mt-0.5 font-mono text-[7px] text-[#ece6d6]/40 overflow-x-auto">
                        {typeof l.data === 'object'
                          ? JSON.stringify(l.data).slice(0, 120)
                          : String(l.data)}
                      </pre>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="font-mono text-[7px] text-[#ece6d6]/20">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-mono text-[6px] text-[#ece6d6]/15">
                      {l.source}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default LoggerTab
