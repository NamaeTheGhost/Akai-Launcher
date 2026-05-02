import path from 'path'
import { firstExisting, normalizePath, pathExists, regGetAllValues } from './util'
import type { Game, Platform } from './types'

const KNOWN_RIOT_GAMES: { name: string; folders: string[]; uri?: string }[] = [
  {
    name: 'League of Legends',
    folders: [
      'C:\\Riot Games\\League of Legends',
      'C:\\Program Files\\Riot Games\\League of Legends',
      'C:\\Program Files (x86)\\Riot Games\\League of Legends'
    ]
  },
  {
    name: 'VALORANT',
    folders: [
      'C:\\Riot Games\\VALORANT',
      'C:\\Program Files\\Riot Games\\VALORANT',
      'C:\\Program Files (x86)\\Riot Games\\VALORANT'
    ]
  },
  {
    name: 'Legends of Runeterra',
    folders: ['C:\\Riot Games\\LoR', 'C:\\Program Files\\Riot Games\\LoR']
  },
  {
    name: 'Teamfight Tactics',
    folders: ['C:\\Riot Games\\Teamfight Tactics']
  }
]

export async function scanRiot(): Promise<Platform> {
  const platform: Platform = {
    id: 'riot',
    name: 'RIOT CLIENT',
    jp: 'ライオット',
    kanji: '騒',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  // RiotClientInstalls registers each installed product's exe.
  const installs = await regGetAllValues('HKCU\\Software\\Riot Games\\RiotClientInstalls')

  const candidateExes: string[] = []
  for (const v of Object.values(installs)) {
    const p = normalizePath(v)
    if (p) candidateExes.push(p)
  }
  candidateExes.push('C:\\Riot Games\\Riot Client\\RiotClientServices.exe')
  candidateExes.push('C:\\Program Files\\Riot Games\\Riot Client\\RiotClientServices.exe')

  const launcherExe = await firstExisting(candidateExes)

  const games: Game[] = []
  for (const known of KNOWN_RIOT_GAMES) {
    const found = await firstExisting(known.folders)
    if (!found) continue
    games.push({
      id: `riot:${known.name.replace(/\s+/g, '_').toLowerCase()}`,
      platformId: 'riot',
      name: known.name,
      installPath: found
    })
  }

  if (!launcherExe && games.length === 0) return platform

  platform.installed = true
  platform.launcherExe = launcherExe
  if (launcherExe) platform.installPath = path.dirname(launcherExe)
  platform.games = games.sort((a, b) => a.name.localeCompare(b.name))

  // Construct launchers for known products via Riot Client URI.
  for (const g of platform.games) {
    if (g.name === 'League of Legends') {
      g.launchUri = `${launcherExe ?? ''}`
    }
  }

  if (platform.installPath && !(await pathExists(platform.installPath))) {
    platform.installPath = undefined
  }

  return platform
}
