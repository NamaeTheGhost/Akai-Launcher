import { useEffect, useState } from 'react'
import { useSession } from '../hooks/useSession'
import { PLATFORM_META } from '../lib/platformMeta'
import type { Session } from '@preload/types'

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

function OverlayApp(): React.JSX.Element {
  const { current, recent } = useSession()
  const [shortcut, setShortcut] = useState('Shift+Alt+L')

  useEffect(() => {
    window.api.overlay
      .getShortcut()
      .then((s) => setShortcut(s))
      .catch(() => undefined)
  }, [])

  return (
    <div className="flex h-full w-full items-stretch justify-center p-3">
      <Panel
        current={current}
        recent={recent.filter((r) => r.id !== current?.id).slice(0, 5)}
        shortcut={shortcut}
      />
    </div>
  )
}

function Panel({
  current,
  recent,
  shortcut
}: {
  current: Session | null
  recent: Session[]
  shortcut: string
}): React.JSX.Element {
  return (
    <div className="bg-paper-grain relative flex h-full w-full flex-col border-[3px] border-ink bg-bone shadow-[6px_6px_0_0_rgba(10,10,10,0.85)]">
      <Header />
      <CurrentSection current={current} />
      <ActionsSection current={current} />
      <RecentSection recent={recent} hasCurrent={!!current} />
      <Footer shortcut={shortcut} />
    </div>
  )
}

