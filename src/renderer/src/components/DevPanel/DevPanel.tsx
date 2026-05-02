import { useEffect, useRef, useState } from 'react'
import { useDevTools } from '../../context/DevToolsContext'
import type { DevPanelTab } from '../../context/DevToolsContext'
import ComponentTreeTab from './ComponentTreeTab'
import StateInspectorTab from './StateInspectorTab'
import CssInspectorTab from './CssInspectorTab'
import PerfMonitorTab from './PerfMonitorTab'
import LoggerTab from './LoggerTab'
import StateEditorTab from './StateEditorTab'
import IpcMonitorTab from './IpcMonitorTab'
import EventTimelineTab from './EventTimelineTab'
import ThemeEditorTab from './ThemeEditorTab'
import PreferencesTab from './PreferencesTab'
import ComponentPickerTab from './ComponentPickerTab'
import ThrottleTab from './ThrottleTab'

type TabDef = {
  key: DevPanelTab
  label: string
  short: string
  color?: string
}

const TABS: TabDef[] = [
  { key: 'tree', label: 'Components', short: 'C' },
  { key: 'states', label: 'States', short: 'S' },
  { key: 'edit', label: 'State Editor', short: 'SE' },
  { key: 'css', label: 'CSS', short: 'CSS' },
  { key: 'perf', label: 'Perf', short: 'FPS' },
  { key: 'log', label: 'Logger', short: 'LOG', color: '#60a5fa' },
  { key: 'ipc', label: 'IPC Monitor', short: 'IPC' },
  { key: 'timeline', label: 'Timeline', short: 'EVT' },
  { key: 'pick', label: 'Picker', short: 'P' },
  { key: 'theme', label: 'Theme', short: 'TH', color: '#a78bfa' },
  { key: 'prefs', label: 'Preferences', short: 'PF' },
  { key: 'throttle', label: 'Throttle', short: 'TR', color: '#f59e0b' },
]

function DevPanel(): React.JSX.Element | null {
  const { open, activeTab, setActiveTab } = useDevTools()
  const panelRef = useRef<HTMLDivElement>(null)
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 440, h: 560 })
  const [pos, setPos] = useState({ x: window.innerWidth - 450, y: 40 })
  const dragging = useRef(false)
  const resizing = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = (e: React.MouseEvent): void => {
    if ((e.target as HTMLElement).closest('[data-resize]')) return
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  const onResizeDown = (e: React.MouseEvent): void => {
    e.stopPropagation()
    resizing.current = true
    offset.current = { x: e.clientX - size.w, y: e.clientY - size.h }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      if (dragging.current) {
        setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
      }
      if (resizing.current) {
        setSize({
          w: Math.max(320, e.clientX - offset.current.x),
          h: Math.max(200, e.clientY - offset.current.y),
        })
      }
    }
    const onUp = (): void => {
      dragging.current = false
      resizing.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  if (!open) return null

  const activeTabDef = TABS.find((t) => t.key === activeTab)

  return (
    <div
      ref={panelRef}
      className="dev-panel fixed z-[9999] flex flex-col border border-[#ece6d6]/20 bg-[#1a1a1a] text-[#ece6d6] shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Title bar */}
      <div
        onMouseDown={onMouseDown}
        className="flex cursor-move items-center justify-between border-b border-[#ece6d6]/10 bg-[#0a0a0a] px-2.5 py-1.5 select-none"
      >
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em]">
          <span className="text-vermillion">DEV</span>
          <span className="text-[#ece6d6]/30">/</span>
          <span className="text-[#ece6d6]/50">
            {activeTabDef?.label ?? 'TOOLS'}
          </span>
          <span className="ml-2 text-[8px] text-[#ece6d6]/20">Ctrl+Shift+D</span>
        </div>
        <button
          onClick={() => (dragging.current = false) || window.location.reload()}
          className="text-[8px] text-[#ece6d6]/20 hover:text-vermillion font-mono"
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Tab bar - scrollable */}
      <div ref={tabScrollRef} className="flex items-stretch overflow-x-auto border-b border-[#ece6d6]/10 bg-[#0a0a0a]/80 scrollbar-dev">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={[
              'shrink-0 border-r border-[#ece6d6]/5 px-2 py-1 font-mono text-[8px] font-bold tracking-[0.15em] transition-colors',
              activeTab === t.key
                ? 'bg-vermillion text-[#ece6d6]'
                : t.color
                ? `text-[#ece6d6]/50 hover:bg-[#ece6d6]/5`
                : 'text-[#ece6d6]/40 hover:text-[#ece6d6]/70 hover:bg-[#ece6d6]/5',
            ].join(' ')}
            title={t.label}
          >
            {t.short}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="scrollbar-dev flex-1 overflow-y-auto">
        {activeTab === 'tree' && <ComponentTreeTab />}
        {activeTab === 'states' && <StateInspectorTab />}
        {activeTab === 'css' && <CssInspectorTab />}
        {activeTab === 'perf' && <PerfMonitorTab />}
        {activeTab === 'log' && <LoggerTab />}
        {activeTab === 'edit' && <StateEditorTab />}
        {activeTab === 'ipc' && <IpcMonitorTab />}
        {activeTab === 'timeline' && <EventTimelineTab />}
        {activeTab === 'theme' && <ThemeEditorTab />}
        {activeTab === 'prefs' && <PreferencesTab />}
        {activeTab === 'pick' && <ComponentPickerTab />}
        {activeTab === 'throttle' && <ThrottleTab />}
      </div>

      {/* Resize handle */}
      <div
        data-resize
        onMouseDown={onResizeDown}
        className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="absolute bottom-0.5 right-0.5 opacity-20">
          <path d="M12 0v12H0" stroke="#ece6d6" strokeWidth="1" fill="none" />
          <path d="M12 4v8H4" stroke="#ece6d6" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </div>
  )
}

export default DevPanel
