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

export async function scanGog(): Promise<Platform> {
  const platform: Platform = {
    id: 'gog',
    name: 'GOG GALAXY',
    jp: 'ゴグ',
    kanji: '銀',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const galaxyExe =
    (await regGetValue('HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\GalaxyClient\\paths', 'client')) ||
    (await regGetValue('HKLM\\SOFTWARE\\GOG.com\\GalaxyClient\\paths', 'client'))

  const candidates: string[] = []
  if (galaxyExe) candidates.push(normalizePath(galaxyExe))
  candidates.push('C:\\Program Files (x86)\\GOG Galaxy')
  candidates.push('C:\\Program Files\\GOG Galaxy')

  const foundLauncher = await firstExisting(candidates)

  // Even if launcher folder is missing, registry games keys may still exist.
  const games = await readGogGames()
  if (!foundLauncher && games.length === 0) return platform

  platform.installed = true
  platform.installPath = foundLauncher
  platform.launchUri = 'goggalaxy://'
  platform.games = games

  if (foundLauncher) {
    const exe = await firstExisting([path.join(foundLauncher, 'GalaxyClient.exe'), foundLauncher])
    if (exe) platform.launcherExe = exe
  }

  return platform
}

async function readGogGames(): Promise<Game[]> {
  const baseKeys = ['HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games', 'HKLM\\SOFTWARE\\GOG.com\\Games']
  const games: Game[] = []
  const seen = new Set<string>()

  for (const base of baseKeys) {
    const subs = await regListSubkeys(base)
    for (const id of subs) {
      if (seen.has(id)) continue
      const values = await regGetAllValues(`${base}\\${id}`)
      const name = values['gameName'] || values['GAMENAME']
      const installPathRaw = values['path'] || values['PATH']
      if (!name) continue
      const installPath = installPathRaw ? normalizePath(installPathRaw) : undefined
      if (installPath && !(await pathExists(installPath))) continue
      seen.add(id)
      const launchCmd = values['launchCommand'] || values['LAUNCHCOMMAND']
      games.push({
        id: `gog:${id}`,
        platformId: 'gog',
        name,
        appId: id,
        installPath,
        launchExe: launchCmd ? normalizePath(launchCmd) : undefined,
        launchUri: `goggalaxy://openGameView/${id}`
      })
    }
  }

  games.sort((a, b) => a.name.localeCompare(b.name))
  return games
}
