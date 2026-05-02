import { useScan } from '../context/useScan'
import { useSession } from '../hooks/useSession'

function StatusBar(): React.JSX.Element {
  const { scanning, allGames, installedPlatforms } = useScan()
  const { current } = useSession()
  const platformCount = installedPlatforms.length
  const gameCount = allGames.length

  return (
    <footer className="flex h-6 items-stretch border-t border-ink/20 bg-ink font-mono text-[9px] uppercase tracking-[0.15em] text-bone">
      <div className="flex items-center gap-1.5 border-r border-bone/15 px-2.5">
        <span
          className={[
            'inline-block h-1 w-1',
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
          <div className="flex items-center px-2.5 text-bone/50">
            {platformCount} PLATFORMS · {gameCount} TITLES
          </div>
        </>
      )}
      <div className="flex-1" />
      {current ? (
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => void window.api.overlay.show()}
            className="brutal-focus flex items-center gap-1 border-l border-bone/15 px-2.5 transition-colors hover:bg-vermillion"
            title="Show overlay"
          >
            <span>OVERLAY</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              const ok = await window.api.session.kill()
              if (!ok) await window.api.session.end()
            }}
            className="brutal-focus flex items-center gap-1 border-l border-bone/15 px-2.5 transition-colors hover:bg-vermillion"
            title="Close game"
          >
            <span>CLOSE</span>
          </button>
        </div>
      ) : null}
      <div className="flex items-center gap-1.5 border-l border-bone/15 px-2.5 text-bone/50">
        <span>{scanning ? 'PLEASE_WAIT' : current ? 'PLAYING' : 'READY'}</span>
      </div>
    </footer>
  )
}

function NowPlaying({ name }: { name: string }): React.JSX.Element {
  return (
    <div className="flex max-w-[40%] items-center gap-1.5 border-r border-bone/15 px-2.5 text-bone/70">
      <span className="text-vermillion">▸</span>
      <span className="truncate">{name}</span>
    </div>
  )
}

export default StatusBar
