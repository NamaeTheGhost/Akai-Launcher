import path from 'path'
import { firstExisting, normalizePath, pathExists, regGetValue } from './util'
import type { Platform } from './types'

export async function scanEa(): Promise<Platform> {
  const platform: Platform = {
    id: 'ea',
    name: 'EA APP',
    jp: 'イーエー',
    kanji: '電',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const desktopPath =
    (await regGetValue(
      'HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts\\EA Desktop',
      'DesktopAppPath'
    )) ||
    (await regGetValue('HKLM\\SOFTWARE\\Electronic Arts\\EA Desktop', 'DesktopAppPath')) ||
    (await regGetValue(
      'HKLM\\SOFTWARE\\WOW6432Node\\Electronic Arts\\EA Desktop',
      'InstallLocation'
    ))

  const candidates: string[] = []
  if (desktopPath) candidates.push(normalizePath(desktopPath))
  candidates.push('C:\\Program Files\\Electronic Arts\\EA Desktop\\EA Desktop')
  candidates.push('C:\\Program Files (x86)\\Electronic Arts\\EA Desktop\\EA Desktop')
  candidates.push('C:\\Program Files\\Electronic Arts\\EA Desktop')

  const installPath = await firstExisting(candidates)
  if (!installPath) return platform

  platform.installed = true
  platform.installPath = installPath
  platform.launchUri = 'origin://'
  const exe = await firstExisting([
    path.join(installPath, 'EADesktop.exe'),
    path.join(installPath, 'EALauncher.exe'),
    installPath
  ])
  if (exe && (await pathExists(exe))) platform.launcherExe = exe

  return platform
}

export async function scanOrigin(): Promise<Platform> {
  const platform: Platform = {
    id: 'origin',
    name: 'ORIGIN',
    jp: 'オリジン',
    kanji: '源',
    installed: false,
    scannedAt: Date.now(),
    games: []
  }

  const originPath =
    (await regGetValue('HKLM\\SOFTWARE\\WOW6432Node\\Origin', 'ClientPath')) ||
    (await regGetValue('HKLM\\SOFTWARE\\Origin', 'ClientPath')) ||
    (await regGetValue('HKLM\\SOFTWARE\\WOW6432Node\\Origin', 'OriginPath'))

  const candidates: string[] = []
  if (originPath) candidates.push(normalizePath(originPath))
  candidates.push('C:\\Program Files (x86)\\Origin')
  candidates.push('C:\\Program Files\\Origin')

  const installPath = await firstExisting(candidates)
  if (!installPath) return platform

  platform.installed = true
  platform.installPath = installPath
  platform.launchUri = 'origin://'
  const exe = await firstExisting([path.join(installPath, 'Origin.exe'), installPath])
  if (exe) platform.launcherExe = exe

  return platform
}
