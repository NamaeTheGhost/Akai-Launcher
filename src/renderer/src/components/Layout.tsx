import { NavLink, Outlet } from 'react-router-dom'
import Titlebar from './Titlebar'
import StatusBar from './StatusBar'
import GameDetails from './GameDetails'
import DevPanel from './DevPanel/DevPanel'
import { usePreferences } from '../context/usePreferences'

type NavItem = {
  to: string
  end?: boolean
  en: string
  jp: string
}

const NAV: NavItem[] = [
  { to: '/', end: true, en: 'HOME', jp: 'ホーム' },
  { to: '/library', en: 'LIBRARY', jp: '書庫' },
  { to: '/about', en: 'ABOUT', jp: '情報' },
  { to: '/settings', en: 'CONFIG', jp: '設定' }
]

function Layout(): React.JSX.Element {
  const { theme, toggleTheme } = usePreferences()
  const isDark = theme === 'INK'
  return (
    <div className="bg-paper-grain flex h-screen w-screen flex-col text-ink">
      <Titlebar />

      <div className="flex min-h-0 flex-1">
        {/* SIDEBAR */}
        <aside className="flex w-[60px] flex-col border-r border-ink/20 bg-bone">
          {/* Nav */}
          <nav className="flex flex-1 flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'group relative flex h-[60px] flex-col items-center justify-center border-b border-ink/10 transition-colors',
                    isActive ? 'bg-ink text-bone' : 'text-ink/60 hover:bg-ink/10 hover:text-ink'
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="font-jp text-[16px] font-semibold leading-none">{item.jp}</span>
                    <span className="mt-0.5 font-mono text-[7px] font-medium tracking-[0.15em]">
                      {item.en}
                    </span>
                    {isActive ? (
                      <span className="absolute left-0 top-0 h-full w-[3px] bg-vermillion" />
                    ) : null}
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
              'flex h-[48px] flex-col items-center justify-center border-t border-ink/10 transition-colors',
              isDark
                ? 'text-ink/60 hover:bg-vermillion hover:text-bone'
                : 'text-ink/60 hover:bg-vermillion hover:text-bone'
            ].join(' ')}
          >
            <span className="font-jp-serif text-[14px] font-bold leading-none">
              {isDark ? '日' : '月'}
            </span>
          </button>
        </aside>

        {/* MAIN */}
        <main className="scrollbar-brutal min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <StatusBar />
      <GameDetails />
      <DevPanel />
    </div>
  )
}

export default Layout
