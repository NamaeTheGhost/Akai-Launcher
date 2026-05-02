import { useEffect, useState } from 'react'
import { useScan } from '../context/useScan'
import { PLATFORM_META } from '../lib/platformMeta'
import CustomGameModal from './CustomGameModal'
import ConfirmDialog from './ConfirmDialog'
import type { Collection, Game, Platform } from '@preload/types'

function GameDetails(): React.JSX.Element | null {
  const { selectedGameId, selectGame, getGame, getPlatform } = useScan()
  const game = selectedGameId ? getGame(selectedGameId) : undefined
  const platform = game ? getPlatform(game.platformId) : undefined

  useEffect(() => {
    if (!selectedGameId) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') selectGame(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedGameId, selectGame])

  if (!game) return null

  const meta = PLATFORM_META[game.platformId]

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close details"
        onClick={() => selectGame(null)}
        className="flex-1 cursor-default bg-ink/55"
      />
      <div className="w-full max-w-[640px] border-l-[3px] border-ink bg-bone shadow-[ -8px_0_0_0_rgba(10,10,10,0.18)]">
        <DetailsBody game={game} platform={platform} meta={meta} />
      </div>
    </div>
  )
}

function DetailsBody({
  game,
  platform,
  meta
}: {
  game: Game
  platform: Platform | undefined
  meta: { name: string; jp: string; kanji: string }
}): React.JSX.Element {
  const {
    selectGame,
    customGames,
    collections,
    collectionsForGame,
    addGameToCollection,
    removeGameFromCollection,
    removeCustomGame
  } = useScan()
  const [busy, setBusy] = useState<'launch' | 'open' | 'reveal' | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false)

  const customGame = game.custom ? (customGames.find((g) => g.id === game.id) ?? null) : null
  const inCollections = collectionsForGame(game.id)

  const launch = async (): Promise<void> => {
    setBusy('launch')
    try {
      await window.api.launcher.launchGame({
        id: game.id,
        name: game.name,
        platformId: game.platformId,
        jp: game.jp,
        installPath: game.installPath,
        launchExe: game.launchExe,
        launchUri: game.launchUri
      })
    } finally {
      setBusy(null)
    }
  }

  const openInstallDir = async (): Promise<void> => {
    if (!game.installPath) return
    setBusy('open')
    try {
      await window.api.launcher.openPath(game.installPath)
    } finally {
      setBusy(null)
    }
  }

  const reveal = async (): Promise<void> => {
    const target = game.launchExe || game.installPath
    if (!target) return
    setBusy('reveal')
    try {
      await window.api.launcher.showInFolder(target)
    } finally {
      setBusy(null)
    }
  }

  const copy = async (label: string, value: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1400)
    } catch {
      // ignore
    }
  }

  const sizeLabel = formatBytes(game.sizeBytes)
  const canLaunch = !!(game.launchUri || game.launchExe || game.installPath)
  const canOpenDir = !!game.installPath
  const canReveal = !!(game.launchExe || game.installPath)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-stretch border-b-[3px] border-ink bg-ink text-bone">
        <div className="flex items-center gap-3 px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em]">
          <span className="inline-block h-2 w-2 bg-vermillion" />
          <span>DETAILS</span>
          <span className="font-jp tracking-[0.2em]">詳細</span>
        </div>
        <div className="ml-auto flex items-stretch">
          {customGame ? (
            <>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
              >
                <span>EDIT</span>
                <span className="font-jp text-[12px] tracking-normal">編</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
              >
                <span>DELETE</span>
                <span className="font-jp text-[12px] tracking-normal">削</span>
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => selectGame(null)}
            className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
          >
            <span>CLOSE</span>
            <span className="font-jp text-[12px] tracking-normal">閉</span>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
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

      <div className="grid grid-cols-12 border-b-[3px] border-ink">
        <div className="col-span-4 border-r-[3px] border-ink bg-bone">
          <div className="relative flex aspect-[4/5] flex-col justify-end overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-x-0 top-1/3 h-px bg-ink/15" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-ink/15" />
              <div className="absolute inset-y-0 left-1/3 w-px bg-ink/15" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-ink/15" />
            </div>
            <span className="font-jp-serif absolute -bottom-6 left-2 text-[220px] font-black leading-none text-ink">
              {meta.kanji}
            </span>
            <div className="absolute right-3 top-3 h-8 w-8 bg-vermillion" />
            <div className="absolute right-3 bottom-3 border-[3px] border-ink bg-bone px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.25em]">
              {meta.name.split(' ')[0]}
            </div>
          </div>
        </div>
        <div className="col-span-8 flex flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="border-[2px] border-ink px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.3em]">
              {meta.name}
            </span>
            <span className="font-jp text-[11px] tracking-[0.2em] text-ink/65">{meta.jp}</span>
            {game.custom ? (
              <span className="border-[2px] border-vermillion bg-vermillion px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.3em] text-bone">
                CUSTOM
              </span>
            ) : null}
          </div>
          <h2 className="font-sans text-[34px] font-black leading-[0.95] tracking-[-0.03em]">
            {game.name}
          </h2>
          {game.jp ? (
            <div className="font-jp-serif text-[18px] font-bold tracking-[0.1em] text-ink/65">
              {game.jp}
            </div>
          ) : null}
          {game.installDir ? (
            <div className="font-mono text-[11px] tracking-[0.2em] text-ink/55">
              {game.installDir}
            </div>
          ) : null}
          <dl className="mt-2 grid grid-cols-3 gap-0 border-t-[2px] border-ink">
            <Stat label="SIZE" jp="容量" value={sizeLabel} />
            <Stat
              label={game.custom ? 'CATEGORY' : 'APP ID'}
              jp={game.custom ? '分類' : '識別'}
              value={game.custom ? (game.category ?? '—') : (game.appId ?? '—')}
              mono={!game.custom}
            />
            <Stat
              label="STATUS"
              jp="状態"
              value={platform?.installed ? 'READY' : 'OFFLINE'}
              accent
              last
            />
          </dl>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch border-b-[3px] border-ink">
        <ActionButton
          primary
          onClick={launch}
          disabled={!canLaunch || busy !== null}
          loading={busy === 'launch'}
          label="LAUNCH"
          jp="起動"
          icon={<Arrow />}
        />
        <ActionButton
          onClick={openInstallDir}
          disabled={!canOpenDir || busy !== null}
          loading={busy === 'open'}
          label="OPEN DIR"
          jp="開く"
        />
        <ActionButton
          onClick={reveal}
          disabled={!canReveal || busy !== null}
          loading={busy === 'reveal'}
          label="REVEAL"
          jp="表示"
        />
      </div>

      <div className="scrollbar-brutal flex-1 overflow-y-auto">
        <CollectionsSection
          inCollections={inCollections}
          allCollections={collections}
          pickerOpen={collectionPickerOpen}
          onTogglePicker={() => setCollectionPickerOpen((v) => !v)}
          onAdd={(cid) => {
            void addGameToCollection(cid, game.id)
            setCollectionPickerOpen(false)
          }}
          onRemove={(cid) => void removeGameFromCollection(cid, game.id)}
        />

        {game.notes ? (
          <FieldRow
            label="NOTES"
            jp="覚書"
            value={game.notes}
            onCopy={(v) => copy('NOTES', v)}
            copied={copied === 'NOTES'}
          />
        ) : null}
        <FieldRow
          label="INSTALL PATH"
          jp="設置場所"
          value={game.installPath}
          onCopy={(v) => copy('INSTALL PATH', v)}
          copied={copied === 'INSTALL PATH'}
        />
        <FieldRow
          label="EXECUTABLE"
          jp="実行体"
          value={game.launchExe}
          onCopy={(v) => copy('EXECUTABLE', v)}
          copied={copied === 'EXECUTABLE'}
        />
        <FieldRow
          label="LAUNCH URI"
          jp="起動URI"
          value={game.launchUri}
          mono
          onCopy={(v) => copy('LAUNCH URI', v)}
          copied={copied === 'LAUNCH URI'}
        />
        <FieldRow
          label="PLATFORM PATH"
          jp="基幹"
          value={platform?.installPath}
          onCopy={platform?.installPath ? (v) => copy('PLATFORM PATH', v) : undefined}
          copied={copied === 'PLATFORM PATH'}
        />
        <FieldRow
          label="GAME ID"
          jp="識別子"
          value={game.id}
          mono
          onCopy={(v) => copy('GAME ID', v)}
          copied={copied === 'GAME ID'}
        />
      </div>

      <footer className="border-t-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-bone/70">
        <div className="flex items-center justify-between">
          <span>{copied ? `COPIED · ${copied}` : 'ESC TO CLOSE · 押逃'}</span>
          <span className="font-jp tracking-[0.2em]">{game.platformId.toUpperCase()}</span>
        </div>
      </footer>

      <CustomGameModal open={editOpen} editing={customGame} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title="DELETE GAME"
        jp="削除"
        destructive
        message="Remove this custom game from your library? This will also remove it from any collection it belongs to."
        confirmLabel="DELETE"
        onConfirm={() => {
          void removeCustomGame(game.id).then(() => selectGame(null))
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function CollectionsSection({
  inCollections,
  allCollections,
  pickerOpen,
  onTogglePicker,
  onAdd,
  onRemove
}: {
  inCollections: Collection[]
  allCollections: Collection[]
  pickerOpen: boolean
  onTogglePicker: () => void
  onAdd: (cid: string) => void
  onRemove: (cid: string) => void
}): React.JSX.Element {
  const inIds = new Set(inCollections.map((c) => c.id))
  const available = allCollections.filter((c) => !inIds.has(c.id))
  return (
    <div className="border-b-[2px] border-ink">
      <div className="flex items-center justify-between border-b-[2px] border-ink bg-ink/[0.04] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
            COLLECTIONS
          </span>
          <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">集</span>
        </div>
        <button
          type="button"
          onClick={onTogglePicker}
          disabled={available.length === 0 && allCollections.length > 0}
          className="brutal-focus flex items-center gap-2 border-[2px] border-ink bg-bone px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors hover:bg-ink hover:text-bone disabled:opacity-40"
        >
          <span>{pickerOpen ? 'CLOSE' : '+ ADD'}</span>
          <span className="font-jp text-[11px] tracking-normal">追</span>
        </button>
      </div>

      {pickerOpen ? (
        <div className="border-b-[2px] border-ink bg-bone p-3">
          {allCollections.length === 0 ? (
            <div className="font-mono text-[11px] tracking-[0.25em] text-ink/55">
              NO COLLECTIONS YET · CREATE ONE FROM THE LIBRARY PAGE.
            </div>
          ) : available.length === 0 ? (
            <div className="font-mono text-[11px] tracking-[0.25em] text-ink/55">
              ALREADY IN ALL COLLECTIONS · 全集合所属
            </div>
          ) : (
            <ul className="flex flex-wrap gap-0">
              {available.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(c.id)}
                    className="brutal-focus -ml-[2px] flex items-center gap-2 border-[2px] border-ink bg-bone px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.2em] transition-colors first:ml-0 hover:bg-ink hover:text-bone"
                  >
                    <span className="font-jp-serif text-[14px]">{c.kanji?.trim() || '集'}</span>
                    <span>{c.name.toUpperCase()}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="px-4 py-3">
        {inCollections.length === 0 ? (
          <div className="font-mono text-[11px] tracking-[0.25em] text-ink/45">
            NOT IN ANY COLLECTION · 所属なし
          </div>
        ) : (
          <ul className="flex flex-wrap gap-0">
            {inCollections.map((c) => (
              <li key={c.id} className="-ml-[2px] first:ml-0">
                <span className="brutal-focus inline-flex items-center gap-2 border-[2px] border-ink bg-ink px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.2em] text-bone">
                  <span className="font-jp-serif text-[14px]">{c.kanji?.trim() || '集'}</span>
                  <span>{c.name.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(c.id)}
                    className="brutal-focus -mr-1 ml-1 px-1 text-bone/70 hover:text-vermillion"
                    aria-label={`Remove from ${c.name}`}
                    title="Remove from collection"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  jp,
  value,
  mono,
  accent,
  last
}: {
  label: string
  jp: string
  value: string
  mono?: boolean
  accent?: boolean
  last?: boolean
}): React.JSX.Element {
  return (
    <div
      className={['flex flex-col gap-1 px-3 py-3', last ? '' : 'border-r-[2px] border-ink'].join(
        ' '
      )}
    >
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.3em] text-ink/55">
        <span>{label}</span>
        <span className="font-jp text-[10px] tracking-[0.2em]">{jp}</span>
      </div>
      <div
        className={[
          'truncate text-[13px] font-black tracking-tight',
          mono ? 'font-mono text-[12px]' : 'font-sans',
          accent ? 'text-vermillion' : 'text-ink'
        ].join(' ')}
        title={value}
      >
        {value}
      </div>
    </div>
  )
}

function ActionButton({
  primary,
  label,
  jp,
  onClick,
  disabled,
  loading,
  icon
}: {
  primary?: boolean
  label: string
  jp: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
}): React.JSX.Element {
  const tone = primary
    ? 'bg-ink text-bone hover:bg-vermillion'
    : 'bg-bone text-ink hover:bg-ink hover:text-bone'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'brutal-focus flex flex-1 items-center justify-center gap-2 border-r-[3px] border-ink px-4 py-3 font-mono text-[11px] font-bold tracking-[0.3em] transition-colors last:border-r-0 disabled:opacity-40',
        tone
      ].join(' ')}
    >
      <span>{loading ? '…' : label}</span>
      <span className="font-jp text-[12px] tracking-normal">{jp}</span>
      {!loading && icon ? icon : null}
    </button>
  )
}

function FieldRow({
  label,
  jp,
  value,
  mono,
  onCopy,
  copied
}: {
  label: string
  jp: string
  value: string | undefined
  mono?: boolean
  onCopy?: (value: string) => void
  copied?: boolean
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-12 items-start border-b-[2px] border-ink last:border-b-0">
      <div className="col-span-3 flex flex-col gap-0.5 border-r-[2px] border-ink bg-ink/[0.04] px-4 py-3">
        <span className="font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
          {label}
        </span>
        <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">{jp}</span>
      </div>
      <div className="col-span-9 flex items-center gap-2 px-4 py-3">
        <div
          className={[
            'min-w-0 flex-1 break-all',
            mono ? 'font-mono text-[11px]' : 'font-mono text-[12px]',
            value ? 'text-ink' : 'text-ink/40'
          ].join(' ')}
        >
          {value ?? '—'}
        </div>
        {value && onCopy ? (
          <button
            type="button"
            onClick={() => onCopy(value)}
            className="brutal-focus shrink-0 border-[2px] border-ink bg-bone px-2 py-1 font-mono text-[9px] font-bold tracking-[0.25em] transition-colors hover:bg-ink hover:text-bone"
          >
            {copied ? 'OK' : 'COPY'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

function Arrow(): React.JSX.Element {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
      <path
        d="M0 5 H12 M8 1 L12 5 L8 9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  )
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[i]}`
}

export default GameDetails
