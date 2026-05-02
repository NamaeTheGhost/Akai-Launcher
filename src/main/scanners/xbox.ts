import { promises as fs } from 'fs'
import path from 'path'
import { firstExisting, pathExists, runCmd } from './util'
import type { Game, Platform } from './types'

export async function scanXbox(): Promise<Platform> {
  const platform: Platform = {
    id: 'xbox',
    name: 'XBOX',
    jp: 'エックス',
    kanji: '匣',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  // Detect Xbox / Gaming app via PowerShell AppX query.
  const pkgQuery = await runCmd('powershell', [
    '-NoProfile',
    '-Command',
    "Get-AppxPackage -Name 'Microsoft.GamingApp' | Select-Object -ExpandProperty PackageFamilyName"
  ])
  const installed = !!pkgQuery && /Microsoft\.GamingApp/i.test(pkgQuery)

  // Probe common Xbox PC games install roots.
  const roots = ['C:\\XboxGames', 'D:\\XboxGames', 'E:\\XboxGames', 'F:\\XboxGames']
  const games: Game[] = []
  for (const root of roots) {
    if (!(await pathExists(root))) continue
    let entries: string[] = []
    try {
      entries = await fs.readdir(root)
    } catch {
      continue
    }
    for (const entry of entries) {
      const full = path.join(root, entry)
      try {
        const stat = await fs.stat(full)
        if (!stat.isDirectory()) continue
      } catch {
        continue
      }
      games.push({
        id: `xbox:${entry}`,
        platformId: 'xbox',
        name: entry,
        installPath: full
      })
    }
  }

  if (!installed && games.length === 0) return platform

  platform.installed = true
  platform.launchUri = 'ms-xbox-pc-app://'
  platform.installPath = await firstExisting(roots)
  platform.games = games.sort((a, b) => a.name.localeCompare(b.name))

  return platform
}
