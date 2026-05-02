import { Link } from 'react-router-dom'
import { useScan } from '../context/useScan'
import type { Game } from '@preload/types'
import { ALL_PLATFORMS, PLATFORM_META } from '../lib/platformMeta'

const PLATFORM_ORDER = ALL_PLATFORMS
const PLATFORM_LABEL = PLATFORM_META

function Home(): React.JSX.Element {
  const { scanning, rescan, platforms, installedPlatforms, allGames, totalSizeBytes, selectGame } =
    useScan()

  const featured: Game | undefined = pickFeatured(allGames)
  const showcase = pickShowcase(allGames, 6, featured?.id)

  return (
    <div className="bg-paper-grain min-h-full">
      <div className="flex items-stretch border-b-[3px] border-ink">
        <div className="bg-stripes h-8 flex-1" />
        <div className="flex items-center gap-3 border-l-[3px] border-ink bg-ink px-4 font-mono text-[10px] uppercase tracking-[0.3em] text-bone">
          <span>SECTION_01</span>
          <span className="text-bone/50">/</span>
          <span className="font-jp tracking-[0.2em]">入口</span>
        </div>
      </div>

      <div className="p-8">
        {/* HERO */}
        <header className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[11px] font-bold tracking-[0.4em] text-vermillion">
                ※ KIDOU / 起動
              </span>
              <span className="h-px flex-1 bg-ink" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-ink/60">
                INDEX 00 — LAUNCH
              </span>
            </div>

            <h1 className="mt-4 flex items-end gap-4 font-sans text-[80px] font-black leading-[0.85] tracking-[-0.04em]">
              <span>NAMAE</span>
              <span className="font-jp-serif text-[64px] leading-none text-vermillion">名前</span>
            </h1>
            <h2 className="font-sans text-[64px] font-black leading-[0.85] tracking-[-0.04em] text-ink/85">
              TYPE.
              <span className="ml-3 font-jp-serif text-[44px] text-ink/60">活字</span>
            </h2>

            {/* Real stats strip */}
            <div className="mt-7 grid grid-cols-3 gap-0 border-[3px] border-ink bg-bone">
              <BigStat
                label="TITLES"
                jp="作品"
                value={allGames.length.toString().padStart(3, '0')}
              />
              <BigStat
                label="PLATFORMS"
                jp="基幹"
                value={`${installedPlatforms.length
                  .toString()
                  .padStart(2, '0')} / ${PLATFORM_ORDER.length.toString().padStart(2, '0')}`}
              />
              <BigStat label="DISK" jp="容量" value={formatBytes(totalSizeBytes)} accent last />
            </div>
          </div>

          {/* HINOMARU + actions */}
          <div className="col-span-12 lg:col-span-4">
            <div className="flex h-full flex-col items-end justify-between gap-6">
              <div className="relative">
                <div className="h-[180px] w-[180px] rounded-full bg-vermillion" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-bone">
                  <span className="font-jp-serif text-[40px] font-black leading-none">始</span>
                  <span className="mt-2 font-mono text-[9px] font-bold tracking-[0.3em]">
                    BEGIN
                  </span>
                </div>
                <div className="absolute -bottom-3 -right-3 border-[3px] border-ink bg-bone px-2 py-1 font-mono text-[9px] font-bold tracking-[0.2em]">
                  №·2026·04
                </div>
              </div>
              <button
                type="button"
                onClick={rescan}
                disabled={scanning}
                className="brutal-focus flex w-full items-center justify-between gap-2 border-[3px] border-ink bg-ink px-4 py-3 font-mono text-[11px] font-bold tracking-[0.3em] text-bone transition-colors hover:bg-vermillion hover:border-vermillion disabled:opacity-60"
              >
                <span>{scanning ? 'SCANNING…' : 'RESCAN SYSTEM'}</span>
                <span className="font-jp text-[12px] tracking-normal">
                  {scanning ? '走査' : '再走査'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* FEATURED + PLATFORM PANEL */}
        <section className="mt-10 grid grid-cols-12 gap-6">
          {/* FEATURED */}
          <article className="col-span-12 border-[3px] border-ink bg-bone lg:col-span-8">
            <div className="flex items-stretch border-b-[3px] border-ink bg-ink text-bone">
              <div className="flex items-center gap-3 px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em]">
                <span className="inline-block h-2 w-2 bg-vermillion" />
                <span>FEATURED</span>
                <span className="text-bone/50">·</span>
                <span className="font-jp tracking-[0.2em]">注目</span>
              </div>
              <div className="ml-auto flex items-center px-4 font-mono text-[10px] tracking-[0.3em] text-bone/70">
                {featured ? PLATFORM_LABEL[featured.platformId].name : 'NO TITLES'}
              </div>
            </div>

            {featured ? (
              <FeaturedCard game={featured} onSelect={() => selectGame(featured.id)} />
            ) : (
              <FeaturedEmpty scanning={scanning} />
            )}
          </article>

          {/* PLATFORM PANEL */}
          <aside className="col-span-12 border-[3px] border-ink bg-bone lg:col-span-4">
            <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone">
              <div className="flex items-center gap-3">
                <span>PLATFORMS</span>
                <span className="font-jp tracking-[0.2em]">基幹</span>
              </div>
              <span className="text-bone/60">
                {installedPlatforms.length.toString().padStart(2, '0')} /{' '}
                {PLATFORM_ORDER.length.toString().padStart(2, '0')}
              </span>
            </div>

            <ul className="scrollbar-brutal max-h-[440px] overflow-y-auto">
              {PLATFORM_ORDER.map((id) => {
                const p = platforms.find((x) => x.id === id)
                const meta = PLATFORM_LABEL[id]
                const installed = !!p?.installed
                const count = p?.games.length ?? 0
                return (
                  <li
                    key={id}
                    className="flex items-stretch border-b-[2px] border-ink last:border-b-0"
                  >
                    <div
                      className={[
                        'flex w-12 shrink-0 items-center justify-center font-jp-serif text-[24px] font-black',
                        installed
                          ? 'bg-ink text-bone'
                          : 'bg-bone text-ink/30 border-r-[2px] border-ink'
                      ].join(' ')}
                    >
                      {meta.kanji}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2">
                      <div className="min-w-0">
                        <div
                          className={[
                            'truncate font-mono text-[11px] font-bold tracking-[0.25em]',
                            installed ? 'text-ink' : 'text-ink/40'
                          ].join(' ')}
                        >
                          {meta.name}
                        </div>
                        <div className="font-jp text-[10px] tracking-[0.2em] text-ink/55">
                          {meta.jp}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.25em]">
                        <span
                          className={[
                            'inline-block h-2 w-2',
                            installed ? 'bg-vermillion' : 'border-[2px] border-ink/40'
                          ].join(' ')}
                        />
                        <span className={installed ? 'text-ink' : 'text-ink/40'}>
                          {installed ? `${count.toString().padStart(2, '0')}` : '—'}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </aside>
        </section>

        {/* SHOWCASE — top games by size */}
        <section className="mt-10">
          <div className="flex items-end justify-between border-b-[3px] border-ink pb-3">
            <div className="flex items-baseline gap-4">
              <h2 className="font-sans text-[36px] font-black leading-none tracking-[-0.03em]">
                LIBRARY
              </h2>
              <span className="font-jp-serif text-[24px] font-bold text-ink/60">書庫</span>
              <span className="ml-2 font-mono text-[10px] tracking-[0.3em] text-ink/55">
                TOP BY DISK
              </span>
            </div>
            <Link
              to="/library"
              className="brutal-focus flex items-center gap-2 border-[3px] border-ink bg-bone px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors hover:bg-ink hover:text-bone"
            >
              <span>VIEW ALL</span>
              <span className="font-jp text-[12px] tracking-normal">全て</span>
            </Link>
          </div>

          {scanning && allGames.length === 0 ? (
            <ScanningPanel />
          ) : showcase.length === 0 ? (
            <EmptyShowcase />
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((g) => (
                <GameCard key={g.id} game={g} onSelect={() => selectGame(g.id)} />
              ))}
            </div>
          )}
        </section>

        {/* WA footer */}
        <section className="mt-10 grid grid-cols-12 items-stretch gap-0 border-[3px] border-ink">
          <div className="col-span-3 flex items-center justify-center border-r-[3px] border-ink bg-ink p-4 text-bone">
            <span className="font-jp-serif text-[36px] font-black leading-none">和</span>
          </div>
          <div className="col-span-9 flex flex-col justify-center gap-1 p-4 font-mono text-[11px] tracking-[0.2em] text-ink/80">
            <div className="font-bold">WA — HARMONY OF FORM, FUNCTION, AND VOID.</div>
            <div className="font-jp text-[13px] tracking-[0.2em] text-ink/60">
              形と機能と余白の和。
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function BigStat({
  label,
  jp,
  value,
  accent,
  last
}: {
  label: string
  jp: string
  value: string
  accent?: boolean
  last?: boolean
}): React.JSX.Element {
  return (
    <div
      className={['flex flex-col gap-1 px-5 py-4', last ? '' : 'border-r-[3px] border-ink'].join(
        ' '
      )}
    >
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-ink/60">
        <span>{label}</span>
        <span className="font-jp text-[11px] tracking-[0.2em]">{jp}</span>
      </div>
      <div
        className={[
          'font-sans text-[32px] font-black tracking-tight',
          accent ? 'text-vermillion' : 'text-ink'
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}

function FeaturedCard({ game, onSelect }: { game: Game; onSelect: () => void }): React.JSX.Element {
  const meta = PLATFORM_LABEL[game.platformId]

  const launch = (e: React.MouseEvent): void => {
    e.stopPropagation()
    void window.api.launcher.launchGame({
      id: game.id,
      name: game.name,
      platformId: game.platformId,
      jp: game.jp,
      installPath: game.installPath,
      launchExe: game.launchExe,
      launchUri: game.launchUri
    })
  }

  const reveal = (e: React.MouseEvent): void => {
    e.stopPropagation()
    const target = game.launchExe || game.installPath
    if (target) void window.api.launcher.showInFolder(target)
  }

  return (
    <div className="grid grid-cols-12 gap-0">
      <button
        type="button"
        onClick={onSelect}
        className="brutal-focus col-span-12 border-b-[3px] border-ink md:col-span-5 md:border-b-0 md:border-r-[3px]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-bone">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 top-1/3 h-px bg-ink/20" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-ink/20" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-ink/20" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-ink/20" />
          </div>
          <span className="font-jp-serif absolute left-4 top-2 text-[260px] font-black leading-none text-ink">
            {meta.kanji}
          </span>
          <div className="absolute bottom-6 left-4 right-4 h-3 bg-ink" />
          <div className="absolute right-4 top-4 h-10 w-10 bg-vermillion" />
          <div className="absolute bottom-12 right-4 border-[3px] border-vermillion px-2 py-1 font-jp-serif text-[14px] font-black tracking-widest text-vermillion">
            第一
          </div>
        </div>
      </button>

      <div className="col-span-12 flex flex-col p-6 md:col-span-7">
        <div className="font-mono text-[10px] font-bold tracking-[0.3em] text-ink/60">
          PLATFORM · {meta.name}
        </div>
        <h3
          className="mt-2 cursor-pointer font-sans text-[34px] font-black leading-none tracking-[-0.03em] hover:text-vermillion"
          onClick={onSelect}
        >
          {game.name}
        </h3>
        <div className="mt-1 font-jp-serif text-[20px] font-bold tracking-[0.1em] text-ink/65">
          {meta.jp}
        </div>

        <p className="mt-5 font-mono text-[11px] leading-relaxed tracking-wide text-ink/65">
          {game.installPath ?? 'INSTALL PATH UNKNOWN'}
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-0 border-t-[2px] border-ink font-mono text-[10px] uppercase tracking-[0.2em]">
          <SmallStat label="Size" value={formatBytes(game.sizeBytes)} />
          <SmallStat label="Status" value="READY" accent />
          <SmallStat label="Source" value={meta.name.split(' ')[0]} last />
        </dl>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap gap-0">
            <BrutalButton primary onClick={launch}>
              <span>LAUNCH</span>
              <span className="font-jp text-[14px]">起動</span>
              <Arrow />
            </BrutalButton>
            <BrutalButton onClick={onSelect}>
              <span>DETAILS</span>
            </BrutalButton>
            <BrutalButton onClick={reveal}>
              <span>FOLDER</span>
            </BrutalButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedEmpty({ scanning }: { scanning: boolean }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="font-jp-serif text-[64px] font-black leading-none">
        {scanning ? '走' : '無'}
      </div>
      <div className="font-mono text-[11px] tracking-[0.3em] text-ink/65">
        {scanning ? 'SCANNING SYSTEM · 走査中' : 'NO GAMES DETECTED · ゲーム未検出'}
      </div>
      {!scanning ? (
        <Link
          to="/library"
          className="mt-2 border-[3px] border-ink bg-ink px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.3em] text-bone hover:bg-vermillion hover:border-vermillion"
        >
          OPEN LIBRARY · 書庫
        </Link>
      ) : null}
    </div>
  )
}

function GameCard({ game, onSelect }: { game: Game; onSelect: () => void }): React.JSX.Element {
  const meta = PLATFORM_LABEL[game.platformId]

  const launch = (e: React.MouseEvent): void => {
    e.stopPropagation()
    void window.api.launcher.launchGame({
      id: game.id,
      name: game.name,
      platformId: game.platformId,
      jp: game.jp,
      installPath: game.installPath,
      launchExe: game.launchExe,
      launchUri: game.launchUri
    })
  }

  return (
    <article className="group relative flex flex-col border-[3px] border-ink bg-bone">
      <button
        type="button"
        onClick={onSelect}
        className="brutal-focus flex flex-1 flex-col text-left"
      >
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.25em] text-bone">
          <span className="truncate">{meta.name}</span>
          <span className="border-[2px] border-bone px-1.5 py-0.5 text-[9px] tracking-[0.2em]">
            READY
          </span>
        </div>

        <div className="relative aspect-[5/3] overflow-hidden border-b-[3px] border-ink bg-bone">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 top-1/2 h-px bg-ink/15" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-ink/15" />
          </div>
          <span className="font-jp-serif absolute -bottom-6 left-2 text-[180px] font-black leading-none text-ink">
            {meta.kanji}
          </span>
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 bg-ink" />
            <span className="font-mono text-[9px] font-bold tracking-[0.2em]">
              {game.platformId.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="font-sans text-[18px] font-black leading-tight tracking-tight">
            {game.name}
          </div>
          <div className="truncate font-mono text-[10px] tracking-[0.2em] text-ink/55">
            {game.installPath ?? '—'}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between border-t-[2px] border-ink px-4 py-2 font-mono text-[10px] tracking-[0.25em]">
        <span className="text-ink/60">SIZE · {formatBytes(game.sizeBytes)}</span>
        <button
          type="button"
          onClick={launch}
          className="brutal-focus flex items-center gap-1.5 border-[2px] border-ink bg-bone px-2.5 py-1 font-bold transition-colors hover:bg-ink hover:text-bone"
        >
          <span>RUN</span>
          <span className="font-jp text-[11px] tracking-normal">起</span>
        </button>
      </div>
    </article>
  )
}

function ScanningPanel(): React.JSX.Element {
  return (
    <div className="mt-5 border-[3px] border-ink bg-bone">
      <div className="border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone">
        SCANNING SYSTEM · 走査中
      </div>
      <div className="space-y-3 p-6 font-mono text-[11px] tracking-[0.25em] text-ink/70">
        <div>READING REGISTRY HIVES…</div>
        <div>PARSING STEAM LIBRARIES…</div>
        <div>READING EPIC MANIFESTS…</div>
        <div className="bg-stripes h-3 w-full" />
      </div>
    </div>
  )
}

function EmptyShowcase(): React.JSX.Element {
  return (
    <div className="mt-5 border-[3px] border-ink bg-bone p-10 text-center">
      <div className="mb-2 font-jp-serif text-[48px] font-black text-ink">無</div>
      <div className="font-mono text-[11px] tracking-[0.25em] text-ink/65">
        NO GAMES FOUND · 該当なし
      </div>
      <Link
        to="/library"
        className="mt-4 inline-block border-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone hover:bg-vermillion hover:border-vermillion"
      >
        OPEN LIBRARY · 書庫
      </Link>
    </div>
  )
}

function SmallStat({
  label,
  value,
  accent,
  last
}: {
  label: string
  value: string
  accent?: boolean
  last?: boolean
}): React.JSX.Element {
  return (
    <div
      className={['flex flex-col gap-1 px-3 py-3', last ? '' : 'border-r-[2px] border-ink'].join(
        ' '
      )}
    >
      <dt className="text-[9px] text-ink/55">{label}</dt>
      <dd
        className={['truncate text-[12px] font-bold', accent ? 'text-vermillion' : 'text-ink'].join(
          ' '
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function BrutalButton({
  children,
  primary,
  onClick
}: {
  children: React.ReactNode
  primary?: boolean
  onClick?: (e: React.MouseEvent) => void
}): React.JSX.Element {
  const base =
    'brutal-focus -ml-[3px] flex items-center gap-2 border-[3px] border-ink px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] transition-colors first:ml-0'
  const tone = primary
    ? 'bg-ink text-bone hover:bg-vermillion hover:border-vermillion'
    : 'bg-bone text-ink hover:bg-ink hover:text-bone'
  return (
    <button type="button" onClick={onClick} className={`${base} ${tone}`}>
      {children}
    </button>
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

function pickFeatured(games: Game[]): Game | undefined {
  if (games.length === 0) return undefined
  const withSize = games.filter((g) => (g.sizeBytes ?? 0) > 0)
  if (withSize.length > 0) {
    return [...withSize].sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0))[0]
  }
  return games[0]
}

function pickShowcase(games: Game[], count: number, excludeId?: string): Game[] {
  const pool = excludeId ? games.filter((g) => g.id !== excludeId) : games
  return [...pool].sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)).slice(0, count)
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

export default Home
