import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  Tray,
  Menu,
  nativeImage
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { scanAllPlatforms } from './scanners'
import {
  addCollection,
  addCustomGame,
  addGameToCollection,
  loadLibrary,
  removeCollection,
  removeCustomGame,
  removeGameFromCollection,
  updateCollection,
  updateCustomGame
} from './library/store'
import type {
  AddCollectionInput,
  AddCustomGameInput,
  UpdateCollectionInput,
  UpdateCustomGameInput
} from './library/types'
import {
  endSession,
  getState as getSessionState,
  startSession,
  type SessionGameInfo
} from './sessions'
import {
  createOverlayWindow,
  getOverlayWindow as getOverlayWindowSafe,
  hideOverlay,
  showOverlay,
  toggleOverlay
} from './overlay'
import { clearActive, killActive, launchGame as launchGameProcess } from './launch'

interface PickFileOptions {
  title?: string
  directory?: boolean
  filters?: { name: string; extensions: string[] }[]
}

const OVERLAY_SHORTCUT = 'Shift+Alt+L'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

function restoreMainWindow(): void {
  const w = getMainWindow()
  if (!w) return
  if (w.isMinimized()) w.restore()
  if (!w.isVisible()) w.show()
  w.focus()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#ECE6D6',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximize-state', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximize-state', false)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    // Tear down overlay too so app exits cleanly on close.
    const ov = getOverlayWindowSafe()
    if (ov) ov.destroy()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  if (tray) return
  try {
    const img = nativeImage.createFromPath(icon)
    const trayImg = img.isEmpty()
      ? nativeImage.createEmpty()
      : img.resize({ width: 16, height: 16 })
    tray = new Tray(trayImg.isEmpty() ? icon : trayImg)
  } catch {
    tray = new Tray(icon)
  }
  tray.setToolTip('NAMAETYPE LAUNCHER · 名前')
  const rebuildMenu = (): void => {
    if (!tray) return
    const session = getSessionState().current
    const menu = Menu.buildFromTemplate([
      {
        label: session ? `▸ PLAYING: ${session.name}` : 'No active session',
        enabled: false
      },
      { type: 'separator' },
      { label: 'Open Launcher', click: () => restoreMainWindow() },
      { label: `Toggle Overlay  (${OVERLAY_SHORTCUT})`, click: () => toggleOverlay() },
      session
        ? { label: 'End Session', click: () => endSession() }
        : { label: 'End Session', enabled: false },
      { type: 'separator' },
      { label: 'Quit', click: () => app.exit(0) }
    ])
    tray.setContextMenu(menu)
  }
  rebuildMenu()
  tray.on('click', () => restoreMainWindow())
  tray.on('double-click', () => restoreMainWindow())

  // Rebuild menu when session updates so labels stay accurate
  ipcMain.on('__session_internal_changed', rebuildMenu)
}

function broadcastSession(): void {
  const state = getSessionState()
  for (const w of BrowserWindow.getAllWindows()) {
    try {
      w.webContents.send('session:update', state)
    } catch {
      // ignore
    }
  }
  // also nudge tray
  ipcMain.emit('__session_internal_changed')
}

function handleAutoSessionEnd(): void {
  // Called when the launched child process exits naturally
  endSession()
  broadcastSession()
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })

  ipcMain.on('window:toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })

  ipcMain.handle('window:is-maximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  ipcMain.handle('scan:platforms', async () => {
    return scanAllPlatforms()
  })

  ipcMain.handle('launcher:open-uri', async (_event, uri: string) => {
    if (typeof uri !== 'string' || uri.length === 0) return false
    try {
      await shell.openExternal(uri)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('launcher:open-path', async (_event, target: string) => {
    if (typeof target !== 'string' || target.length === 0) return ''
    return shell.openPath(target)
  })

  ipcMain.handle('launcher:show-in-folder', async (_event, target: string) => {
    if (typeof target !== 'string' || target.length === 0) return false
    try {
      shell.showItemInFolder(target)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('launcher:launchGame', async (_event, payload: SessionGameInfo) => {
    if (!payload?.id || !payload?.name) return false
    const result = await launchGameProcess(payload, handleAutoSessionEnd)
    if (result.ok) {
      startSession(payload)
      broadcastSession()
      const w = getMainWindow()
      if (w) {
        if (w.isFullScreen()) w.setFullScreen(false)
        w.minimize()
      }
      // Show overlay (non-focused) so the in-game UI is visible after launch
      showOverlay(false)
    }
    return result.ok
  })

  ipcMain.handle('session:get', () => getSessionState())
  ipcMain.handle('session:end', () => {
    clearActive()
    endSession()
    broadcastSession()
    return getSessionState()
  })
  ipcMain.handle('session:kill', async () => {
    const ok = await killActive()
    endSession()
    broadcastSession()
    return ok
  })
  ipcMain.handle('session:return-to-launcher', () => {
    restoreMainWindow()
    hideOverlay()
    return true
  })

  ipcMain.handle('overlay:show', () => {
    showOverlay(false)
    return true
  })
  ipcMain.handle('overlay:hide', () => {
    hideOverlay()
    return true
  })
  ipcMain.handle('overlay:toggle', () => {
    toggleOverlay()
    return true
  })
  ipcMain.handle('overlay:get-shortcut', () => OVERLAY_SHORTCUT)

  ipcMain.handle('library:get', () => loadLibrary())
  ipcMain.handle('library:addCustomGame', (_e, input: AddCustomGameInput) => addCustomGame(input))
  ipcMain.handle('library:updateCustomGame', (_e, id: string, patch: UpdateCustomGameInput) =>
    updateCustomGame(id, patch)
  )
  ipcMain.handle('library:removeCustomGame', (_e, id: string) => removeCustomGame(id))
  ipcMain.handle('library:addCollection', (_e, input: AddCollectionInput) => addCollection(input))
  ipcMain.handle('library:updateCollection', (_e, id: string, patch: UpdateCollectionInput) =>
    updateCollection(id, patch)
  )
  ipcMain.handle('library:removeCollection', (_e, id: string) => removeCollection(id))
  ipcMain.handle('library:addGameToCollection', (_e, collectionId: string, gameId: string) =>
    addGameToCollection(collectionId, gameId)
  )
  ipcMain.handle('library:removeGameFromCollection', (_e, collectionId: string, gameId: string) =>
    removeGameFromCollection(collectionId, gameId)
  )

  ipcMain.handle('library:pickFile', async (event, opts?: PickFileOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const properties: ('openFile' | 'openDirectory')[] = opts?.directory
      ? ['openDirectory']
      : ['openFile']
    const dialogOpts: Electron.OpenDialogOptions = {
      title: opts?.title ?? (opts?.directory ? 'Select folder' : 'Select file'),
      properties
    }
    if (!opts?.directory) {
      dialogOpts.filters =
        opts?.filters && opts.filters.length > 0
          ? opts.filters
          : [
              { name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
              { name: 'All Files', extensions: ['*'] }
            ]
    }
    const result = win
      ? await dialog.showOpenDialog(win, dialogOpts)
      : await dialog.showOpenDialog(dialogOpts)
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  createWindow()
  createOverlayWindow()
  createTray()

  // Register global shortcut to toggle the overlay even while a game is focused
  try {
    globalShortcut.register(OVERLAY_SHORTCUT, () => {
      toggleOverlay()
    })
  } catch (err) {
    console.warn('Failed to register overlay shortcut', err)
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
