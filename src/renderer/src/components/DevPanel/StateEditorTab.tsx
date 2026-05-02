import { useEffect, useState } from 'react'
import { useDevTools, getStateEntries, getStateTick, type StateEntry } from '../../context/DevToolsContext'

function StateEditorTab(): React.JSX.Element {
  const { setMutableState } = useDevTools()
  const [states, setStates] = useState<StateEntry[]>([])
  const [editValue, setEditValue] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      getStateTick()
      setStates([...getStateEntries()])
    }, 250)
    return () => clearInterval(id)
  }, [])

  const handleApply = (id: string, type: string): void => {
    const raw = editValue[id]
    if (raw === undefined) return
    try {
      let parsed: unknown
      switch (type) {
        case 'boolean':
          parsed = raw === 'true'
          break
        case 'number':
          parsed = Number(raw)
          break
        default:
          try {
            parsed = JSON.parse(raw)
          } catch {
            parsed = raw
          }
      }
      setMutableState(id, parsed)
      setEditing(null)
    } catch {
      // ignore
    }
  }

  const getType = (v: unknown): string => {
    if (v === null) return 'null'
    if (v === undefined) return 'undefined'
    return typeof v
  }

  const formatEdit = (entry: StateEntry): string => {
    const existing = editValue[entry.id]
    if (existing !== undefined) return existing
    try {
      return JSON.stringify(entry.value)
    } catch {
      return String(entry.value)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-1.5 font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
        STATE EDITOR · {states.length} TRACKED
      </div>
      {states.length === 0 ? (
        <div className="p-4 font-mono text-[10px] text-[#ece6d6]/30">
          No tracked states.
          <br />
          <span className="text-[8px]">Use useDevState() to register values.</span>
        </div>
      ) : (
        <ul>
          {states.map((s) => {
            const type = getType(s.value)
            const isEditing = editing === s.id
            return (
              <li
                key={s.id}
                className="border-b border-[#ece6d6]/5 px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[9px] font-bold text-[#ece6d6]/70">
                      {s.name}
                    </span>
                    <span className="ml-1.5 font-mono text-[7px] text-[#ece6d6]/20">
                      [{type}]
                    </span>
                    <div className="mt-0.5 font-mono text-[8px] text-[#ece6d6]/50 truncate">
                      {typeof s.value === 'object'
                        ? JSON.stringify(s.value).slice(0, 60)
                        : String(s.value)}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        value={formatEdit(s)}
                        onChange={(e) =>
                          setEditValue((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleApply(s.id, type)
                          if (e.key === 'Escape') setEditing(null)
                        }}
                        className="w-28 bg-[#0a0a0a] border border-vermillion px-1.5 py-0.5 font-mono text-[8px] text-[#ece6d6] focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleApply(s.id, type)}
                        className="border border-vermillion bg-vermillion/20 px-1.5 py-0.5 font-mono text-[7px] font-bold text-vermillion"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(s.id)
                        setEditValue((prev) => ({ ...prev, [s.id]: formatEdit(s) }))
                      }}
                      className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] text-[#ece6d6]/40 hover:text-[#ece6d6]/70 shrink-0"
                    >
                      EDIT
                    </button>
                  )}
                </div>
                {s.value !== s.prevValue && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-vermillion" />
                    <span className="font-mono text-[7px] text-vermillion/60">
                      prev: {typeof s.prevValue === 'object' ? JSON.stringify(s.prevValue).slice(0, 40) : String(s.prevValue)}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default StateEditorTab
