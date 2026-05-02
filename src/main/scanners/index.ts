import os from 'os'
import { scanSteam } from './steam'
import { scanEpic } from './epic'
import { scanGog } from './gog'
import { scanUbisoft } from './ubisoft'
import { scanEa, scanOrigin } from './ea'
import { scanBattleNet } from './battlenet'
import { scanRiot } from './riot'
import { scanXbox } from './xbox'
import type { Platform, ScanResult } from './types'

/**
 * Run all platform scanners in parallel. Each scanner is independently
 * resilient and never throws — failures show up as `error` on the platform.
 */
export async function scanAllPlatforms(): Promise<ScanResult> {
  const startedAt = Date.now()

  const tasks: Promise<Platform>[] = [
    scanSteam(),
    scanEpic(),
    scanGog(),
    scanUbisoft(),
    scanEa(),
    scanOrigin(),
    scanBattleNet(),
    scanRiot(),
    scanXbox()
  ]

  const platforms = await Promise.all(
    tasks.map((p) =>
      p.catch<Platform>((err) => ({
        id: 'steam',
        name: 'UNKNOWN',
        jp: '',
        kanji: '?',
        installed: false,
        scannedAt: Date.now(),
        games: [],
        error: err instanceof Error ? err.message : String(err)
      }))
    )
  )

  return {
    scannedAt: startedAt,
    platform: process.platform,
    arch: os.arch(),
    platforms
  }
}

export type { ScanResult, Platform } from './types'
export type { Game } from './types'
