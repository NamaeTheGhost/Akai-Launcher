import { NavLink, Outlet } from 'react-router-dom'
import Titlebar from './Titlebar'
import StatusBar from './StatusBar'
import GameDetails from './GameDetails'
import { usePreferences } from '../context/usePreferences'

type NavItem = {
  to: string
  end?: boolean
  code: string
  en: string
  jp: string
}

const NAV: NavItem[] = [
  { to: '/', end: true, code: '01', en: 'HOME', jp: '家' },
  { to: '/library', code: '02', en: 'LIBRARY', jp: '書庫' },
  { to: '/about', code: '03', en: 'ABOUT', jp: '情報' },
  { to: '/settings', code: '04', en: 'CONFIG', jp: '設定' }
]

function Layout(): React.JSX.Element {
  const { theme, toggleTheme } = usePreferences()
  const isDark = theme === 'INK'
  return (
    <div className="bg-paper-grain bg-noise flex h-screen w-screen flex-col text-ink">
      <Titlebar />

      <div className="flex min-h-0 flex-1">
        {/* SIDEBAR */}
        <aside className="flex w-[88px] flex-col border-r-[3px] border-ink bg-bone">
          {/* Logo block */}
          <div className="flex h-[88px] flex-col items-center justify-center border-b-[3px] border-ink bg-ink text-bone">
            <span className="font-jp-serif text-[28px] font-black leading-none">名</span>
            <span className="mt-1 font-mono text-[8px] tracking-[0.25em]">N/T</span>
          </div>

          {/* Nav */}
          <nav className="flex flex-1 flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'group relative flex h-[88px] flex-col items-center justify-center border-b-[3px] border-ink transition-colors',
                    isActive ? 'bg-ink text-bone' : 'text-ink hover:bg-ink hover:text-bone'
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="font-jp text-[22px] font-black leading-none">{item.jp}</span>
                    <span className="mt-1.5 font-mono text-[9px] font-bold tracking-[0.25em]">
                      {item.en}
                    </span>
                    {isActive ? (
                      <span className="absolute left-0 top-0 h-full w-[6px] bg-vermillion" />
                    ) : null}
                    <span className="absolute right-1.5 top-1.5 font-mono text-[8px] tracking-widest opacity-50">
                      {item.code}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* THEME TOGGLE */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to PAPER (light)' : 'Switch to INK (dark)'}
            aria-label="Toggle theme"
            className={[
              'brutal-focus group relative flex h-[64px] flex-col items-center justify-center border-t-[3px] border-ink transition-colors',
              isDark
                ? 'bg-bone text-ink hover:bg-vermillion hover:text-bone'
                : 'bg-ink text-bone hover:bg-vermillion'
            ].join(' ')}
          >
            <span className="font-jp-serif text-[20px] font-black leading-none">
              {isDark ? '日' : '月'}
            </span>
            <span className="mt-1 font-mono text-[8px] font-bold tracking-[0.25em]">
              {isDark ? 'PAPER' : 'INK'}
            </span>
            <span className="absolute right-1.5 top-1.5 font-mono text-[8px] tracking-widest opacity-50">
              T/H
            </span>
          </button>

          {/* Vertical JP label */}
          <div className="flex items-center justify-center border-t-[3px] border-ink py-4">
            <span className="vertical-rl font-jp-serif text-[11px] font-bold tracking-[0.4em] text-ink/70">
              起動装置 · 二〇二六
            </span>
          </div>
        </aside>

        {/* MAIN */}
        <main className="scrollbar-brutal min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <StatusBar />
      <GameDetails />
    </div>
  )
}

export default Layout
