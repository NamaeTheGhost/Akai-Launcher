import { useCallback, useEffect, useState } from 'react'
import { useDevTools } from '../../context/DevToolsContext'

type CssInfo = {
  tagName: string
  id: string
  className: string
  textContent: string
  computed: Record<string, string>
  box: {
    width: number
    height: number
    paddingTop: string
    paddingRight: string
    paddingBottom: string
    paddingLeft: string
    marginTop: string
    marginRight: string
    marginBottom: string
    marginLeft: string
    borderTopWidth: string
    borderRightWidth: string
    borderBottomWidth: string
    borderLeftWidth: string
  } | null
}

const KEY_CSS_PROPS = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'padding',
  'margin',
  'background-color',
  'background',
  'color',
  'border',
  'border-radius',
  'font-size',
  'font-weight',
  'font-family',
  'opacity',
  'overflow',
  'z-index',
  'transform',
  'transition',
  'box-shadow',
  'flex-direction',
  'justify-content',
  'align-items',
  'gap',
]

function CssInspectorTab(): React.JSX.Element {
  const { pinnedElement, highlightElement, setPinnedElement } = useDevTools()
  const [cssInfo, setCssInfo] = useState<CssInfo | null>(null)
  const [propFilter, setPropFilter] = useState('')

  const inspect = useCallback(
    (el: HTMLElement | null) => {
      if (!el) {
        setCssInfo(null)
        return
      }
      const cs = window.getComputedStyle(el)
      const computed: Record<string, string> = {}
      for (const prop of KEY_CSS_PROPS) {
        computed[prop] = cs.getPropertyValue(prop)
      }
      setCssInfo({
        tagName: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        textContent: el.textContent?.trim().slice(0, 80) ?? '',
        computed,
        box: {
          width: el.offsetWidth,
          height: el.offsetHeight,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          marginTop: cs.marginTop,
          marginRight: cs.marginRight,
          marginBottom: cs.marginBottom,
          marginLeft: cs.marginLeft,
          borderTopWidth: cs.borderTopWidth,
          borderRightWidth: cs.borderRightWidth,
          borderBottomWidth: cs.borderBottomWidth,
          borderLeftWidth: cs.borderLeftWidth,
        },
      })
    },
    []
  )

  useEffect(() => {
    inspect(pinnedElement ?? highlightElement)
  }, [pinnedElement, highlightElement, inspect])

  const handlePin = (): void => {
    const target = highlightElement
    if (target) setPinnedElement(target)
  }

  const handleUnpin = (): void => {
    setPinnedElement(null)
  }

  const filteredProps = propFilter
    ? Object.entries(cssInfo?.computed ?? {}).filter(([k]) =>
        k.toLowerCase().includes(propFilter.toLowerCase())
      )
    : Object.entries(cssInfo?.computed ?? {})

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          CSS INSPECTOR
        </span>
        <div className="flex items-center gap-1">
          {pinnedElement ? (
            <button
              onClick={handleUnpin}
              className="border border-vermillion/50 bg-vermillion/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-vermillion hover:bg-vermillion/20"
            >
              UNPIN
            </button>
          ) : (
            <button
              onClick={handlePin}
              disabled={!highlightElement}
              className="border border-[#ece6d6]/10 bg-[#ece6d6]/5 px-1.5 py-0.5 font-mono text-[7px] font-bold text-[#ece6d6]/40 hover:text-[#ece6d6]/70 disabled:opacity-20"
            >
              PIN
            </button>
          )}
        </div>
      </div>

      {/* Element info */}
      {cssInfo ? (
        <>
          <div className="border-b border-[#ece6d6]/10 px-2.5 py-2">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="rounded bg-[#ece6d6]/10 px-1.5 py-0.5 text-[10px] font-bold text-vermillion">
                &lt;{cssInfo.tagName}&gt;
              </span>
              {cssInfo.id ? (
                <span className="text-[9px] text-[#ece6d6]/40">#{cssInfo.id}</span>
              ) : null}
            </div>
            {cssInfo.className && typeof cssInfo.className === 'string' ? (
              <div className="mt-1 flex flex-wrap gap-0.5">
                {cssInfo.className.split(' ').filter(Boolean).map((c) => (
                  <span
                    key={c}
                    className="border border-[#ece6d6]/10 px-1 py-0.5 font-mono text-[7px] text-[#ece6d6]/50"
                  >
                    .{c}
                  </span>
                ))}
              </div>
            ) : null}
            {cssInfo.textContent ? (
              <div className="mt-1 font-mono text-[8px] text-[#ece6d6]/30">
                "{cssInfo.textContent}"
              </div>
            ) : null}
          </div>

          {/* Box model */}
          {cssInfo.box ? (
            <div className="border-b border-[#ece6d6]/10 px-2.5 py-2">
              <div className="font-mono text-[8px] font-bold tracking-[0.15em] text-[#ece6d6]/30">
                BOX MODEL
              </div>
              <div className="mt-1.5 flex items-center justify-center">
                <div className="border border-[#ece6d6]/10 px-2 py-1.5">
                  {/* Margin */}
                  <div className="border border-orange-500/30 px-1.5 py-1">
                    <span className="font-mono text-[7px] text-orange-400/60">margin</span>
                    {/* Border */}
                    <div className="border border-yellow-500/40 px-1.5 py-1">
                      <span className="font-mono text-[7px] text-yellow-400/60">border</span>
                      {/* Padding */}
                      <div className="border border-green-500/30 px-1.5 py-1">
                        <span className="font-mono text-[7px] text-green-400/60">padding</span>
                        {/* Content */}
                        <div className="border border-blue-500/40 px-3 py-1 text-center">
                          <span className="font-mono text-[10px] font-bold text-blue-400">
                            {cssInfo.box.width} × {cssInfo.box.height}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-x-2 gap-y-0.5 font-mono text-[7px] text-[#ece6d6]/40">
                <span>P {cssInfo.box.paddingTop}</span>
                <span>M {cssInfo.box.marginTop}</span>
                <span>B {cssInfo.box.borderTopWidth}</span>
                <span></span>
              </div>
            </div>
          ) : null}

          {/* Properties */}
          <div className="px-2.5 py-1.5">
            <div className="mb-1.5 flex items-center gap-1">
              <span className="font-mono text-[8px] font-bold tracking-[0.15em] text-[#ece6d6]/30">
                PROPERTIES
              </span>
              <input
                value={propFilter}
                onChange={(e) => setPropFilter(e.target.value)}
                placeholder="filter..."
                className="ml-auto w-20 bg-[#0a0a0a] border border-[#ece6d6]/10 px-1 py-0.5 font-mono text-[7px] text-[#ece6d6]/70 placeholder:text-[#ece6d6]/20 focus:border-vermillion focus:outline-none"
              />
            </div>
            <dl>
              {filteredProps.map(([prop, value]) => (
                <div
                  key={prop}
                  className="flex items-baseline gap-1.5 border-b border-[#ece6d6]/5 py-1"
                >
                  <dt className="w-28 shrink-0 font-mono text-[8px] font-bold text-[#ece6d6]/50">
                    {prop}
                  </dt>
                  <dd className="min-w-0 truncate font-mono text-[8px] text-[#ece6d6]/80">
                    <span className="text-vermillion/80">{value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <div className="font-mono text-[10px] text-[#ece6d6]/30">
            Hover an element to inspect
          </div>
          <div className="font-mono text-[8px] text-[#ece6d6]/20">
            Red outline shows selected element
          </div>
        </div>
      )}
    </div>
  )
}

export default CssInspectorTab
