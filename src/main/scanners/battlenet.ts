import path from 'path'
import {
  firstExisting,
  normalizePath,
  pathExists,
  regGetAllValues,
  regGetValue,
  regListSubkeys
} from './util'
import type { Game, Platform } from './types'

const KNOWN_GAMES: { name: string; uri: string; folderHints: string[] }[] = [
  {
    name: 'World of Warcraft',
    uri: 'battlenet://wow',
    folderHints: ['World of Warcraft']
  },
  {
    name: 'Diablo IV',
    uri: 'battlenet://fenris',
    folderHints: ['Diablo IV']
  },
  {
    name: 'Diablo III',
    uri: 'battlenet://d3',
    folderHints: ['Diablo III']
  },
  {
    name: 'Diablo II: Resurrected',
    uri: 'battlenet://osi',
    folderHints: ['Diablo II Resurrected']
  },
  {
    name: 'Overwatch',
    uri: 'battlenet://prometheus',
    folderHints: ['Overwatch', 'Overwatch 2']
  },
  {
    name: 'Hearthstone',
    uri: 'battlenet://wtcg',
    folderHints: ['Hearthstone']
  },
  {
    name: 'StarCraft II',
    uri: 'battlenet://s2',
    folderHints: ['StarCraft II']
  },
  {
    name: 'StarCraft Remastered',
    uri: 'battlenet://s1',
    folderHints: ['StarCraft']
  },
  {
    name: 'Heroes of the Storm',
    uri: 'battlenet://hero',
    folderHints: ['Heroes of the Storm']
  },
  {
    name: 'Call of Duty',
    uri: 'battlenet://viper',
    folderHints: ['Call of Duty']
  }
]

export async function scanBattleNet(): Promise<Platform> {
  const platform: Platform = {
    id: 'battlenet',
    name: 'BATTLE.NET',
    jp: 'バトル',
    kanji: '戦',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const launcherDir =
    (await regGetValue(
      'HKLM\\SOFTWARE\\WOW6432Node\\Blizzard Entertainment\\Battle.net',
      'InstallPath'
    )) || (await regGetValue('HKLM\\SOFTWARE\\Blizzard Entertainment\\Battle.net', 'InstallPath'))

  const candidates: string[] = []
  if (launcherDir) candidates.push(normalizePath(launcherDir))
  candidates.push('C:\\Program Files (x86)\\Battle.net')
  candidates.push('C:\\Program Files\\Battle.net')

  const installPath = await firstExisting(candidates)

  // Inspect uninstall entries to find Blizzard games installed.
  const games = await scanBlizzardUninstall()

  // Fallback: probe known install folders.
  const folderRoots = ['C:\\Program Files (x86)', 'C:\\Program Files', 'C:\\Games']
  for (const known of KNOWN_GAMES) {
    if (games.find((g) => g.name === known.name)) continue
    for (const hint of known.folderHints) {
      const found = await firstExisting(folderRoots.map((r) => path.join(r, hint)))
      if (found) {
        games.push({
          id: `battlenet:${known.name.replace(/\s+/g, '_').toLowerCase()}`,
          platformId: 'battlenet',
          name: known.name,
          installPath: found,
          launchUri: known.uri
        })
        break
      }
    }
  }

  if (!installPath && games.length === 0) return platform

  platform.installed = true
  platform.installPath = installPath
  platform.launchUri = 'battlenet://'
  if (installPath) {
    const exe = await firstExisting([
      path.join(installPath, 'Battle.net Launcher.exe'),
      path.join(installPath, 'Battle.net.exe'),
      installPath
    ])
    if (exe) platform.launcherExe = exe
  }
  platform.games = games.sort((a, b) => a.name.localeCompare(b.name))
  return platform
}

async function scanBlizzardUninstall(): Promise<Game[]> {
  const bases = [
    'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
  ]
  const games: Game[] = []
  const seen = new Set<string>()

  for (const base of bases) {
    const subs = await regListSubkeys(base)
    // Only inspect entries whose name suggests Blizzard / Battle.net.
    for (const id of subs) {
      if (
        !id ||
        (!id.toLowerCase().startsWith('battle.net') &&
          !KNOWN_GAMES.some((k) => id.toLowerCase().includes(k.name.split(' ')[0].toLowerCase())))
      ) {
        continue
      }
      const values = await regGetAllValues(`${base}\\${id}`)
      const publisher = values['Publisher'] || ''
      if (!/blizzard/i.test(publisher) && !/battle\.net/i.test(id)) continue
      const name = values['DisplayName']
      if (!name || /battle\.net/i.test(name)) continue
      const installPathRaw = values['InstallLocation'] || values['DisplayIcon']
      const installPath = installPathRaw
        ? normalizePath(installPathRaw.replace(/\\[^\\]+\.exe.*$/i, ''))
        : undefined
      if (installPath && !(await pathExists(installPath))) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)

      const known = KNOWN_GAMES.find((k) => name.toLowerCase().includes(k.name.toLowerCase()))
      games.push({
        id: `battlenet:${id}`,
        platformId: 'battlenet',
        name,
        installPath,
        launchUri: known?.uri
      })
    }
  }

  return games
}
