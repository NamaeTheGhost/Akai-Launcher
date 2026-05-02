import path from 'path'
import { promises as fs } from 'fs'
import { firstExisting, normalizePath, pathExists, readTextFile, regGetValue } from './util'
import type { Game, Platform } from './types'

interface EpicManifest {
  AppName?: string
  DisplayName?: string
  InstallLocation?: string
  LaunchExecutable?: string
  CatalogItemId?: string
  CatalogNamespace?: string
  InstallSize?: number
  bIsApplication?: boolean
}

export async function scanEpic(): Promise<Platform> {
  const platform: Platform = {
    id: 'epic',
    name: 'EPIC GAMES',
    jp: 'エピック',
    kanji: '叙',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const installPath = await detectEpicInstall()
  const manifestsDir = await detectManifestsDir()

  if (!installPath && !manifestsDir) return platform

  platform.installed = true
  platform.installPath = installPath
  platform.launchUri = 'com.epicgames.launcher://store'

  if (installPath) {
    const exe = await firstExisting([
      path.join(installPath, 'Launcher', 'Portal', 'Binaries', 'Win64', 'EpicGamesLauncher.exe'),
      path.join(installPath, 'Launcher', 'Portal', 'Binaries', 'Win32', 'EpicGamesLauncher.exe')
    ])
    if (exe) platform.launcherExe = exe
  }

  if (manifestsDir) {
    try {
      platform.games = await readEpicGames(manifestsDir)
    } catch (err) {
      platform.error = err instanceof Error ? err.message : String(err)
    }
  }

  return platform
}

async function detectEpicInstall(): Promise<string | undefined> {
  const candidates: (string | null)[] = []
  candidates.push(
    await regGetValue('HKLM\\SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher', 'AppDataPath')
  )
  candidates.push(await regGetValue('HKLM\\SOFTWARE\\Epic Games\\EpicGamesLauncher', 'AppDataPath'))

  // AppDataPath is actually the data folder; the install root is typically
  // C:\Program Files (x86)\Epic Games (or wherever the user chose).
  const cleaned = candidates.filter((c): c is string => !!c).map((c) => normalizePath(c))

  cleaned.push('C:\\Program Files (x86)\\Epic Games')
  cleaned.push('C:\\Program Files\\Epic Games')
  return firstExisting(cleaned)
}

async function detectManifestsDir(): Promise<string | undefined> {
  // Default and most common location.
  const programData = process.env['ProgramData'] || 'C:\\ProgramData'
  const candidates = [
    path.join(programData, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests'),
    path.join(programData, 'Epic', 'UnrealEngineLauncher', 'Data', 'Manifests')
  ]
  return firstExisting(candidates)
}

async function readEpicGames(manifestsDir: string): Promise<Game[]> {
  const games: Game[] = []
  let entries: string[] = []
  try {
    entries = await fs.readdir(manifestsDir)
  } catch {
    return games
  }

  for (const entry of entries) {
    if (!entry.endsWith('.item')) continue
    const text = await readTextFile(path.join(manifestsDir, entry))
    if (!text) continue
    let m: EpicManifest
    try {
      m = JSON.parse(text) as EpicManifest
    } catch {
      continue
    }
    if (m.bIsApplication === false) continue

    const name = m.DisplayName || m.AppName
    const appName = m.AppName
    if (!name || !appName) continue

    const installPath = m.InstallLocation ? normalizePath(m.InstallLocation) : undefined
    const launchExe =
      installPath && m.LaunchExecutable ? path.join(installPath, m.LaunchExecutable) : undefined

    games.push({
      id: `epic:${appName}`,
      platformId: 'epic',
      name,
      appId: appName,
      installPath,
      launchExe,
      sizeBytes: typeof m.InstallSize === 'number' ? m.InstallSize : undefined,
      launchUri: `com.epicgames.launcher://apps/${appName}?action=launch&silent=true`
    })
  }

  // Filter out broken / missing installs.
  const valid: Game[] = []
  for (const g of games) {
    if (g.installPath && !(await pathExists(g.installPath))) continue
    valid.push(g)
  }

  valid.sort((a, b) => a.name.localeCompare(b.name))
  return valid
}
