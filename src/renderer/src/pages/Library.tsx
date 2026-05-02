import { useMemo, useState } from 'react'
import { useScan } from '../context/useScan'
import { ALL_PLATFORMS, PLATFORM_META } from '../lib/platformMeta'
import CustomGameModal from '../components/CustomGameModal'
import CollectionModal from '../components/CollectionModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Collection, Game, Platform, PlatformId } from '@preload/types'

type Tab = 'platforms' | 'collections'
type View = 'ALL' | PlatformId

function Library(): React.JSX.Element {
  const {
    scan,
    scanning,
    rescan,
    selectGame,
    customGames,
    collections,
    allGames,
    removeCustomGame,
    removeCollection,
    removeGameFromCollection
  } = useScan()

  const [tab, setTab] = useState<Tab>('platforms')
  const [view, setView] = useState<View>('ALL')
  const [query, setQuery] = useState('')

  const [addGameOpen, setAddGameOpen] = useState(false)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [collectionModalOpen, setCollectionModalOpen] = useState(false)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [confirmDeleteGame, setConfirmDeleteGame] = useState<string | null>(null)
  const [confirmDeleteCollection, setConfirmDeleteCollection] = useState<string | null>(null)

  const editingGame = editingGameId ? customGames.find((g) => g.id === editingGameId) : null
  const editingCollection = editingCollectionId
    ? collections.find((c) => c.id === editingCollectionId)
    : null

  const platforms: Platform[] = useMemo(() => {
    const byId = new Map((scan?.platforms ?? []).map((p) => [p.id, p]))
    const customPlatform: Platform = {
      id: 'custom',
      name: PLATFORM_META.custom.name,
      jp: PLATFORM_META.custom.jp,
      kanji: PLATFORM_META.custom.kanji,
      installed: customGames.length > 0,
      scannedAt: 0,
      games: customGames.map((g) => ({
        id: g.id,
        platformId: 'custom' as const,
        name: g.name,
        installPath: g.installPath,
        launchExe: g.exePath,
        launchUri: g.launchUri,
        jp: g.jp,
        category: g.category,
        notes: g.notes,
        custom: true
      }))
    }
    return ALL_PLATFORMS.map((id) => {
      if (id === 'custom') return customPlatform
      const meta = PLATFORM_META[id]
      return (
        byId.get(id) ?? {
          id,
          name: meta.name,
          jp: meta.jp,
          kanji: meta.kanji,
          installed: false,
          scannedAt: 0,
          games: []
        }
      )
    })
  }, [scan, customGames])

  const totalGames = platforms.reduce((acc, p) => acc + p.games.length, 0)
  const installedCount = platforms.filter((p) => p.installed).length

  const q = query.trim().toLowerCase()
  const filteredPlatforms = platforms
    .filter((p) => view === 'ALL' || p.id === view)
    .map((p) => ({
      ...p,
      games:
        q === ''
          ? p.games
          : p.games.filter(
              (g) =>
                g.name.toLowerCase().includes(q) || (g.installPath || '').toLowerCase().includes(q)
            )
    }))

  const visibleGameCount = filteredPlatforms.reduce((acc, p) => acc + p.games.length, 0)

  return (
    <div className="bg-paper-grain min-h-full">
      <div className="flex items-stretch border-b-[3px] border-ink">
        <div className="flex items-center gap-3 bg-ink px-4 font-mono text-[10px] uppercase tracking-[0.3em] text-bone">
          <span>SECTION_02</span>
          <span className="text-bone/50">/</span>
          <span className="font-jp tracking-[0.2em]">書庫</span>
        </div>
        <div className="bg-stripes h-8 flex-1" />
      </div>

      <div className="p-8">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b-[3px] border-ink pb-4">
          <div>
            <div className="font-mono text-[11px] font-bold tracking-[0.4em] text-vermillion">
              ※ SHOKO / 書庫
            </div>
            <h1 className="mt-2 flex items-end gap-4 font-sans text-[64px] font-black leading-none tracking-[-0.04em]">
              LIBRARY
              <span className="font-jp-serif text-[40px] font-bold text-ink/60">書庫</span>
            </h1>
            <p className="mt-2 max-w-xl font-mono text-[11px] leading-relaxed tracking-wide text-ink/70">
              GROUP YOUR GAMES INTO PLATFORMS OR CUSTOM FOLDERS · ADD UNTRACKED GAMES BY HAND.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="font-mono text-[10px] tracking-[0.3em] text-ink/60">
              PLATFORMS · {installedCount.toString().padStart(2, '0')}/
              {ALL_PLATFORMS.length.toString().padStart(2, '0')} · GAMES ·{' '}
              {totalGames.toString().padStart(3, '0')}
            </div>
            <div className="flex items-stretch gap-0">
              <button
                type="button"
                onClick={() => {
                  setEditingGameId(null)
                  setAddGameOpen(true)
                }}
                className="brutal-focus flex items-center gap-2 border-[3px] border-ink bg-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-bone"
              >
                <span>+ ADD GAME</span>
                <span className="font-jp text-[12px] tracking-normal">追加</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCollectionId(null)
                  setCollectionModalOpen(true)
                }}
                className="brutal-focus -ml-[3px] flex items-center gap-2 border-[3px] border-ink bg-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] text-ink transition-colors hover:bg-ink hover:text-bone"
              >
                <span>+ COLLECTION</span>
                <span className="font-jp text-[12px] tracking-normal">集</span>
              </button>
              <button
                type="button"
                onClick={rescan}
                disabled={scanning}
                className="brutal-focus -ml-[3px] flex items-center gap-2 border-[3px] border-ink bg-ink px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] text-bone transition-colors hover:bg-vermillion hover:border-vermillion disabled:opacity-60"
              >
                <span>{scanning ? 'SCANNING…' : 'RESCAN'}</span>
                <span className="font-jp text-[12px] tracking-normal">
                  {scanning ? '走査中' : '再走査'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mt-6 flex items-stretch border-[3px] border-ink bg-bone">
          <TabButton
            active={tab === 'platforms'}
            onClick={() => setTab('platforms')}
            label="PLATFORMS"
            jp="基幹"
            count={installedCount}
          />
          <TabButton
            active={tab === 'collections'}
            onClick={() => setTab('collections')}
            label="COLLECTIONS"
            jp="集"
            count={collections.length}
          />
          <div className="ml-auto flex items-stretch">
            <span className="flex items-center border-l-[3px] border-r-[3px] border-ink bg-ink px-3 font-mono text-[10px] font-bold tracking-[0.25em] text-bone">
              FIND/検索
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="game name or path / 名前か場所..."
              className="brutal-focus min-w-[280px] flex-1 bg-bone px-4 py-2 font-mono text-[12px] tracking-wide text-ink placeholder:text-ink/40 focus:outline-none"
            />
          </div>
        </div>

        {tab === 'platforms' ? (
          <PlatformsView
            platforms={platforms}
            filteredPlatforms={filteredPlatforms}
            view={view}
            setView={setView}
            scanning={scanning}
            scan={scan}
            visibleGameCount={visibleGameCount}
            installedCount={installedCount}
            onSelectGame={(g) => selectGame(g.id)}
            onEditCustomGame={(id) => {
              setEditingGameId(id)
              setAddGameOpen(true)
            }}
            onDeleteCustomGame={(id) => setConfirmDeleteGame(id)}
          />
        ) : (
          <CollectionsView
            collections={collections}
            allGames={allGames}
            query={q}
            onCreate={() => {
              setEditingCollectionId(null)
              setCollectionModalOpen(true)
            }}
            onEdit={(id) => {
              setEditingCollectionId(id)
              setCollectionModalOpen(true)
            }}
            onDelete={(id) => setConfirmDeleteCollection(id)}
            onSelectGame={(g) => selectGame(g.id)}
            onRemoveFromCollection={(cid, gid) => void removeGameFromCollection(cid, gid)}
          />
        )}
      </div>

      <CustomGameModal
        open={addGameOpen}
        editing={editingGame ?? null}
        onClose={() => {
          setAddGameOpen(false)
          setEditingGameId(null)
        }}
      />
      <CollectionModal
        open={collectionModalOpen}
        editing={editingCollection ?? null}
        onClose={() => {
          setCollectionModalOpen(false)
          setEditingCollectionId(null)
        }}
      />
      <ConfirmDialog
        open={confirmDeleteGame !== null}
        title="DELETE GAME"
        jp="削除"
        destructive
        message="Remove this custom game from your library? This will also remove it from any collection it belongs to."
        confirmLabel="DELETE"
        onConfirm={() => {
          if (confirmDeleteGame) void removeCustomGame(confirmDeleteGame)
        }}
        onClose={() => setConfirmDeleteGame(null)}
      />
      <ConfirmDialog
        open={confirmDeleteCollection !== null}
        title="DELETE COLLECTION"
        jp="削除"
        destructive
        message="Delete this collection? Games inside the collection are NOT deleted, only the folder itself."
        confirmLabel="DELETE"
        onConfirm={() => {
          if (confirmDeleteCollection) void removeCollection(confirmDeleteCollection)
        }}
        onClose={() => setConfirmDeleteCollection(null)}
      />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
  jp,
  count
}: {
  active: boolean
  onClick: () => void
  label: string
  jp: string
  count: number
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'brutal-focus flex items-center gap-2 border-r-[3px] border-ink px-4 py-2 font-mono text-[11px] font-bold tracking-[0.3em] transition-colors',
        active ? 'bg-ink text-bone' : 'bg-bone text-ink hover:bg-ink hover:text-bone'
      ].join(' ')}
      aria-pressed={active}
    >
      <span>{label}</span>
      <span className="font-jp text-[12px] tracking-normal">{jp}</span>
      <span className={['ml-1 text-[9px]', active ? 'opacity-70' : 'opacity-60'].join(' ')}>
        {count.toString().padStart(2, '0')}
      </span>
    </button>
  )
}