function Header(): React.JSX.Element {
  return (
    <header className="drag flex items-stretch border-b-[3px] border-ink bg-ink text-bone">
      <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.3em]">
        <span className="font-jp-serif text-[18px] leading-none">名</span>
        <span>OVERLAY</span>
        <span className="font-jp tracking-[0.2em] text-bone/65">浮上</span>
      </div>
      <div className="ml-auto flex items-stretch">
        <button
          type="button"
          onClick={() => void window.api.overlay.hide()}
          className="brutal-focus no-drag flex items-center gap-2 border-l-[3px] border-bone px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
          title="Hide overlay"
        >
          <span>HIDE</span>
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M1 1 L11 11 M11 1 L1 11"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}

function CurrentSection({ current }: { current: Session | null }): React.JSX.Element {
  const now = useNow(1000)
  const elapsed = current ? formatElapsed(now - current.startedAt) : '00:00'
  const meta = current ? PLATFORM_META[current.platformId] : null

  if (!current) {
    return (
      <div className="border-b-[3px] border-ink bg-bone p-4">
        <div className="flex items-center gap-3">
          <span className="font-jp-serif text-[44px] font-black leading-none text-ink/30">無</span>
          <div>
            <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ink/60">
              NO SESSION
            </div>
            <div className="font-jp text-[11px] tracking-[0.2em] text-ink/45">未進行</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b-[3px] border-ink bg-bone">
      <div className="grid grid-cols-12 gap-0">
        <div className="col-span-4 flex flex-col items-center justify-center border-r-[3px] border-ink bg-ink p-3 text-bone">
          <span className="font-jp-serif text-[56px] font-black leading-none">
            {meta?.kanji ?? '?'}
          </span>
          <span className="mt-1 font-mono text-[8px] font-bold tracking-[0.3em] text-bone/70">
            {meta?.name ?? current.platformId.toUpperCase()}
          </span>
        </div>
        <div className="col-span-8 flex flex-col gap-1 p-3">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-blink bg-vermillion" />
            <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-vermillion">
              PLAYING
            </span>
            <span className="font-jp text-[11px] tracking-[0.2em] text-ink/55">進行中</span>
          </div>
          <h2 className="line-clamp-2 font-sans text-[18px] font-black leading-tight tracking-tight">
            {current.name}
          </h2>
          {current.jp ? (
            <div className="font-jp-serif text-[12px] font-bold tracking-[0.1em] text-ink/65">
              {current.jp}
            </div>
          ) : null}
          <div className="mt-1 flex items-center gap-2 font-mono text-[14px] font-black tracking-tight">
            <span className="inline-block h-1.5 w-1.5 bg-ink" />
            <span>{elapsed}</span>
            <span className="text-[9px] font-bold tracking-[0.3em] text-ink/55">
              ELAPSED · 経過
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionsSection({ current }: { current: Session | null }): React.JSX.Element {
  const reveal = (): void => {
    if (!current) return
    const target = current.launchExe || current.installPath
    if (target) void window.api.launcher.showInFolder(target)
  }
  const openDir = (): void => {
    if (!current?.installPath) return
    void window.api.launcher.openPath(current.installPath)
  }
  const copyUri = async (): Promise<void> => {
    if (!current) return
    const v = current.launchUri || current.launchExe || current.installPath || ''
    if (!v) return
    try {
      await navigator.clipboard.writeText(v)
    } catch {
      // ignore
    }
  }
  const closeGame = async (): Promise<void> => {
    const ok = await window.api.session.kill()
    if (!ok) {
      // Fallback: at least drop the session locally so UI updates.
      await window.api.session.end()
    }
  }

  return (
    <div className="grid grid-cols-2 gap-0 border-b-[3px] border-ink">
      <ActionButton
        primary
        label="RETURN"
        jp="戻"
        onClick={() => void window.api.session.returnToLauncher()}
      />
      <ActionButton
        label="CLOSE GAME"
        jp="終了"
        disabled={!current}
        danger
        onClick={() => void closeGame()}
      />
      <ActionButton label="REVEAL" jp="表示" disabled={!current} onClick={reveal} border="top" />
      <ActionButton
        label="OPEN DIR"
        jp="開く"
        disabled={!current?.installPath}
        onClick={openDir}
        border="top"
      />
      <ActionButton
        label="COPY LAUNCH"
        jp="複写"
        disabled={!current}
        onClick={() => void copyUri()}
        border="top"
        wide
      />
    </div>
  )
}

function ActionButton({
  label,
  jp,
  onClick,
  disabled,
  primary,
  danger,
  border,
  wide
}: {
  label: string
  jp: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
  danger?: boolean
  border?: 'top'
  wide?: boolean
}): React.JSX.Element {
  const tone = danger
    ? 'bg-bone text-ink hover:bg-vermillion hover:text-bone'
    : primary
      ? 'bg-ink text-bone hover:bg-vermillion'
      : 'bg-bone text-ink hover:bg-ink hover:text-bone'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'brutal-focus flex items-center justify-center gap-2 px-3 py-2 font-mono text-[10px] font-bold tracking-[0.3em] transition-colors disabled:opacity-35',
        wide ? 'col-span-2' : '',
        border === 'top' ? 'border-t-[2px] border-ink' : '',
        '[&:nth-child(odd)]:border-r-[2px] [&:nth-child(odd)]:border-ink',
        tone
      ].join(' ')}
    >
      <span>{label}</span>
      <span className="font-jp text-[12px] tracking-normal">{jp}</span>
    </button>
  )
}

function RecentSection({
  recent,
  hasCurrent
}: {
  recent: Session[]
  hasCurrent: boolean
}): React.JSX.Element {
  return (
    <div className="scrollbar-brutal flex-1 overflow-y-auto border-b-[3px] border-ink">
      <div className="flex items-center justify-between bg-ink/[0.04] px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.3em] text-ink/65">
        <span>RECENT</span>
        <span className="font-jp text-[11px] tracking-[0.2em]">最近</span>
      </div>
      {recent.length === 0 ? (
        <div className="px-3 py-3 font-mono text-[10px] tracking-[0.25em] text-ink/45">
          {hasCurrent ? 'NOTHING ELSE YET · 他なし' : 'NO HISTORY · 履歴なし'}
        </div>
      ) : (
        <ul>
          {recent.map((s) => (
            <RecentRow key={`${s.id}-${s.startedAt}`} session={s} />
          ))}
        </ul>
      )}
    </div>
  )
}

function RecentRow({ session }: { session: Session }): React.JSX.Element {
  const meta = PLATFORM_META[session.platformId]
  const onLaunch = async (): Promise<void> => {
    await window.api.launcher.launchGame({
      id: session.id,
      name: session.name,
      platformId: session.platformId,
      jp: session.jp,
      installPath: session.installPath,
      launchExe: session.launchExe,
      launchUri: session.launchUri
    })
  }
  const now = useNow(60000)
  const ago = now - session.startedAt
  const min = Math.floor(ago / 60000)
  const elapsed =
    min < 1
      ? 'now'
      : min < 60
        ? `${min}m`
        : min < 60 * 24
          ? `${Math.floor(min / 60)}h`
          : `${Math.floor(min / (60 * 24))}d`
  return (
    <li className="flex items-stretch border-t-[2px] border-ink first:border-t-0">
      <button
        type="button"
        onClick={() => void onLaunch()}
        className="brutal-focus flex flex-1 items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-ink hover:text-bone"
        title="Launch again"
      >
        <span className="font-jp-serif text-[20px] font-black leading-none">
          {meta?.kanji ?? '?'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-[12px] font-black tracking-tight">
            {session.name}
          </span>
          <span className="font-mono text-[9px] tracking-[0.25em] opacity-60">
            {meta?.name ?? session.platformId.toUpperCase()} · {elapsed}
          </span>
        </span>
        <span className="font-mono text-[9px] font-bold tracking-[0.25em] opacity-70">RUN ▸</span>
      </button>
    </li>
  )
}

function Footer({ shortcut }: { shortcut: string }): React.JSX.Element {
  return (
    <footer className="flex items-center justify-between bg-ink px-3 py-1.5 font-mono text-[9px] tracking-[0.3em] text-bone/70">
      <span>
        TOGGLE · <span className="text-bone">{shortcut}</span>
      </span>
      <span className="font-jp tracking-[0.2em]">浮上 · 名前</span>
    </footer>
  )
}

export default OverlayApp
