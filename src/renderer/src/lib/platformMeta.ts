import type { PlatformId } from '@preload/types'

export interface PlatformMeta {
  name: string
  jp: string
  kanji: string
}

export const PLATFORM_META: Record<PlatformId, PlatformMeta> = {
  steam: { name: 'STEAM', jp: 'スチーム', kanji: '蒸' },
  epic: { name: 'EPIC GAMES', jp: 'エピック', kanji: '叙' },
  gog: { name: 'GOG GALAXY', jp: 'ゴグ', kanji: '銀' },
  ubisoft: { name: 'UBISOFT CONNECT', jp: 'ユビ', kanji: '優' },
  ea: { name: 'EA APP', jp: 'イーエー', kanji: '電' },
  origin: { name: 'ORIGIN', jp: 'オリジン', kanji: '源' },
  battlenet: { name: 'BATTLE.NET', jp: 'バトル', kanji: '戦' },
  riot: { name: 'RIOT CLIENT', jp: 'ライオット', kanji: '騒' },
  xbox: { name: 'XBOX', jp: 'エックス', kanji: '匣' },
  custom: { name: 'CUSTOM', jp: '自作', kanji: '自' }
}

/** Auto-detected launcher platforms, in display order. */
export const AUTO_PLATFORMS: PlatformId[] = [
  'steam',
  'epic',
  'gog',
  'ubisoft',
  'ea',
  'origin',
  'battlenet',
  'riot',
  'xbox'
]

/** All platforms in display order (auto + user). */
export const ALL_PLATFORMS: PlatformId[] = [...AUTO_PLATFORMS, 'custom']

export function getPlatformMeta(id: PlatformId): PlatformMeta {
  return PLATFORM_META[id] ?? { name: id.toUpperCase(), jp: '', kanji: '?' }
}