interface PlatformsViewProps {
  platforms: Platform[]
  filteredPlatforms: Platform[]
  view: View
  setView: (v: View) => void
  scanning: boolean
  scan: unknown
  visibleGameCount: number
  installedCount: number
  onSelectGame: (g: Game) => void
  onEditCustomGame: (id: string) => void
  onDeleteCustomGame: (id: string) => void
}

function PlatformsView({
  platforms,
  filteredPlatforms,
  view,
  setView,
  scanning,
  scan,
  visibleGameCount,
  installedCount,
  onSelectGame,
  onEditCustomGame,
  onDeleteCustomGame
}: PlatformsViewProps): React.JSX.Element {
  return (
    <>
      <section className="mt-6">
        <div className="grid grid-cols-3 gap-0 border-[3px] border-ink sm:grid-cols-5 lg:grid-cols-10">
          {platforms.map((p, i) => (
            <PlatformChip
              key={p.id}
              platform={p}
              active={view === p.id}
              onClick={() => setView(view === p.id ? 'ALL' : p.id)}
              index={i}
            />
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-stretch gap-0 border-[3px] border-ink bg-bone">
        <button
          type="button"
          onClick={() => setView('ALL')}
          className={[
            'brutal-focus flex items-center gap-2 border-r-[3px] border-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors',
            view === 'ALL' ? 'bg-ink text-bone' : 'bg-bone text-ink hover:bg-ink hover:text-bone'
          ].join(' ')}
        >
          <span>ALL</span>
          <span className="font-jp text-[12px] tracking-normal">全部</span>
        </button>
        {platforms
          .filter((p) => p.installed)
          .map((p) => {
            const active = view === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setView(p.id)}
                className={[
                  'brutal-focus flex items-center gap-2 border-r-[3px] border-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors',
                  active ? 'bg-ink text-bone' : 'bg-bone text-ink hover:bg-ink hover:text-bone'
                ].join(' ')}
              >
                <span className="font-jp text-[14px] tracking-normal">{p.kanji}</span>
                <span>{p.name}</span>
                <span className="ml-1 text-[9px] opacity-70">
                  {p.games.length.toString().padStart(2, '0')}
                </span>
              </button>
            )
          })}
      </div>

      {scanning && !scan ? (
        <ScanningPanel />
      ) : visibleGameCount === 0 && !filteredPlatforms.some((p) => p.installed) ? (
        <EmptyPanel installedCount={installedCount} />
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {filteredPlatforms
            .filter((p) => p.installed || (view !== 'ALL' && view === p.id))
            .map((p) => (
              <PlatformFolder
                key={p.id}
                platform={p}
                onSelect={onSelectGame}
                onEditCustomGame={onEditCustomGame}
                onDeleteCustomGame={onDeleteCustomGame}
              />
            ))}
        </div>
      )}
    </>
  )
}

interface CollectionsViewProps {
  collections: Collection[]
  allGames: Game[]
  query: string
  onCreate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSelectGame: (g: Game) => void
  onRemoveFromCollection: (cid: string, gid: string) => void
}

function CollectionsView({
  collections,
  allGames,
  query,
  onCreate,
  onEdit,
  onDelete,
  onSelectGame,
  onRemoveFromCollection
}: CollectionsViewProps): React.JSX.Element {
  const gamesById = new Map(allGames.map((g) => [g.id, g]))

  if (collections.length === 0) {
    return (
      <div className="mt-6 border-[3px] border-ink bg-bone p-10 text-center">
        <div className="mb-2 font-jp-serif text-[48px] font-black text-ink">集</div>
        <div className="font-mono text-[11px] tracking-[0.25em] text-ink/65">
          NO COLLECTIONS YET · 集合なし
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="brutal-focus mt-5 inline-flex items-center gap-2 border-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone hover:bg-vermillion hover:border-vermillion"
        >
          <span>+ CREATE FIRST COLLECTION</span>
          <span className="font-jp text-[12px] tracking-normal">作成</span>
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {collections.map((c) => {
        const games = c.gameIds
          .map((gid) => gamesById.get(gid))
          .filter((g): g is Game => Boolean(g))
          .filter((g) =>
            query === ''
              ? true
              : g.name.toLowerCase().includes(query) ||
                (g.installPath || '').toLowerCase().includes(query)
          )
        const missingCount = c.gameIds.length - games.length
        return (
          <CollectionFolder
            key={c.id}
            collection={c}
            games={games}
            missingCount={missingCount}
            onEdit={() => onEdit(c.id)}
            onDelete={() => onDelete(c.id)}
            onSelectGame={onSelectGame}
            onRemoveFromCollection={(gid) => onRemoveFromCollection(c.id, gid)}
          />
        )
      })}
    </div>
  )
}

function PlatformChip({
  platform,
  active,
  onClick,
  index
}: {
  platform: Platform
  active: boolean
  onClick: () => void
  index: number
}): React.JSX.Element {
  const installed = platform.installed
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'brutal-focus relative flex flex-col gap-1 border-r-[3px] border-ink p-3 text-left transition-colors last:border-r-0',
        index >= 5 ? 'border-t-[3px] sm:border-t-[3px] lg:border-t-0' : '',
        active
          ? 'bg-ink text-bone'
          : installed
            ? 'bg-bone text-ink hover:bg-ink hover:text-bone'
            : 'bg-bone text-ink/45 hover:bg-ink/10'
      ].join(' ')}
      aria-pressed={active}
    >
      <div className="flex items-center justify-between">
        <span className="font-jp-serif text-[28px] font-black leading-none">{platform.kanji}</span>
        <span
          className={['h-2 w-2', installed ? 'bg-vermillion' : 'border-[2px] border-current'].join(
            ' '
          )}
        />
      </div>
      <div className="mt-1 font-mono text-[9px] font-bold tracking-[0.25em]">{platform.name}</div>
      <div className="font-jp text-[10px] tracking-[0.2em] opacity-70">{platform.jp}</div>
      <div className="mt-1 font-mono text-[9px] tracking-[0.25em] opacity-70">
        {installed
          ? `${platform.games.length.toString().padStart(2, '0')} TITLES`
          : platform.id === 'custom'
            ? 'EMPTY · 空'
            : 'NOT FOUND'}
      </div>
    </button>
  )
}

