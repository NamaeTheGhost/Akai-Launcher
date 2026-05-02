import { useDevTools } from '../../context/DevToolsContext'
import type { ThrottleState } from '../../context/DevToolsContext'

const FPS_PRESETS = [null, 60, 30, 15, 10, 5]
const CPU_PRESETS: ThrottleState['cpu'][] = ['none', '4x', '8x', '16x']
const NET_PRESETS: ThrottleState['network'][] = ['online', 'slow', 'offline']

function ThrottleTab(): React.JSX.Element {
  const { throttle, setThrottle } = useDevTools()

  const activeThrottles = [
    throttle.fps !== null && `FPS: ${throttle.fps}`,
    throttle.cpu !== 'none' && `CPU: ${throttle.cpu}`,
    throttle.network !== 'online' && `NET: ${throttle.network}`,
  ].filter((t): t is string => typeof t === 'string')

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-1.5">
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
          THROTTLE SIMULATOR
        </span>
        {activeThrottles.length > 0 && (
          <div className="mt-1 flex gap-1.5">
            {activeThrottles.map((t) => (
              <span
                key={t}
                className="border border-vermillion/30 bg-vermillion/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-vermillion"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* FPS Throttle */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-3">
        <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
          FPS LIMIT
        </div>
        <div className="mt-2 flex gap-1">
          {FPS_PRESETS.map((fps) => (
            <button
              key={String(fps)}
              onClick={() => setThrottle({ fps: fps })}
              className={[
                'flex-1 border py-1.5 font-mono text-[9px] font-bold',
                throttle.fps === fps
                  ? 'bg-vermillion/20 border-vermillion/40 text-vermillion'
                  : 'bg-[#ece6d6]/5 border-[#ece6d6]/10 text-[#ece6d6]/40 hover:text-[#ece6d6]/70',
              ].join(' ')}
            >
              {fps === null ? 'OFF' : `${fps}`}
            </button>
          ))}
        </div>
        {throttle.fps !== null && (
          <div className="mt-1 font-mono text-[7px] text-vermillion/50">
            Events throttled to {throttle.fps}Hz
          </div>
        )}
      </div>

      {/* CPU Throttle */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-3">
        <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
          CPU SLOWDOWN (setTimeout)
        </div>
        <div className="mt-2 flex gap-1">
          {CPU_PRESETS.map((cpu) => (
            <button
              key={cpu}
              onClick={() => setThrottle({ cpu })}
              className={[
                'flex-1 border py-1.5 font-mono text-[9px] font-bold',
                throttle.cpu === cpu
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                  : 'bg-[#ece6d6]/5 border-[#ece6d6]/10 text-[#ece6d6]/40 hover:text-[#ece6d6]/70',
              ].join(' ')}
            >
              {cpu === 'none' ? 'OFF' : cpu}
            </button>
          ))}
        </div>
        {throttle.cpu !== 'none' && (
          <div className="mt-1 font-mono text-[7px] text-amber-400/50">
            setTimeout multiplied by {CPU_PRESETS.indexOf(throttle.cpu)}x
          </div>
        )}
      </div>

      {/* Network Throttle */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-3">
        <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">
          NETWORK
        </div>
        <div className="mt-2 flex gap-1">
          {NET_PRESETS.map((net) => (
            <button
              key={net}
              onClick={() => setThrottle({ network: net })}
              className={[
                'flex-1 border py-1.5 font-mono text-[9px] font-bold',
                throttle.network === net
                  ? 'bg-blue-500/20 border-blue-400/40 text-blue-400'
                  : 'bg-[#ece6d6]/5 border-[#ece6d6]/10 text-[#ece6d6]/40 hover:text-[#ece6d6]/70',
              ].join(' ')}
            >
              {net.toUpperCase()}
            </button>
          ))}
        </div>
        {throttle.network !== 'online' && (
          <div className="mt-1 font-mono text-[7px] text-blue-400/50">
            Simulated: {throttle.network} (warning logged)
          </div>
        )}
      </div>

      {/* Reset all */}
      <div className="px-2.5 py-3">
        <button
          onClick={() => setThrottle({ fps: null, cpu: 'none', network: 'online' })}
          className="w-full border border-[#ece6d6]/10 bg-[#ece6d6]/5 py-2 font-mono text-[9px] font-bold text-[#ece6d6]/40 hover:text-[#ece6d6]/70"
        >
          RESET ALL THROTTLES
        </button>
      </div>
    </div>
  )
}

export default ThrottleTab
