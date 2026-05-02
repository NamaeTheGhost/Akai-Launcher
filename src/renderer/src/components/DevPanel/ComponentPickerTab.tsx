import { useCallback, useEffect, useState } from 'react'
import { useDevTools } from '../../context/DevToolsContext'

function ComponentPickerTab(): React.JSX.Element {
  const { pickMode, setPickMode, pinnedElement, highlightElement } = useDevTools()
  const [elementInfo, setElementInfo] = useState<{
    tag: string
    id: string
    classes: string[]
    text: string
    children: number
    depth: number
    ancestors: { tag: string; id: string; classes: string[] }[]
  } | null>(null)

  const analyze = useCallback(
    (el: HTMLElement | null): void => {
      if (!el) {
        setElementInfo(null)
        return
      }
      const classes = el.className && typeof el.className === 'string' ? el.className.split(' ').filter(Boolean) : []
      type Anc = { tag: string; id: string; classes: string[] }
      const ancestors: Anc[] = []
      let parent = el.parentElement
      let depth = 0
      while (parent && depth < 8) {
        const pClasses = parent.className && typeof parent.className === 'string' ? parent.className.split(' ').filter(Boolean) : []
        ancestors.push({ tag: parent.tagName.toLowerCase(), id: parent.id, classes: pClasses })
        parent = parent.parentElement
        depth++
      }
      setElementInfo({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        classes,
        text: el.textContent?.trim().slice(0, 100) ?? '',
        children: el.children.length,
        depth,
        ancestors,
      })
    },
    []
  )

  useEffect(() => {
    analyze(pinnedElement ?? highlightElement)
  }, [pinnedElement, highlightElement, analyze])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          COMPONENT PICKER
        </span>
        <button
          onClick={() => setPickMode(!pickMode)}
          className={[
            'border px-2 py-0.5 font-mono text-[8px] font-bold',
            pickMode
              ? 'bg-blue-500/20 border-blue-400 text-blue-400 animate-pulse'
              : 'bg-[#ece6d6]/5 border-[#ece6d6]/10 text-[#ece6d6]/40 hover:text-[#ece6d6]/70',
          ].join(' ')}
        >
          {pickMode ? 'PICKING...' : 'PICK MODE'}
        </button>
      </div>

      {pickMode && (
        <div className="border-b border-blue-400/20 bg-blue-500/5 px-2.5 py-1.5">
          <div className="font-mono text-[8px] text-blue-400/70">
            Click an element to inspect it
          </div>
        </div>
      )}

      {/* Element info */}
      {elementInfo ? (
        <>
          {/* Tag badge */}
          <div className="border-b border-[#ece6d6]/10 px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-[#ece6d6]/10 px-2 py-0.5 font-mono text-[12px] font-bold text-blue-400">
                &lt;{elementInfo.tag}&gt;
              </span>
              {elementInfo.id && (
                <span className="font-mono text-[9px] text-[#ece6d6]/40">
                  #{elementInfo.id}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-0.5">
              {elementInfo.classes.map((c) => (
                <span
                  key={c}
                  className="border border-[#ece6d6]/10 px-1 py-0.5 font-mono text-[7px] text-[#ece6d6]/40"
                >
                  .{c}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 border-b border-[#ece6d6]/10">
            {[
              { label: 'CHILDREN', value: elementInfo.children },
              { label: 'DEPTH', value: elementInfo.depth },
              { label: 'TEXT', value: elementInfo.text.length > 0 ? `${elementInfo.text.slice(0, 20)}...` : 'empty' },
            ].map((s) => (
              <div key={s.label} className="border-r border-[#ece6d6]/5 px-2 py-1.5 last:border-r-0">
                <div className="font-mono text-[7px] text-[#ece6d6]/30">{s.label}</div>
                <div className="font-mono text-[10px] font-bold text-[#ece6d6]/70">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Ancestors */}
          <div className="px-2.5 py-2">
            <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
              ANCESTORS
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {elementInfo.ancestors
                .slice()
                .reverse()
                .map((a, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="font-mono text-[7px] text-[#ece6d6]/30">
                      &lt;{a.tag}&gt;
                    </span>
                    {a.classes.length > 0 && (
                      <span className="font-mono text-[6px] text-[#ece6d6]/20">
                        .{a.classes[0]}
                      </span>
                    )}
                    {i < elementInfo.ancestors.length - 1 && (
                      <span className="text-[#ece6d6]/10">›</span>
                    )}
                  </div>
                ))}
              <span className="text-blue-400/60">›</span>
              <span className="font-mono text-[7px] font-bold text-blue-400">
                &lt;{elementInfo.tag}&gt;
              </span>
            </div>
          </div>

          {/* Text content */}
          {elementInfo.text ? (
            <div className="border-t border-[#ece6d6]/10 px-2.5 py-2">
              <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
                TEXT CONTENT
              </div>
              <div className="mt-1 font-mono text-[8px] text-[#ece6d6]/50 whitespace-pre-wrap">
                {elementInfo.text}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-6 text-center">
          <div className="font-mono text-[10px] text-[#ece6d6]/30">
            {pickMode
              ? 'Click an element on screen'
              : 'Enable PICK MODE to start'}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComponentPickerTab
