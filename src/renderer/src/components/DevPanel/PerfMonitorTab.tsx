import { useEffect, useRef, useState } from 'react'

function PerfMonitorTab(): React.JSX.Element {
  const [fps, setFps] = useState(0)
  const [frameTime, setFrameTime] = useState(0)
  const [memory, setMemory] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const frames = useRef(0)
  const lastUpdate = useRef(performance.now())

  useEffect(() => {
    let rafId: number

    const measure = (): void => {
      const now = performance.now()
      frames.current++
      const elapsed = now - lastUpdate.current

      if (elapsed >= 500) {
        const currentFps = Math.round((frames.current * 1000) / elapsed)
        const currentFrameTime = elapsed / frames.current
        frames.current = 0
        lastUpdate.current = now

        setFps(currentFps)
        setFrameTime(parseFloat(currentFrameTime.toFixed(2)))
        setHistory((prev) => [...prev.slice(-59), currentFps])

        const perf = window.performance as Performance & { memory?: { usedJSHeapSize: number } }
        if (perf.memory) {
          setMemory(parseFloat((perf.memory.usedJSHeapSize / 1048576).toFixed(1)))
        }
      }

      rafId = requestAnimationFrame(measure)
    }

    rafId = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const maxFps = Math.max(60, ...history)

  return (
    <div className="flex flex-col">
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-1.5 font-mono text-[8px] font-bold tracking-[0.2em] text-[#ece6d6]/40">
        PERFORMANCE MONITOR
      </div>

      {/* FPS */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">FPS</div>
            <div
              className={[
                'font-mono text-[28px] font-bold leading-none',
                fps >= 50
                  ? 'text-emerald-400'
                  : fps >= 30
                  ? 'text-yellow-400'
                  : 'text-vermillion',
              ].join(' ')}
            >
              {fps}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[8px] text-[#ece6d6]/30">FRAME TIME</div>
            <div className="font-mono text-[14px] font-bold text-[#ece6d6]/70">
              {frameTime}ms
            </div>
          </div>
        </div>
      </div>

      {/* FPS Graph */}
      <div className="border-b border-[#ece6d6]/10 px-2.5 py-2">
        <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">FPS HISTORY</div>
        <div className="mt-1 flex h-16 items-end gap-px">
          {history.length === 0 ? (
            <div className="flex-1 font-mono text-[8px] text-[#ece6d6]/20">Collecting...</div>
          ) : (
            history.map((v, i) => (
              <div
                key={i}
                className="flex-1 transition-colors"
                style={{
                  height: `${Math.max(5, (v / maxFps) * 100)}%`,
                  backgroundColor:
                    v >= 50
                      ? 'rgba(52, 211, 153, 0.6)'
                      : v >= 30
                      ? 'rgba(250, 204, 21, 0.6)'
                      : 'rgba(200, 16, 46, 0.6)',
                }}
                title={`${v} fps`}
              />
            ))
          )}
        </div>
        <div className="mt-0.5 flex justify-between font-mono text-[7px] text-[#ece6d6]/20">
          <span>{maxFps}fps</span>
          <span>60fps</span>
          <span>0</span>
        </div>
      </div>

      {/* Memory */}
      <div className="px-2.5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[8px] font-bold text-[#ece6d6]/30">JS HEAP</div>
            <div className="font-mono text-[18px] font-bold text-[#ece6d6]/70">
              {memory > 0 ? `${memory} MB` : '—'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[8px] text-[#ece6d6]/30">STATUS</div>
            <div className="font-mono text-[10px] font-bold text-emerald-400">
              {fps >= 50 ? 'SMOOTH' : fps >= 30 ? 'DEGRADED' : 'POOR'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerfMonitorTab
