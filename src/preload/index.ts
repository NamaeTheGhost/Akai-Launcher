import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AddCollectionInput,
  AddCustomGameInput,
  LaunchGameInput,
  LibraryState,
  PickFileOptions,
  ScanResult,
  SessionState,
  UpdateCollectionInput,
  UpdateCustomGameInput
} from './types'

const isOverlay = (): boolean => {
  try {
    const search = typeof window !== 'undefined' ? (window.location?.search ?? '') : ''
    return /(?:^|[?&])overlay=1\b/.test(search)
  } catch {
    return false
  }
}

const api = {
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
    close: (): void => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
    onMaximizeStateChange: (callback: (maximized: boolean) => void): (() => void) => {
      const listener = (_: unknown, value: boolean): void => callback(value)
      ipcRenderer.on('window:maximize-state', listener)
      return () => {
        ipcRenderer.removeListener('window:maximize-state', listener)
      }
    }
  },
  launcher: {
    scanPlatforms: (): Promise<ScanResult> => ipcRenderer.invoke('scan:platforms'),
    openUri: (uri: string): Promise<boolean> => ipcRenderer.invoke('launcher:open-uri', uri),
    openPath: (target: string): Promise<string> => ipcRenderer.invoke('launcher:open-path', target),
    showInFolder: (target: string): Promise<boolean> =>
      ipcRenderer.invoke('launcher:show-in-folder', target),
    launchGame: (game: LaunchGameInput): Promise<boolean> =>
      ipcRenderer.invoke('launcher:launchGame', game)
  },
  library: {
    get: (): Promise<LibraryState> => ipcRenderer.invoke('library:get'),
    addCustomGame: (input: AddCustomGameInput): Promise<LibraryState> =>
      ipcRenderer.invoke('library:addCustomGame', input),
    updateCustomGame: (id: string, patch: UpdateCustomGameInput): Promise<LibraryState> =>
      ipcRenderer.invoke('library:updateCustomGame', id, patch),
    removeCustomGame: (id: string): Promise<LibraryState> =>
      ipcRenderer.invoke('library:removeCustomGame', id),
    addCollection: (input: AddCollectionInput): Promise<LibraryState> =>
      ipcRenderer.invoke('library:addCollection', input),
    updateCollection: (id: string, patch: UpdateCollectionInput): Promise<LibraryState> =>
      ipcRenderer.invoke('library:updateCollection', id, patch),
    removeCollection: (id: string): Promise<LibraryState> =>
      ipcRenderer.invoke('library:removeCollection', id),
    addGameToCollection: (collectionId: string, gameId: string): Promise<LibraryState> =>
      ipcRenderer.invoke('library:addGameToCollection', collectionId, gameId),
    removeGameFromCollection: (collectionId: string, gameId: string): Promise<LibraryState> =>
      ipcRenderer.invoke('library:removeGameFromCollection', collectionId, gameId),
    pickFile: (opts?: PickFileOptions): Promise<string | null> =>
      ipcRenderer.invoke('library:pickFile', opts)
  },
  session: {
    get: (): Promise<SessionState> => ipcRenderer.invoke('session:get'),
    end: (): Promise<SessionState> => ipcRenderer.invoke('session:end'),
    kill: (): Promise<boolean> => ipcRenderer.invoke('session:kill'),
    returnToLauncher: (): Promise<boolean> => ipcRenderer.invoke('session:return-to-launcher'),
    onUpdate: (cb: (state: SessionState) => void): (() => void) => {
      const listener = (_: unknown, state: SessionState): void => cb(state)
      ipcRenderer.on('session:update', listener)
      return () => {
        ipcRenderer.removeListener('session:update', listener)
      }
    }
  },
  overlay: {
    show: (): Promise<boolean> => ipcRenderer.invoke('overlay:show'),
    hide: (): Promise<boolean> => ipcRenderer.invoke('overlay:hide'),
    toggle: (): Promise<boolean> => ipcRenderer.invoke('overlay:toggle'),
    getShortcut: (): Promise<string> => ipcRenderer.invoke('overlay:get-shortcut'),
    isOverlayWindow: (): boolean => isOverlay()
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
