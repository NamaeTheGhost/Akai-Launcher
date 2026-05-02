import { useScan } from '../context/useScan'
import { useSession } from '../hooks/useSession'

function StatusBar(): React.JSX.Element {
  const { scanning, allGames, installedPlatforms } = useScan()
  const { current } = useSession()
  const platformCount = installedPlatforms.length
  const gameCount = allGames.length

  return (
    <footer className="flex h-7 items-stretch border-t-[3px] border-ink bg-ink font-mono text-[10px] uppercase tracking-[0.22em] text-bone">
      <div className="flex items-center gap-2 border-r border-bone/20 px-3">
        <span
          className={[
            'inline-block h-1.5 w-1.5',
            scanning
              ? 'animate-blink bg-bone'
              : current
                ? 'animate-blink bg-vermillion'
                : 'bg-vermillion'
          ].join(' ')}
        />
        <span>{scanning ? 'SCANNING' : current ? 'IN-GAME' : 'ONLINE'}</span>
      </div>
      {current ? (
        <NowPlaying name={current.name} />
      ) : (
        <>
          <div className="flex items-center px-3 text-bone/70">
            PLATFORMS · {platformCount.toString().padStart(2, '0')}
          </div>
          <div className="flex items-center px-3 text-bone/70">
            TITLES · {gameCount.toString().padStart(3, '0')}
          </div>
        </>
      )}
      <div className="flex flex-1 items-center overflow-hidden border-x border-bone/20">
        <div className="flex shrink-0 animate-marquee gap-12 whitespace-nowrap px-6 text-bone/80">
          <MarqueeLine />
          <MarqueeLine />
        </div>
      </div>
      {current ? (
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => void window.api.overlay.show()}
            className="brutal-focus flex items-center gap-1.5 border-l border-bone/20 px-3 transition-colors hover:bg-vermillion"
            title="Show overlay"
          >
            <span className="font-jp text-[11px] tracking-normal">浮上</span>
            <span>OVERLAY</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              const ok = await window.api.session.kill()
              if (!ok) await window.api.session.end()
            }}
            className="brutal-focus flex items-center gap-1.5 border-l border-bone/20 px-3 transition-colors hover:bg-vermillion"
            title="Close game · 終了"
          >
            <span className="font-jp text-[11px] tracking-normal">終</span>
            <span>CLOSE</span>
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-2 border-l border-bone/20 px-3">
        <span className="font-jp text-[11px] tracking-normal">
          {scanning ? '走査中' : current ? '進行中' : '起動準備完了'}
        </span>
        <span className="text-bone/50">·</span>
        <span>{scanning ? 'PLEASE_WAIT' : current ? 'PLAYING' : 'READY'}</span>
      </div>
    </footer>
  )
}

function NowPlaying({ name }: { name: string }): React.JSX.Element {
  return (
    <div className="flex max-w-[40%] items-center gap-2 border-r border-bone/20 px-3 text-bone/85">
      <span className="font-jp text-[11px] tracking-normal text-vermillion">▸</span>
      <span className="truncate">{name}</span>
    </div>
  )
}

function MarqueeLine(): React.JSX.Element {
  return (
    <span className="flex items-center gap-12">
      <span>{'NAMAETYPE LAUNCHER //'}</span>
      <span>{'名前 // TYPE / DESIGN / CODE'}</span>
      <span>BRUTAL × WA — 和の構造</span>
      <span>※ NO GRADIENTS · NO SCALE FX</span>
      <span>EDITION — 2026 SPRING</span>
      <span>{'// SIGNAL OK ////'}</span>
    </span>
  )
}

export default StatusBar
