import { useEffect, useState } from 'react'
import { useDevTools, getComponentTree } from '../../context/DevToolsContext'
import type { ComponentNode } from '../../context/DevToolsContext'

function ComponentTreeTab(): React.JSX.Element {
  const { selectedComponentId, setSelectedComponentId } = useDevTools()
  const [tree, setTree] = useState<ComponentNode[]>([])

  useEffect(() => {
    const id = setInterval(() => setTree([...getComponentTree()]), 500)
    return () => clearInterval(id)
  }, [])

  const selected = tree.find((n) => n.id === selectedComponentId)

  return (
    <div className="flex flex-col">
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-1.5 font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
        COMPONENT TREE · {tree.length} NODES
      </div>
      <div className="flex gap-0">
        {/* Tree list */}
        <div className="flex-1 border-r border-[#ece6d6]/10">
          {tree.length === 0 ? (
            <div className="p-4 font-mono text-[10px] text-[#ece6d6]/30">
              No components registered.
              <br />
              <span className="text-[8px]">Use useDevState to track values.</span>
            </div>
          ) : (
            <ul>
              {tree.map((node) => (
                <li key={node.id}>
                  <button
                    onClick={() =>
                      setSelectedComponentId(
                        selectedComponentId === node.id ? null : node.id
                      )
                    }
                    className={[
                      'flex w-full items-center gap-1.5 border-b border-[#ece6d6]/5 px-2 py-1 font-mono text-[9px] text-left transition-colors',
                      selectedComponentId === node.id
                        ? 'bg-vermillion/30 text-[#ece6d6]'
                        : 'text-[#ece6d6]/60 hover:bg-[#ece6d6]/5',
                    ].join(' ')}
                  >
                    <span className="text-[8px] text-[#ece6d6]/20">&lt;</span>
                    <span className="font-semibold">{node.name}</span>
                    <span className="text-[8px] text-[#ece6d6]/20">/&gt;</span>
                    <span className="ml-auto text-[8px] text-[#ece6d6]/20">
                      {Object.keys(node.props).length} props
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Props detail */}
        {selected ? (
          <div className="w-44 bg-[#0a0a0a]/40">
            <div className="border-b border-[#ece6d6]/10 px-2 py-1 font-mono text-[8px] font-bold tracking-[0.15em] text-vermillion">
              PROPS
            </div>
            <div className="p-2">
              {Object.keys(selected.props).length === 0 ? (
                <div className="font-mono text-[9px] text-[#ece6d6]/30">No props</div>
              ) : (
                <dl className="space-y-1.5">
                  {Object.entries(selected.props).map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[8px] font-bold text-[#ece6d6]/50">
                        {k}
                      </dt>
                      <dd className="font-mono text-[9px] text-[#ece6d6]/80">
                        {formatValue(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function formatValue(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'function') return '[fn]'
  if (Array.isArray(v)) return `[${v.length}]`
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60)
  return String(v)
}

export default ComponentTreeTab
