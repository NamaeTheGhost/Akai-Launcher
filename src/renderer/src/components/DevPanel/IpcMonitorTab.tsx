import { useEffect, useState } from 'react'
import { devIpc, getStateTick, type IpcEntry } from '../../context/DevToolsContext'

const DIR_COLORS: Record<IpcEntry['direction'], string> = {
  send: '#60a5fa',
  receive: '#34d399',
  invoke: '#a78bfa',
  handle: '#f59e0b',
}

const DIR_ICONS: Record<IpcEntry['direction'], string> = {
  send: '↑',
  receive: '↓',
  invoke: '⟳',
  handle: '→',
}

function IpcMonitorTab(): React.JSX.Element {
  const [entries, setEntries] = useState<IpcEntry[]>([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<IpcEntry | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      getStateTick()
      setEntries([...devIpc.get()])
    }, 300)
    return () => clearInterval(id)
  }, [])

  const filtered = filter
    ? entries.filter((e) => e.channel.toLowerCase().includes(filter.toLowerCase()))
    : entries

  const counts = {
    send: entries.filter((e) => e.direction === 'send').length,
    receive: entries.filter((e) => e.direction === 'receive').length,
    invoke: entries.filter((e) => e.direction === 'invoke').length,
    handle: entries.filter((e) => e.direction === 'handle').length,
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          IPC MONITOR · {entries.length}
        </span>
        <button
          onClick={() => devIpc.clear()}
          className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] text-[#ece6d6]/40 hover:text-[#ece6d6]/70"
        >
          CLEAR
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        {Object.entries(DIR_COLORS).map(([dir, color]) => (
          <span key={dir} className="font-mono text-[7px]" style={{ color }}>
            {DIR_ICONS[dir as IpcEntry['direction']]} {counts[dir as keyof typeof counts]}
          </span>
        ))}
      </div>

      {/* Filter */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter channel..."
          className="w-full bg-[#0a0a0a] border border-[#ece6d6]/10 px-1.5 py-0.5 font-mono text-[8px] text-[#ece6d6]/70 placeholder:text-[#ece6d6]/20 focus:border-vermillion focus:outline-none"
        />
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 font-mono text-[10px] text-[#ece6d6]/30">
            No IPC calls tracked. Calls are auto-monitored.
          </div>
        ) : (
          <ul>
            {filtered
              .slice()
              .reverse()
              .map((e) => (
                <li
                  key={e.id}
                  className={[
                    'cursor-pointer border-b border-[#ece6d6]/5 px-2.5 py-1.5 hover:bg-[#ece6d6]/3',
                    selected?.id === e.id ? 'bg-[#ece6d6]/5' : '',
                  ].join(' ')}
                  onClick={() => setSelected(selected?.id === e.id ? null : e)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: DIR_COLORS[e.direction] }}
                    >
                      {DIR_ICONS[e.direction]}
                    </span>
                    <span className="font-mono text-[9px] text-[#ece6d6]/70">
                      {e.channel}
                    </span>
                    {e.duration && (
                      <span className="ml-auto font-mono text-[7px] text-[#ece6d6]/30">
                        {e.duration}ms
                      </span>
                    )}
                    <span className="font-mono text-[7px] text-[#ece6d6]/20">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      {/* Payload detail */}
      {selected ? (
        <div className="border-t border-[#ece6d6]/10 bg-[#0a0a0a]/40 px-2.5 py-2">
          <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
            PAYLOAD
          </div>
          <pre className="mt-1 font-mono text-[8px] text-[#ece6d6]/60 overflow-x-auto whitespace-pre-wrap">
            {typeof selected.payload === 'object'
              ? JSON.stringify(selected.payload, null, 2).slice(0, 500)
              : String(selected.payload)}
          </pre>
          <div className="mt-1.5 flex gap-3 font-mono text-[7px] text-[#ece6d6]/20">
            <span>ID: {selected.id}</span>
            <span>DIR: {selected.direction}</span>
            {selected.duration && <span>DURATION: {selected.duration}ms</span>}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default IpcMonitorTab
