import { shell } from 'electron'
import { spawn, exec, type ChildProcess } from 'child_process'
import { basename, dirname, normalize } from 'path'
import type { SessionGameInfo } from './sessions'

interface ProcInfo {
  pid: number
  name: string
  path: string
}

interface ActiveLaunch {
  info: SessionGameInfo
  child?: ChildProcess
  /** PID of the actual running game (may be upgraded by the watcher). */
  pid?: number
  /** Image name (e.g. "Game.exe") used for taskkill /IM fallback. */
  exeBasename?: string
  startedAt: number
  onExit: () => void
  preLaunchPids: Set<number>
  identifyTimer?: NodeJS.Timeout
  identifyAttempts: number
  monitorTimer?: NodeJS.Timeout
  /** True once the watcher has confirmed an actual game process exists. */
  resolved: boolean
}

let active: ActiveLaunch | null = null

const IDENTIFY_INTERVAL_MS = 2000
const IDENTIFY_MAX_ATTEMPTS = 45 // ≈ 90 s — Steam pre-launch can be slow
const IDENTIFY_DELAY_MS = 1500
const MONITOR_INTERVAL_MS = 2500

// =====================================================================
// Process listing
// =====================================================================

const SKIP_NAMES = new Set([
  'electron.exe',
  'cmd.exe',
  'powershell.exe',
  'pwsh.exe',
  'conhost.exe',
  'wmiprvse.exe',
  'svchost.exe',
  'rundll32.exe',
  'taskhostw.exe',
  'csrss.exe',
  'wininit.exe',
  'winlogon.exe',
  'fontdrvhost.exe',
  'dwm.exe',
  'ctfmon.exe',
  'sihost.exe',
  'searchhost.exe',
  'explorer.exe',
  'startmenuexperiencehost.exe'
])

async function listWindowsProcesses(): Promise<ProcInfo[]> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve([])
      return
    }
    // CIM is available on Windows 8+ via PowerShell 3+.
    // ConvertTo-Json with -Compress gives us a stable shape.
    const cmd =
      'powershell.exe -NoProfile -NonInteractive -Command "Get-CimInstance Win32_Process | ' +
      'Select-Object ProcessId,Name,ExecutablePath | ConvertTo-Json -Compress"'
    exec(cmd, { maxBuffer: 16 * 1024 * 1024, windowsHide: true }, (err, stdout) => {
      if (err || !stdout) {
        resolve([])
        return
      }
      try {
        const text = stdout.trim()
        if (!text) {
          resolve([])
          return
        }
        const parsed = JSON.parse(text) as
          | { ProcessId?: number | string; Name?: string; ExecutablePath?: string }
          | Array<{ ProcessId?: number | string; Name?: string; ExecutablePath?: string }>
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        const list: ProcInfo[] = []
        for (const r of arr) {
          if (!r) continue
          const pid = Number(r.ProcessId)
          const name = String(r.Name ?? '')
          const path = String(r.ExecutablePath ?? '')
          if (Number.isFinite(pid) && pid > 0) list.push({ pid, name, path })
        }
        resolve(list)
      } catch {
        resolve([])
      }
    })
  })
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

// =====================================================================
// Path helpers
// =====================================================================

function pathStartsWith(p: string, prefix: string): boolean {
  if (!p || !prefix) return false
  const a = normalize(p).toLowerCase()
  let b = normalize(prefix).toLowerCase()
  if (!b.endsWith('\\') && !b.endsWith('/')) b = b + '\\'
  return a.startsWith(b) || a.startsWith(b.replace(/\\/g, '/'))
}

// =====================================================================
// Identification & monitoring
// =====================================================================

async function identifyGameProcess(launch: ActiveLaunch): Promise<boolean> {
  const { info } = launch
  if (!info.installPath && !info.launchExe) return false

  const list = await listWindowsProcesses()
  if (list.length === 0) return false

  const wantedExe = info.launchExe ? basename(info.launchExe).toLowerCase() : null

  const candidates = list.filter((p) => {
    if (launch.preLaunchPids.has(p.pid)) return false
    if (p.pid === process.pid) return false
    const lname = (p.name || '').toLowerCase()
    if (SKIP_NAMES.has(lname)) return false
    if (info.installPath && pathStartsWith(p.path, info.installPath)) return true
    if (wantedExe && lname === wantedExe) return true
    return false
  })

  if (candidates.length === 0) return false

  // Prefer exact image-name match if launchExe is known.
  let chosen = candidates[0]
  if (wantedExe) {
    const exact = candidates.find((c) => (c.name || '').toLowerCase() === wantedExe)
    if (exact) chosen = exact
  }

  launch.pid = chosen.pid
  launch.exeBasename = chosen.name || launch.exeBasename
  launch.resolved = true
  return true
}