function PlatformFolder({
  platform,
  onSelect,
  onEditCustomGame,
  onDeleteCustomGame
}: {
  platform: Platform
  onSelect: (game: Game) => void
  onEditCustomGame: (id: string) => void
  onDeleteCustomGame: (id: string) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(true)
  return (
    <section className="border-[3px] border-ink bg-bone">
      <header className="flex items-stretch border-b-[3px] border-ink bg-ink text-bone">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="brutal-focus flex flex-1 items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-vermillion"
          aria-expanded={open}
        >
          <span className="font-jp-serif text-[22px] font-black leading-none">
            {platform.kanji}
          </span>
          <span className="font-mono text-[12px] font-bold tracking-[0.3em]">{platform.name}</span>
          <span className="font-jp text-[12px] tracking-[0.2em] text-bone/70">{platform.jp}</span>
          <span className="ml-auto font-mono text-[10px] tracking-[0.3em] text-bone/70">
            {platform.games.length.toString().padStart(2, '0')} TITLES
          </span>
          <span className="ml-3 inline-block h-3 w-3 border-[2px] border-bone">
            <span className={`block h-full w-full ${open ? 'bg-bone' : 'bg-transparent'}`} />
          </span>
        </button>
        {platform.launchUri || platform.launcherExe ? (
          <button
            type="button"
            onClick={() => {
              if (platform.launchUri) {
                void window.api.launcher.openUri(platform.launchUri)
              } else if (platform.launcherExe) {
                void window.api.launcher.openPath(platform.launcherExe)
              }
            }}
            className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-4 py-2 font-mono text-[11px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
          >
            <span>OPEN LAUNCHER</span>
            <span className="font-jp text-[12px] tracking-normal">起動</span>
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b-[2px] border-ink px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-ink/70">
        <span className="flex items-center gap-2">
          <span
            className={[
              'inline-block h-2 w-2',
              platform.installed ? 'bg-vermillion' : 'border-[2px] border-current'
            ].join(' ')}
          />
          {platform.installed ? 'DETECTED' : 'NOT FOUND'}
        </span>
        {platform.installPath ? (
          <span className="truncate">PATH · {platform.installPath}</span>
        ) : null}
        {platform.error ? <span className="text-vermillion">ERR · {platform.error}</span> : null}
      </div>

      {open ? (
        platform.games.length === 0 ? (
          <div className="p-8 text-center font-mono text-[11px] tracking-[0.25em] text-ink/55">
            {platform.id === 'custom'
              ? 'NO CUSTOM GAMES · 自作ゲームなし'
              : platform.installed
                ? 'NO GAMES IN THIS LIBRARY · 該当なし'
                : 'PLATFORM NOT INSTALLED · 未設置'}
          </div>
        ) : (
          <ul>
            {platform.games.map((g, i) => (
              <GameRow
                key={g.id}
                game={g}
                last={i === platform.games.length - 1}
                onSelect={() => onSelect(g)}
                onEdit={g.custom ? () => onEditCustomGame(g.id) : undefined}
                onDelete={g.custom ? () => onDeleteCustomGame(g.id) : undefined}
              />
            ))}
          </ul>
        )
      ) : null}
    </section>
  )
}

function CollectionFolder({
  collection,
  games,
  missingCount,
  onEdit,
  onDelete,
  onSelectGame,
  onRemoveFromCollection
}: {
  collection: Collection
  games: Game[]
  missingCount: number
  onEdit: () => void
  onDelete: () => void
  onSelectGame: (g: Game) => void
  onRemoveFromCollection: (gid: string) => void
}): React.JSX.Element {
  const [open, setOpen] = useState(true)
  const kanji = collection.kanji?.trim() || '集'
  return (
    <section className="border-[3px] border-ink bg-bone">
      <header className="flex items-stretch border-b-[3px] border-ink bg-ink text-bone">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="brutal-focus flex flex-1 items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-vermillion"
          aria-expanded={open}
        >
          <span className="font-jp-serif text-[22px] font-black leading-none">{kanji}</span>
          <span className="font-mono text-[12px] font-bold tracking-[0.3em]">
            {collection.name.toUpperCase()}
          </span>
          {collection.jp ? (
            <span className="font-jp text-[12px] tracking-[0.2em] text-bone/70">
              {collection.jp}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[10px] tracking-[0.3em] text-bone/70">
            {collection.gameIds.length.toString().padStart(2, '0')} TITLES
          </span>
          <span className="ml-3 inline-block h-3 w-3 border-[2px] border-bone">
            <span className={`block h-full w-full ${open ? 'bg-bone' : 'bg-transparent'}`} />
          </span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-3 py-2 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
        >
          <span>EDIT</span>
          <span className="font-jp text-[12px] tracking-normal">編</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="brutal-focus flex items-center gap-2 border-l-[3px] border-bone px-3 py-2 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors hover:bg-vermillion"
        >
          <span>DELETE</span>
          <span className="font-jp text-[12px] tracking-normal">削</span>
        </button>
      </header>

      {collection.description ? (
        <div className="border-b-[2px] border-ink px-4 py-2 font-mono text-[11px] tracking-wide text-ink/65">
          {collection.description}
        </div>
      ) : null}

      {open ? (
        games.length === 0 && missingCount === 0 ? (
          <div className="p-8 text-center font-mono text-[11px] tracking-[0.25em] text-ink/55">
            EMPTY COLLECTION · 該当なし
            <div className="mt-2 text-[10px] text-ink/45">
              OPEN A GAME&apos;S DETAILS AND ADD IT TO THIS COLLECTION
            </div>
          </div>
        ) : (
          <ul>
            {games.map((g, i) => (
              <GameRow
                key={g.id}
                game={g}
                last={i === games.length - 1 && missingCount === 0}
                onSelect={() => onSelectGame(g)}
                showPlatformTag
                onRemoveFromCollection={() => onRemoveFromCollection(g.id)}
              />
            ))}
            {missingCount > 0 ? (
              <li className="border-t-[2px] border-ink px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-ink/55">
                {missingCount.toString().padStart(2, '0')} GAMES UNAVAILABLE · 不在
                <span className="ml-2 text-ink/40">(uninstalled or rescan needed)</span>
              </li>
            ) : null}
          </ul>
        )
      ) : null}
    </section>
  )
}

function GameRow({
  game,
  last,
  onSelect,
  onEdit,
  onDelete,
  onRemoveFromCollection,
  showPlatformTag
}: {
  game: Game
  last: boolean
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRemoveFromCollection?: () => void
  showPlatformTag?: boolean
}): React.JSX.Element {
  const [busy, setBusy] = useState(false)

  const launch = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    setBusy(true)
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
      setBusy(false)
    }
  }

  const reveal = (e: React.MouseEvent): void => {
    e.stopPropagation()
    const target = game.launchExe || game.installPath
    if (target) void window.api.launcher.showInFolder(target)
  }

  const meta = PLATFORM_META[game.platformId]
  const sizeLabel = formatBytes(game.sizeBytes)
  const canLaunch = !!(game.launchUri || game.launchExe || game.installPath)
  const canReveal = !!(game.launchExe || game.installPath)

  return (
    <li
      className={[
        'group grid cursor-pointer grid-cols-12 items-center gap-2 px-4 py-3 transition-colors hover:bg-ink hover:text-bone',
        last ? '' : 'border-b-[2px] border-ink'
      ].join(' ')}
      onClick={onSelect}
    >
      {showPlatformTag ? (
        <div className="col-span-1 flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] opacity-70">
          <span className="font-jp text-[14px]">{meta.kanji}</span>
        </div>
      ) : (
        <div className="col-span-1 font-mono text-[10px] tracking-[0.25em] opacity-60">
          {game.appId ? truncate(game.appId, 8) : game.custom ? '自' : '—'}
        </div>
      )}
      <div className="col-span-5 font-sans text-[14px] font-black tracking-tight">
        {game.name}
        {game.category ? (
          <span className="ml-2 align-middle font-mono text-[9px] font-bold tracking-[0.2em] opacity-60">
            · {game.category.toUpperCase()}
          </span>
        ) : null}
      </div>
      <div className="col-span-3 truncate font-mono text-[10px] tracking-[0.2em] opacity-60">
        {game.installPath ?? game.launchExe ?? '—'}
      </div>
      <div className="col-span-1 font-mono text-[10px] tracking-[0.25em] opacity-70">
        {sizeLabel}
      </div>
      <div className="col-span-2 flex justify-end gap-0">
        {onRemoveFromCollection ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemoveFromCollection()
            }}
            className="brutal-focus border-[2px] border-current bg-transparent px-2 py-1 font-mono text-[9px] font-bold tracking-[0.2em] transition-opacity hover:opacity-80"
            title="Remove from collection"
          >
            ×
          </button>
        ) : null}
        {onEdit ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="brutal-focus -ml-[2px] border-[2px] border-current bg-transparent px-2 py-1 font-mono text-[9px] font-bold tracking-[0.2em] transition-opacity hover:opacity-80"
            title="Edit"
          >
            EDIT
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="brutal-focus -ml-[2px] border-[2px] border-current bg-transparent px-2 py-1 font-mono text-[9px] font-bold tracking-[0.2em] transition-opacity hover:opacity-80"
            title="Delete"
          >
            DEL
          </button>
        ) : null}
        <button
          type="button"
          onClick={reveal}
          disabled={!canReveal}
          className="brutal-focus -ml-[2px] border-[2px] border-current bg-transparent px-2 py-1 font-mono text-[9px] font-bold tracking-[0.2em] transition-opacity hover:opacity-80 disabled:opacity-30"
          title="Show in folder"
        >
          DIR
        </button>
        <button
          type="button"
          onClick={(e) => void launch(e)}
          disabled={!canLaunch || busy}
          className="brutal-focus -ml-[2px] border-[2px] border-current bg-current px-2 py-1 font-mono text-[9px] font-bold tracking-[0.2em] disabled:opacity-30"
          title="Launch"
        >
          <span className="text-bone">{busy ? '…' : 'RUN ▸'}</span>
        </button>
      </div>
    </li>
  )
}

function ScanningPanel(): React.JSX.Element {
  return (
    <div className="mt-6 border-[3px] border-ink bg-bone">
      <div className="border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone">
        SCANNING · 走査中
      </div>
      <div className="space-y-3 p-6 font-mono text-[11px] tracking-[0.25em] text-ink/70">
        <div>READING REGISTRY HIVES…</div>
        <div>PARSING STEAM LIBRARY VDF…</div>
        <div>READING EPIC MANIFESTS…</div>
        <div>PROBING DEFAULT INSTALL PATHS…</div>
        <div className="bg-stripes h-3 w-full" />
      </div>
    </div>
  )
}

function EmptyPanel({ installedCount }: { installedCount: number }): React.JSX.Element {
  return (
    <div className="mt-6 border-[3px] border-ink bg-bone p-8 text-center">
      <div className="mb-2 font-jp-serif text-[40px] font-black text-ink">無</div>
      <div className="font-mono text-[11px] tracking-[0.25em] text-ink/70">
        {installedCount === 0
          ? 'NO LAUNCHERS DETECTED · ランチャー未検出'
          : 'NO MATCHING TITLES · 該当なし'}
      </div>
    </div>
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

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

export default Library
