import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppAPI } from './types'

export type {
  AppAPI,
  LauncherAPI,
  WindowAPI,
  LibraryAPI,
  SessionAPI,
  OverlayAPI,
  Session,
  SessionState,
  LaunchGameInput,
  ScanResult,
  Platform,
  PlatformId,
  Game,
  CustomGame,
  Collection,
  LibraryState,
  AddCustomGameInput,
  UpdateCustomGameInput,
  AddCollectionInput,
  UpdateCollectionInput,
  PickFileOptions
} from './types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
