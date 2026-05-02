import { useEffect, type ReactNode } from 'react'

interface ModalShellProps {
  title: string
  jp?: string
  kanji?: string
  onClose: () => void
  children: ReactNode
  width?: string
}

function ModalShell({
  title,
  jp,
  kanji,
  onClose,
  children,
  width = 'max-w-[600px]'
}: ModalShellProps): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/60"
      />
      <div
        className={[
          'relative flex max-h-[88vh] w-full flex-col border-[3px] border-ink bg-bone shadow-[8px_8px_0_0_rgba(10,10,10,0.85)]',
          width
        ].join(' ')}
      >
        <header className="flex items-stretch border-b-[3px] border-ink bg-ink text-bone">
          <div className="flex items-center gap-3 px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em]">
            <span className="inline-block h-2 w-2 bg-vermillion" />
            <span>{title}</span>
            {jp ? <span className="font-jp tracking-[0.2em] text-bone/70">{jp}</span> : null}
          </div>
          {kanji ? (
            <div className="ml-auto flex items-center border-l-[3px] border-bone px-4 font-jp-serif text-[22px] font-black">
              {kanji}
            </div>
          ) : (
            <div className="ml-auto" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
          >
            <span>CLOSE</span>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M1 1 L11 11 M11 1 L1 11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </header>
        <div className="scrollbar-brutal flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default ModalShell
