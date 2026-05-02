import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ScanProvider } from './context/ScanContext'
import { PreferencesProvider } from './context/PreferencesContext'
import OverlayApp from './overlay/OverlayApp'

const isOverlay =
  window.api?.overlay?.isOverlayWindow?.() ?? /[?&]overlay=1\b/.test(window.location.search)

if (isOverlay) {
  document.body.classList.add('overlay-mode')
}

const root = createRoot(document.getElementById('root')!)

if (isOverlay) {
  root.render(
    <StrictMode>
      <PreferencesProvider>
        <OverlayApp />
      </PreferencesProvider>
    </StrictMode>
  )
} else {
  root.render(
    <StrictMode>
      <PreferencesProvider>
        <ScanProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ScanProvider>
      </PreferencesProvider>
    </StrictMode>
  )
}
