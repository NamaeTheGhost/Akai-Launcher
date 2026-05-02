import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useScan } from '../context/useScan'
import { useDevState } from '../context/DevToolsContext'
import { devLog, devTimeline } from '../context/DevToolsContext'
import type { Game } from '@preload/types'
import { ALL_PLATFORMS, PLATFORM_META } from '../lib/platformMeta'

const PLATFORM_ORDER = ALL_PLATFORMS
const PLATFORM_LABEL = PLATFORM_META

function Home(): React.JSX.Element {
  const { scanning, rescan, platforms, installedPlatforms, allGames, totalSizeBytes, selectGame } =
    useScan()

  const featured: Game | undefined = useMemo(() => pickFeatured(allGames), [allGames])
  const showcase = useMemo(() => pickShowcase(allGames, 6, featured?.id), [allGames, featured?.id])

  useDevState('games.count', allGames.length)
  useDevState('platforms.installed', installedPlatforms.length)
  useDevState('scanning', scanning)
  useDevState('featured.name', featured?.name)
  useDevState('showcase.count', showcase.length)
  useDevState('total.size', formatBytes(totalSizeBytes))

  return (
    <div className="bg-paper-grain min-h-full">
      <div className="flex items-stretch border-b border-ink">
        <div className="flex items-center gap-2 border-l border-ink bg-ink px-3 font-mono text-[9px] uppercase tracking-[0.2em] text-bone">
          <span>HOME</span>
          <span className="text-bone/50">/</span>
          <span className="font-jp tracking-[0.15em]">ホーム</span>
        </div>
      </div>

      <div className="p-6">
        {/* HERO */}
        <header className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-vermillion">
                ※ AKAI LAUNCHER
              </span>
              <span className="h-px flex-1 bg-ink/20" />
              <span className="font-mono text-[9px] tracking-[0.2em] text-ink/40">
                v1.0.0
              </span>
            </div>

            <h1 className="mt-3 flex items-end gap-3 font-sans text-[56px] font-bold leading-[0.9] tracking-[-0.03em]">
              <span>AKAI</span>
              <span className="font-jp-serif text-[44px] leading-none text-vermillion">赤い</span>
            </h1>
            <h2 className="font-sans text-[44px] font-bold leading-[0.9] tracking-[-0.03em] text-ink/80">
              LAUNCHER
              <span className="ml-2 font-jp-serif text-[32px] text-ink/50">起動装置</span>
            </h2>

            {/* Stats strip */}
            <div className="mt-5 grid grid-cols-3 gap-0 border border-ink bg-bone">
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

          {/* Actions */}
          <div className="col-span-12 lg:col-span-4">
            <div className="flex h-full flex-col items-end justify-between gap-4">
              <div className="relative">
                <div className="h-[120px] w-[120px] rounded-full border-2 border-ink/10 bg-vermillion/90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-bone">
                  <span className="font-jp-serif text-[28px] font-bold leading-none">始</span>
                  <span className="mt-1 font-mono text-[8px] font-semibold tracking-[0.2em]">
                    START
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  devTimeline.track('scan', 'Rescan initiated')
                  devLog.info('Starting system rescan')
                  rescan()
                }}
                disabled={scanning}
                className="btn-primary w-full"
              >
                <span>{scanning ? 'SCANNING…' : 'RESCAN'}</span>
                <span className="font-jp text-[11px] tracking-normal">
                  {scanning ? '走査' : '再走査'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* FEATURED + PLATFORM PANEL */}
        <section className="mt-8 grid grid-cols-12 gap-4">
          {/* FEATURED */}
          <article className="col-span-12 border border-ink bg-bone lg:col-span-8">
            <div className="flex items-stretch border-b border-ink bg-ink text-bone">
              <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[0.2em]">
                <span className="inline-block h-1.5 w-1.5 bg-vermillion" />
                <span>FEATURED</span>
                <span className="text-bone/50">·</span>
                <span className="font-jp tracking-[0.15em]">注目</span>
              </div>
              <div className="ml-auto flex items-center px-3 font-mono text-[9px] tracking-[0.2em] text-bone/60">
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
          <aside className="col-span-12 border border-ink bg-bone lg:col-span-4">
            <div className="flex items-center justify-between border-b border-ink bg-ink px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[0.2em] text-bone">
              <div className="flex items-center gap-2">
                <span>PLATFORMS</span>
                <span className="font-jp tracking-[0.15em]">基幹</span>
              </div>
              <span className="text-bone/50">
                {installedPlatforms.length.toString().padStart(2, '0')} /{' '}
                {PLATFORM_ORDER.length.toString().padStart(2, '0')}
              </span>
            </div>

            <ul className="scrollbar-brutal max-h-[380px] overflow-y-auto">
              {PLATFORM_ORDER.map((id) => {
                const p = platforms.find((x) => x.id === id)
                const meta = PLATFORM_LABEL[id]
                const installed = !!p?.installed
                const count = p?.games.length ?? 0
                return (
                  <li
                    key={id}
                    className="flex items-stretch border-b last:border-b-0"
                  >
                    <div
                      className={[
                        'flex w-10 shrink-0 items-center justify-center font-jp-serif text-[20px] font-bold',
                        installed
                          ? 'bg-ink text-bone'
                          : 'bg-bone text-ink/20 border-r border-ink/20'
                      ].join(' ')}
                    >
                      {meta.kanji}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 px-2.5 py-1.5">
                      <div className="min-w-0">
                        <div
                          className={[
                            'truncate font-mono text-[10px] font-semibold tracking-[0.2em]',
                            installed ? 'text-ink' : 'text-ink/30'
                          ].join(' ')}
                        >
                          {meta.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] font-semibold tracking-[0.2em]">
                        <span
                          className={[
                            'inline-block h-1.5 w-1.5',
                            installed ? 'bg-vermillion' : 'border border-ink/20'
                          ].join(' ')}
                        />
                        <span className={installed ? 'text-ink' : 'text-ink/30'}>
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

        {/* SHOWCASE */}
        <section className="mt-8">
          <div className="flex items-end justify-between border-b border-ink pb-2">
            <div className="flex items-baseline gap-3">
              <h2 className="font-sans text-[28px] font-bold leading-none tracking-[-0.02em]">
                LIBRARY
              </h2>
              <span className="font-jp-serif text-[20px] font-bold text-ink/50">書庫</span>
            </div>
            <Link
              to="/library"
              className="btn-secondary inline-flex"
            >
              <span>VIEW ALL</span>
              <span className="font-jp text-[11px] tracking-normal">全て</span>
            </Link>
          </div>

          {scanning && allGames.length === 0 ? (
            <ScanningPanel />
          ) : showcase.length === 0 ? (
            <EmptyShowcase />
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((g) => (
                <GameCard key={g.id} game={g} onSelect={() => selectGame(g.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <section className="mt-8 border border-ink bg-bone px-4 py-3 font-mono text-[10px] tracking-[0.15em] text-ink/60">
          <span>AKAI LAUNCHER · 二〇二六</span>
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
      className={['flex flex-col gap-0.5 px-4 py-3', last ? '' : 'border-r border-ink'].join(
        ' '
      )}
    >
      <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-ink/50">
        <span>{label}</span>
        <span className="font-jp text-[10px] tracking-[0.15em]">{jp}</span>
      </div>
      <div
        className={[
          'font-sans text-[24px] font-bold tracking-tight',
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
    devTimeline.track('launch', `Launching ${game.name}`, game.platformId)
    devLog.info(`Launching ${game.name}`, { platform: game.platformId })
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
    devLog.debug(`Reveal folder for ${game.name}`)
    const target = game.launchExe || game.installPath
    if (target) void window.api.launcher.showInFolder(target)
  }

  return (
    <div className="grid grid-cols-12 gap-0">
      <button
        type="button"
        onClick={onSelect}
        className="brutal-focus col-span-12 border-b border-ink md:col-span-5 md:border-b-0 md:border-r"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-bone">
          <span className="font-jp-serif absolute left-3 top-2 text-[180px] font-bold leading-none text-ink/10">
            {meta.kanji}
          </span>
          <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-vermillion/80" />
        </div>
      </button>

      <div className="col-span-12 flex flex-col p-4 md:col-span-7">
        <div className="font-mono text-[9px] font-semibold tracking-[0.2em] text-ink/50">
          PLATFORM · {meta.name}
        </div>
        <h3
          className="mt-1 cursor-pointer font-sans text-[24px] font-bold leading-none tracking-[-0.02em] hover:text-vermillion"
          onClick={onSelect}
        >
          {game.name}
        </h3>

        <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-wide text-ink/50">
          {game.installPath ?? 'INSTALL PATH UNKNOWN'}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-0 border-t border-ink font-mono text-[9px] uppercase tracking-[0.15em]">
          <SmallStat label="Size" value={formatBytes(game.sizeBytes)} />
          <SmallStat label="Status" value="READY" accent />
          <SmallStat label="Source" value={meta.name.split(' ')[0]} last />
        </dl>

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap gap-0">
            <BrutalButton primary onClick={launch} className="flex-1 min-w-0">
              <span>LAUNCH</span>
              <span className="font-jp text-[12px]">起動</span>
              <Arrow />
            </BrutalButton>
            <BrutalButton onClick={onSelect} className="flex-1 min-w-0">
              <span>DETAILS</span>
            </BrutalButton>
            <BrutalButton onClick={reveal} className="flex-1 min-w-0">
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
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <div className="font-jp-serif text-[48px] font-bold leading-none text-ink/30">
        {scanning ? '走' : '無'}
      </div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-ink/50">
        {scanning ? 'SCANNING SYSTEM' : 'NO GAMES DETECTED'}
      </div>
      {!scanning ? (
        <Link
          to="/library"
          className="btn-primary inline-flex mt-2"
        >
          OPEN LIBRARY
        </Link>
      ) : null}
    </div>
  )
}

function GameCard({ game, onSelect }: { game: Game; onSelect: () => void }): React.JSX.Element {
  const meta = PLATFORM_LABEL[game.platformId]

  const launch = (e: React.MouseEvent): void => {
    e.stopPropagation()
    devTimeline.track('launch', game.name, game.platformId)
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
    <article className="group relative flex flex-col border border-ink bg-bone">
      <button
        type="button"
        onClick={onSelect}
        className="brutal-focus flex flex-1 flex-col text-left"
      >
        <div className="flex items-center justify-between border-b border-ink bg-ink px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.2em] text-bone">
          <span className="truncate">{meta.name}</span>
          <span className="border border-bone px-1 py-0.5 text-[8px] tracking-[0.15em]">
            READY
          </span>
        </div>

        <div className="relative aspect-[5/3] overflow-hidden border-b border-ink bg-bone">
          <span className="font-jp-serif absolute -bottom-4 left-2 text-[120px] font-bold leading-none text-ink/8">
            {meta.kanji}
          </span>
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 bg-ink/60" />
            <span className="font-mono text-[8px] font-semibold tracking-[0.15em]">
              {game.platformId.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="font-sans text-[15px] font-bold leading-tight tracking-tight">
            {game.name}
          </div>
          <div className="truncate font-mono text-[9px] tracking-[0.15em] text-ink/40">
            {game.installPath ?? '—'}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-ink px-3 py-1.5 font-mono text-[9px] tracking-[0.2em]">
        <span className="text-ink/50">SIZE · {formatBytes(game.sizeBytes)}</span>
        <button
          type="button"
          onClick={launch}
          className="btn-ghost"
        >
          <span>RUN</span>
          <span className="font-jp text-[10px] tracking-normal">起</span>
        </button>
      </div>
    </article>
  )
}

function ScanningPanel(): React.JSX.Element {
  return (
    <div className="mt-4 border border-ink bg-bone">
      <div className="border-b border-ink bg-ink px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[0.2em] text-bone">
        SCANNING SYSTEM
      </div>
      <div className="space-y-2 p-4 font-mono text-[10px] tracking-[0.2em] text-ink/60">
        <div>READING REGISTRY HIVES…</div>
        <div>PARSING STEAM LIBRARIES…</div>
        <div>READING EPIC MANIFESTS…</div>
        <div className="bg-stripes h-2 w-full" />
      </div>
    </div>
  )
}

function EmptyShowcase(): React.JSX.Element {
  return (
    <div className="mt-4 border border-ink bg-bone p-6 text-center">
      <div className="mb-1 font-jp-serif text-[36px] font-bold text-ink/30">無</div>
      <div className="font-mono text-[10px] tracking-[0.2em] text-ink/50">
        NO GAMES FOUND
      </div>
      <Link
        to="/library"
        className="btn-primary inline-block mt-3"
      >
        OPEN LIBRARY
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
      className={['flex flex-col gap-0.5 px-2.5 py-2', last ? '' : 'border-r border-ink'].join(
        ' '
      )}
    >
      <dt className="text-[8px] text-ink/40">{label}</dt>
      <dd
        className={['truncate text-[11px] font-semibold', accent ? 'text-vermillion' : 'text-ink'].join(
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
  onClick,
  className
}: {
  children: React.ReactNode
  primary?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
}): React.JSX.Element {
  return (
    <button type="button" onClick={onClick} className={className ? `${primary ? 'btn-primary' : 'btn-secondary'} ${className}` : primary ? 'btn-primary' : 'btn-secondary'}>
      {children}
    </button>
  )
}

function Arrow(): React.JSX.Element {
  return (
    <svg width="12" height="8" viewBox="0 0 14 10" aria-hidden="true">
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
