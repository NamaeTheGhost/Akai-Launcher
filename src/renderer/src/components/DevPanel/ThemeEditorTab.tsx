import { useEffect, useState } from 'react'
import { getThemeTokens, getStateTick, type ThemeToken } from '../../context/DevToolsContext'

function ThemeEditorTab(): React.JSX.Element {
  const [tokens, setTokens] = useState<ThemeToken[]>([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      getStateTick()
      setTokens(getThemeTokens())
    }, 500)
    return () => clearInterval(id)
  }, [])

  const filtered = filter
    ? tokens.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()))
    : tokens

  const updateToken = (name: string, value: string): void => {
    document.documentElement.style.setProperty(name, value)
    setTokens(getThemeTokens())
  }

  const copyAll = (): void => {
    const css = tokens
      .map((t) => `  ${t.name}: ${t.value};`)
      .join('\n')
    navigator.clipboard.writeText(`:root {\n${css}\n}`)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          THEME TOKENS · {tokens.length}
        </span>
        <button
          onClick={copyAll}
          className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] text-[#ece6d6]/40 hover:text-[#ece6d6]/70"
        >
          COPY CSS
        </button>
      </div>

      {/* Filter */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filter token..."
          className="w-full bg-[#0a0a0a] border border-[#ece6d6]/10 px-1.5 py-0.5 font-mono text-[8px] text-[#ece6d6]/70 placeholder:text-[#ece6d6]/20 focus:border-vermillion focus:outline-none"
        />
      </div>

      {/* Tokens */}
      <ul>
        {filtered.map((t) => (
          <li
            key={t.name}
            className="border-b border-[#ece6d6]/5 px-2.5 py-2"
          >
            <div className="flex items-center gap-2">
              {/* Color preview */}
              {t.category === 'color' ? (
                <div
                  className="h-5 w-5 border border-[#ece6d6]/20 shrink-0"
                  style={{ backgroundColor: t.value }}
                />
              ) : (
                <div className="h-5 w-5 border border-[#ece6d6]/10 shrink-0 flex items-center justify-center">
                  <span className="text-[8px] text-[#ece6d6]/30">Aa</span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="font-mono text-[8px] font-bold text-[#ece6d6]/60">
                  {t.name}
                </div>
                <input
                  value={t.value}
                  onChange={(e) => updateToken(t.name, e.target.value)}
                  className="mt-0.5 w-full bg-[#0a0a0a] border border-[#ece6d6]/10 px-1.5 py-0.5 font-mono text-[8px] text-[#ece6d6]/80 focus:border-vermillion focus:outline-none"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ThemeEditorTab
