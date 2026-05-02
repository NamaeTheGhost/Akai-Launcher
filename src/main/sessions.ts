import { BrowserWindow } from 'electron'
import type { PlatformId } from '../preload/types'

export interface SessionGameInfo {
  id: string
  name: string
  platformId: PlatformId
  jp?: string
  installPath?: string
  launchExe?: string
  launchUri?: string
}

export interface Session extends SessionGameInfo {
  startedAt: number
}

export interface SessionState {
  current: Session | null
  recent: Session[]
}

const MAX_RECENT = 8

let current: Session | null = null
const recent: Session[] = []

function broadcast(): void {
  const state = getState()
  for (const w of BrowserWindow.getAllWindows()) {
    try {
      w.webContents.send('session:update', state)
    } catch {
      // ignore destroyed
    }
  }
}

export function startSession(info: SessionGameInfo): Session {
  current = { ...info, startedAt: Date.now() }
  const idx = recent.findIndex((r) => r.id === info.id)
  if (idx >= 0) recent.splice(idx, 1)
  recent.unshift(current)
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT
  broadcast()
  return current
}

export function endSession(): void {
  if (current) {
    current = null
    broadcast()
  }
}

export function getState(): SessionState {
  return { current, recent: [...recent] }
}

export function getCurrent(): Session | null {
  return current
}