function startMonitor(launch: ActiveLaunch): void {
  if (launch.monitorTimer) return
  launch.monitorTimer = setInterval(() => {
    if (active !== launch) {
      stopAll(launch)
      return
    }
    if (!launch.pid) return
    if (!pidAlive(launch.pid)) {
      cleanup(launch, true)
    }
  }, MONITOR_INTERVAL_MS)
}

function stopMonitor(launch: ActiveLaunch): void {
  if (launch.monitorTimer) {
    clearInterval(launch.monitorTimer)
    launch.monitorTimer = undefined
  }
}

function startIdentifyLoop(launch: ActiveLaunch): void {
  if (launch.identifyTimer) return
  const tick = async (): Promise<void> => {
    if (active !== launch) {
      stopIdentifyLoop(launch)
      return
    }
    launch.identifyAttempts++
    const found = await identifyGameProcess(launch)
    if (found) {
      stopIdentifyLoop(launch)
      // If we already have a child PID and a different real PID was found,
      // the new pid takes over. Watcher will end the session when IT dies.
      startMonitor(launch)
    } else if (launch.identifyAttempts >= IDENTIFY_MAX_ATTEMPTS) {
      stopIdentifyLoop(launch)
      // No identification possible — manual close from overlay still works
      // (best-effort by exeBasename if we had it from launchExe).
    }
  }
  // Fire after the initial delay so the launcher has time to start the game.
  launch.identifyTimer = setInterval(() => {
    void tick()
  }, IDENTIFY_INTERVAL_MS)
  setTimeout(() => {
    if (active === launch) void tick()
  }, 100)
}

function stopIdentifyLoop(launch: ActiveLaunch): void {
  if (launch.identifyTimer) {
    clearInterval(launch.identifyTimer)
    launch.identifyTimer = undefined
  }
}

function stopAll(launch: ActiveLaunch): void {
  stopIdentifyLoop(launch)
  stopMonitor(launch)
}

function cleanup(launch: ActiveLaunch, fireExit: boolean): void {
  if (active === launch) active = null
  stopAll(launch)
  if (fireExit) {
    try {
      launch.onExit()
    } catch {
      // ignore
    }
  }
}

// =====================================================================
// Public API
// =====================================================================

export interface LaunchOutcome {
  ok: boolean
  pid?: number
  trackable: boolean
}

