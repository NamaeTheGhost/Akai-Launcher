import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let overlayWin: BrowserWindow | null = null

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWin && !overlayWin.isDestroyed() ? overlayWin : null
}

export function createOverlayWindow(): BrowserWindow {
  const existing = getOverlayWindow()
  if (existing) return existing

  const display = screen.getPrimaryDisplay()
  const w = 380
  const h = 560

  overlayWin = new BrowserWindow({
    width: w,
    height: h,
    x: display.workArea.x + display.workArea.width - w - 24,
    y: display.workArea.y + 24,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    // Non-activating window: clicks fire button handlers but DO NOT steal focus
    // from the underlying game (Windows applies WS_EX_NOACTIVATE).
    focusable: false,
    acceptFirstMouse: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  overlayWin.setAlwaysOnTop(true, 'screen-saver')
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // Belt-and-braces: re-assert non-focusable after creation in case of window reuse.
  overlayWin.setFocusable(false)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWin.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?overlay=1`)
  } else {
    overlayWin.loadFile(join(__dirname, '../renderer/index.html'), { search: 'overlay=1' })
  }

  overlayWin.on('closed', () => {
    overlayWin = null
  })

  return overlayWin
}

export function showOverlay(focus = false): void {
  const w = createOverlayWindow()
  if (focus) w.show()
  else w.showInactive()
}

export function hideOverlay(): void {
  const w = getOverlayWindow()
  if (w) w.hide()
}

export function toggleOverlay(): void {
  const w = createOverlayWindow()
  if (w.isVisible()) w.hide()
  else w.showInactive()
}
