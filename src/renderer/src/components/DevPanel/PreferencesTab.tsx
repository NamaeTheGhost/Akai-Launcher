import { useEffect, useState } from 'react'
import { PREFS_STORAGE_KEY, DEFAULT_PREFS, type Preferences } from '../../context/preferencesValue'
import { devLog } from '../../context/DevToolsContext'

function PreferencesTab(): React.JSX.Element {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS)
  const [raw, setRaw] = useState('')

  const load = (): void => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY)
      const p = stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
      setPrefs(p)
      setRaw(stored ?? 'null')
    } catch {
      setPrefs(DEFAULT_PREFS)
      setRaw('parse error')
    }
  }

  useEffect(() => load(), [])

  const update = (key: keyof Preferences, value: unknown): void => {
    const next = { ...prefs, [key]: value }
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next))
    setPrefs(next)
    devLog.info(`prefs.${key} = ${JSON.stringify(value)}`)
    window.location.reload()
  }

  const reset = (): void => {
    localStorage.removeItem(PREFS_STORAGE_KEY)
    setPrefs(DEFAULT_PREFS)
    devLog.warn('Preferences reset to defaults')
    window.location.reload()
  }

  const exportJSON = (): void => {
    const blob = new Blob([JSON.stringify(prefs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'akai-prefs.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          PREFERENCES
        </span>
        <div className="flex gap-1">
          <button
            onClick={exportJSON}
            className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] text-[#ece6d6]/40 hover:text-[#ece6d6]/70"
          >
            EXPORT
          </button>
          <button
            onClick={reset}
            className="border border-vermillion/30 bg-vermillion/5 px-1.5 py-0.5 font-mono text-[7px] text-vermillion/60 hover:text-vermillion"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Key-value pairs */}
      <ul>
        {(Object.entries(prefs) as [keyof Preferences, unknown][]).map(([key, value]) => (
          <li
            key={key}
            className="border-b border-[#ece6d6]/5 px-2.5 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] font-bold text-[#ece6d6]/60">
                {key}
              </span>
              {typeof value === 'boolean' ? (
                <button
                  onClick={() => update(key, !value)}
                  className={[
                    'border px-2 py-0.5 font-mono text-[8px] font-bold',
                    value
                      ? 'bg-vermillion/20 border-vermillion/40 text-vermillion'
                      : 'bg-[#ece6d6]/5 border-[#ece6d6]/10 text-[#ece6d6]/30',
                  ].join(' ')}
                >
                  {value ? 'ON' : 'OFF'}
                </button>
              ) : typeof value === 'string' ? (
                <input
                  value={value}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-32 bg-[#0a0a0a] border border-[#ece6d6]/10 px-1.5 py-0.5 font-mono text-[8px] text-[#ece6d6]/80 focus:border-vermillion focus:outline-none"
                />
              ) : (
                <span className="font-mono text-[8px] text-[#ece6d6]/50">
                  {String(value)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Raw JSON */}
      <div className="border-t border-[#ece6d6]/10 px-2.5 py-2">
        <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
          RAW STORAGE
        </div>
        <pre className="mt-1 max-h-24 overflow-y-auto font-mono text-[7px] text-[#ece6d6]/40 scrollbar-dev">
          {raw}
        </pre>
      </div>
    </div>
  )
}

export default PreferencesTab
