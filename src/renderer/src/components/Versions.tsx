import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  const items: { label: string; jp: string; value: string }[] = [
    { label: 'ELECTRON', jp: '電子', value: versions.electron ?? '—' },
    { label: 'CHROMIUM', jp: '色金', value: versions.chrome ?? '—' },
    { label: 'NODE', jp: '節点', value: versions.node ?? '—' }
  ]

  return (
    <ul className="grid grid-cols-1 gap-0 border-[3px] border-ink sm:grid-cols-3">
      {items.map((it, i) => (
        <li
          key={it.label}
          className={[
            'flex flex-col gap-1 bg-bone p-4 font-mono',
            i !== items.length - 1
              ? 'border-b-[3px] border-ink sm:border-b-0 sm:border-r-[3px]'
              : ''
          ].join(' ')}
        >
          <div className="flex items-center justify-between text-[10px] tracking-[0.3em] text-ink/60">
            <span>{it.label}</span>
            <span className="font-jp text-[11px] tracking-[0.2em]">{it.jp}</span>
          </div>
          <div className="font-sans text-[20px] font-black tracking-tight text-ink">
            v{it.value}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default Versions
