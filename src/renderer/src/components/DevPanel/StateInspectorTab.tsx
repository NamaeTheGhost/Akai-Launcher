import { useEffect, useState } from 'react'
import { getStateEntries, getStateTick, type StateEntry } from '../../context/DevToolsContext'

function StateInspectorTab(): React.JSX.Element {
  const [states, setStates] = useState<StateEntry[]>([])
  const [, forceRender] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      getStateTick()
      setStates([...getStateEntries()])
      forceRender((n) => n + 1)
    }, 250)
    return () => clearInterval(id)
  }, [])

  const filtered = filter
    ? states.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
    : states

  const toggle = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          STATES · {states.length}
        </span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter..."
          className="w-24 bg-[#0a0a0a] border border-[#ece6d6]/10 px-1.5 py-0.5 font-mono text-[8px] text-[#ece6d6]/80 placeholder:text-[#ece6d6]/20 focus:border-vermillion focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="p-4 font-mono text-[10px] text-[#ece6d6]/30">
          No tracked states.
          <br />
          <span className="text-[8px]">Wrap values with useDevState(name, value).</span>
        </div>
      ) : (
        <ul>
          {filtered.map((s) => {
            const changed = s.value !== s.prevValue
            const isExpanded = expanded.has(s.id)
            return (
              <li key={s.id} className="border-b border-[#ece6d6]/5">
                <button
                  onClick={() => toggle(s.id)}
                  className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left transition-colors hover:bg-[#ece6d6]/5"
                >
                  <span className="text-[8px] text-[#ece6d6]/30">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className="font-mono text-[9px] font-semibold text-[#ece6d6]/80">
                    {s.name}
                  </span>
                  {changed && (
                    <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-vermillion" />
                  )}
                  <span className="ml-auto font-mono text-[8px] text-[#ece6d6]/30">
                    {formatShort(s.value)}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="border-t border-[#ece6d6]/5 bg-[#0a0a0a]/30 px-2 py-2 font-mono text-[9px]">
                    <div className="space-y-1">
                      <div>
                        <span className="text-[8px] text-[#ece6d6]/30">CURRENT </span>
                        <span className="text-emerald-400">{formatValue(s.value)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#ece6d6]/30">PREVIOUS</span>
                        <span className="text-[#ece6d6]/50">{formatValue(s.prevValue)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] text-[#ece6d6]/20">
                        <span>ID: {s.id}</span>
                        <span>·</span>
                        <span>UPDATED: {new Date(s.updatedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function formatShort(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undef'
  if (typeof v === 'string') return `"${v.slice(0, 20)}${v.length > 20 ? '…' : ''}"`
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) return `[${v.length}]`
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 25)
  return String(v)
}

function formatValue(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  try {
    return JSON.stringify(v, null, 2).slice(0, 200)
  } catch {
    return String(v)
  }
}

export default StateInspectorTab
