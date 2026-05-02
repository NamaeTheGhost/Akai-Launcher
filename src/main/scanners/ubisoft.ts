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

export async function scanUbisoft(): Promise<Platform> {
  const platform: Platform = {
    id: 'ubisoft',
    name: 'UBISOFT CONNECT',
    jp: 'ユビ',
    kanji: '優',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const launcherDir =
    (await regGetValue('HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher', 'InstallDir')) ||
    (await regGetValue('HKLM\\SOFTWARE\\Ubisoft\\Launcher', 'InstallDir'))

  const candidates: string[] = []
  if (launcherDir) candidates.push(normalizePath(launcherDir))
  candidates.push('C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher')
  candidates.push('C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher')

  const installPath = await firstExisting(candidates)
  const games = await readUbisoftGames()

  if (!installPath && games.length === 0) return platform

  platform.installed = true
  platform.installPath = installPath
  platform.launchUri = 'uplay://'
  if (installPath) {
    const exe = await firstExisting([
      path.join(installPath, 'upc.exe'),
      path.join(installPath, 'UbisoftConnect.exe'),
      path.join(installPath, 'UbisoftGameLauncher.exe')
    ])
    if (exe) platform.launcherExe = exe
  }
  platform.games = games

  return platform
}

async function readUbisoftGames(): Promise<Game[]> {
  const baseKeys = [
    'HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs',
    'HKLM\\SOFTWARE\\Ubisoft\\Launcher\\Installs'
  ]
  const games: Game[] = []
  const seen = new Set<string>()

  for (const base of baseKeys) {
    const subs = await regListSubkeys(base)
    for (const id of subs) {
      if (seen.has(id)) continue
      const values = await regGetAllValues(`${base}\\${id}`)
      const installDirRaw = values['InstallDir']
      if (!installDirRaw) continue
      const installPath = normalizePath(installDirRaw)
      if (!(await pathExists(installPath))) continue
      seen.add(id)

      // Try to derive a friendly name from folder
      const folderName = path.basename(installPath.replace(/[\\/]+$/, ''))
      games.push({
        id: `ubisoft:${id}`,
        platformId: 'ubisoft',
        name: folderName || `Ubisoft #${id}`,
        appId: id,
        installPath,
        launchUri: `uplay://launch/${id}/0`
      })
    }
  }

  games.sort((a, b) => a.name.localeCompare(b.name))
  return games
}
