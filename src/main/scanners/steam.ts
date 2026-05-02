import path from 'path'
import { promises as fs } from 'fs'
import {
  firstExisting,
  normalizePath,
  parseVdf,
  pathExists,
  readTextFile,
  regGetValue
} from './util'
import type { Game, Platform } from './types'

export async function scanSteam(): Promise<Platform> {
  const platform: Platform = {
    id: 'steam',
    name: 'STEAM',
    jp: 'スチーム',
    kanji: '蒸',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const installPath = await detectSteamPath()
  if (!installPath) return platform

  platform.installed = true
  platform.installPath = installPath
  const exe = path.join(installPath, 'steam.exe')
  if (await pathExists(exe)) platform.launcherExe = exe
  platform.launchUri = 'steam://open/main'

  try {
    platform.games = await readSteamLibrary(installPath)
  } catch (err) {
    platform.error = err instanceof Error ? err.message : String(err)
  }

  return platform
}

async function detectSteamPath(): Promise<string | undefined> {
  const candidates: (string | null)[] = []

  candidates.push(await regGetValue('HKCU\\Software\\Valve\\Steam', 'SteamPath'))
  candidates.push(await regGetValue('HKLM\\SOFTWARE\\Valve\\Steam', 'InstallPath', '64'))
  candidates.push(await regGetValue('HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'))

  const cleaned = candidates.filter((c): c is string => !!c).map((c) => normalizePath(c))

  cleaned.push('C:\\Program Files (x86)\\Steam')
  cleaned.push('C:\\Program Files\\Steam')

  return firstExisting(cleaned)
}

async function readSteamLibrary(steamPath: string): Promise<Game[]> {
  const libsFile = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
  const text = await readTextFile(libsFile)
  const libraryRoots: string[] = [path.join(steamPath, 'steamapps')]

  if (text) {
    try {
      const parsed = parseVdf(text)
      const folders =
        (parsed['libraryfolders'] as Record<string, unknown>) ||
        (parsed['LibraryFolders'] as Record<string, unknown>) ||
        {}
      for (const key of Object.keys(folders)) {
        const node = folders[key]
        if (node && typeof node === 'object') {
          const nodeObj = node as Record<string, unknown>
          const p = nodeObj['path']
          if (typeof p === 'string') {
            libraryRoots.push(path.join(normalizePath(p), 'steamapps'))
          }
        } else if (typeof node === 'string' && /^\d+$/.test(key)) {
          libraryRoots.push(path.join(normalizePath(node), 'steamapps'))
        }
      }
    } catch {
      // ignore
    }
  }

  const seen = new Set<string>()
  const games: Game[] = []

  for (const lib of libraryRoots) {
    if (seen.has(lib)) continue
    seen.add(lib)
    if (!(await pathExists(lib))) continue

    let entries: string[] = []
    try {
      entries = await fs.readdir(lib)
    } catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.startsWith('appmanifest_') || !entry.endsWith('.acf')) continue
      const manifestPath = path.join(lib, entry)
      const manifestText = await readTextFile(manifestPath)
      if (!manifestText) continue
      try {
        const parsed = parseVdf(manifestText)
        const state = (parsed['AppState'] as Record<string, unknown>) || {}
        const appId = String(state['appid'] ?? '').trim()
        const name = String(state['name'] ?? '').trim()
        const installdir = String(state['installdir'] ?? '').trim()
        const sizeStr = String(state['SizeOnDisk'] ?? '').trim()
        if (!appId || !name) continue

        const installPath = installdir ? path.join(lib, 'common', installdir) : undefined

        games.push({
          id: `steam:${appId}`,
          platformId: 'steam',
          name,
          appId,
          installDir: installdir || undefined,
          installPath,
          sizeBytes: sizeStr ? Number(sizeStr) || undefined : undefined,
          launchUri: `steam://rungameid/${appId}`
        })
      } catch {
        // ignore broken manifests
      }
    }
  }

  games.sort((a, b) => a.name.localeCompare(b.name))
  return games
}