export async function launchGame(
  info: SessionGameInfo,
  onExit: () => void
): Promise<LaunchOutcome> {
  // Tear down any previous watching (without killing the process)
  if (active) {
    stopAll(active)
    active = null
  }

  // Snapshot pids BEFORE launch so the watcher only considers NEW processes.
  const preSnapshot = process.platform === 'win32' ? await listWindowsProcesses() : []
  const preLaunchPids = new Set(preSnapshot.map((p) => p.pid))

  const exePath =
    info.launchExe && info.launchExe.toLowerCase().endsWith('.exe') ? info.launchExe : undefined

  // ---- Direct EXE path (custom games, EA exe paths, etc.) ----
  if (exePath) {
    try {
      const child = spawn(exePath, [], {
        cwd: dirname(exePath),
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      })
      child.unref()

      const launch: ActiveLaunch = {
        info,
        child,
        pid: child.pid,
        exeBasename: basename(exePath),
        startedAt: Date.now(),
        onExit,
        preLaunchPids,
        identifyAttempts: 0,
        resolved: true
      }
      active = launch

      child.on('exit', () => {
        // The spawned exe might be a launcher that started another process
        // under installPath. If the watcher upgraded `pid` to a different
        // real game pid that's still alive, don't end the session yet.
        if (launch.pid && launch.pid !== child.pid && launch.resolved && pidAlive(launch.pid)) {
          return
        }
        cleanup(launch, true)
      })
      child.on('error', () => {
        try {
          void shell.openPath(exePath)
        } catch {
          // ignore
        }
      })

      // Watcher in case spawned exe is just a launcher → upgrade pid.
      if (process.platform === 'win32' && info.installPath) {
        setTimeout(() => {
          if (active === launch) startIdentifyLoop(launch)
        }, IDENTIFY_DELAY_MS)
      }

      return { ok: true, pid: child.pid, trackable: true }
    } catch {
      // fall through to URI/shell launch
    }
  }

  // ---- URI / shell launch (Steam, Epic, GOG Galaxy, ...) ----
  try {
    if (info.launchUri) {
      void shell.openExternal(info.launchUri)
    } else if (info.launchExe) {
      void shell.openPath(info.launchExe)
    } else if (info.installPath) {
      void shell.openPath(info.installPath)
    } else {
      return { ok: false, trackable: false }
    }

    const launch: ActiveLaunch = {
      info,
      exeBasename: info.launchExe ? basename(info.launchExe) : undefined,
      startedAt: Date.now(),
      onExit,
      preLaunchPids,
      identifyAttempts: 0,
      resolved: false
    }
    active = launch

    if (process.platform === 'win32') {
      setTimeout(() => {
        if (active === launch) startIdentifyLoop(launch)
      }, IDENTIFY_DELAY_MS)
    }

    return { ok: true, trackable: false }
  } catch {
    return { ok: false, trackable: false }
  }
}

export function killActive(): Promise<boolean> {
  return new Promise((resolve) => {
    const a = active
    if (!a) {
      resolve(false)
      return
    }

    const finalize = (ok: boolean): void => {
      cleanup(a, true)
      resolve(ok)
    }

    if (process.platform === 'win32') {
      const tasks: Array<Promise<boolean>> = []

      if (a.pid) {
        tasks.push(
          new Promise<boolean>((res) => {
            exec(`taskkill /F /T /PID ${a.pid}`, (err) => res(!err))
          })
        )
      }
      // Also kill the spawned child PID if it's different (covers wrappers).
      if (a.child?.pid && a.child.pid !== a.pid) {
        tasks.push(
          new Promise<boolean>((res) => {
            exec(`taskkill /F /T /PID ${a.child!.pid}`, (err) => res(!err))
          })
        )
      }
      if (a.exeBasename) {
        tasks.push(
          new Promise<boolean>((res) => {
            exec(`taskkill /F /T /IM "${a.exeBasename}"`, (err) => res(!err))
          })
        )
      }
      // Last-resort: if we have an installPath but never resolved a process,
      // try to discover one right now and kill it (one-shot).
      if (tasks.length === 0 && a.info.installPath) {
        tasks.push(
          (async (): Promise<boolean> => {
            const list = await listWindowsProcesses()
            const matches = list.filter(
              (p) =>
                pathStartsWith(p.path, a.info.installPath!) &&
                !SKIP_NAMES.has((p.name || '').toLowerCase())
            )
            if (matches.length === 0) return false
            const results = await Promise.all(
              matches.map(
                (m) =>
                  new Promise<boolean>((res) => {
                    exec(`taskkill /F /T /PID ${m.pid}`, (err) => res(!err))
                  })
              )
            )
            return results.some(Boolean)
          })()
        )
      }

      if (tasks.length === 0) {
        finalize(false)
        return
      }
      Promise.all(tasks).then((rs) => finalize(rs.some(Boolean)))
      return
    }

    // POSIX fallback (best-effort)
    try {
      if (a.pid) {
        try {
          process.kill(-a.pid, 'SIGKILL')
        } catch {
          process.kill(a.pid, 'SIGKILL')
        }
        finalize(true)
        return
      }
      if (a.exeBasename) {
        exec(`pkill -f ${JSON.stringify(a.exeBasename)}`, (err) => finalize(!err))
        return
      }
      finalize(false)
    } catch {
      finalize(false)
    }
  })
}

export function clearActive(): void {
  if (active) cleanup(active, false)
}

export function getActive(): SessionGameInfo | null {
  return active?.info ?? null
}
