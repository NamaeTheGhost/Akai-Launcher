import { usePreferences } from '../context/usePreferences'
import type { DensityMode, ThemeMode } from '../context/preferencesValue'

function Settings(): React.JSX.Element {
  const {
    displayName,
    setDisplayName,
    theme,
    setTheme,
    density,
    setDensity,
    showJp,
    setShowJp,
    notifications,
    setNotifications,
    autoLaunch,
    setAutoLaunch,
    reset
  } = usePreferences()

  return (
    <div className="bg-paper-grain min-h-full">
      <div className="flex items-stretch border-b-[3px] border-ink">
        <div className="flex items-center gap-3 bg-ink px-4 font-mono text-[10px] uppercase tracking-[0.3em] text-bone">
          <span>SECTION_04</span>
          <span className="text-bone/50">/</span>
          <span className="font-jp tracking-[0.2em]">設定</span>
        </div>
        <div className="bg-stripes h-8 flex-1" />
      </div>

      <div className="p-8">
        <header className="flex items-end justify-between border-b-[3px] border-ink pb-4">
          <div>
            <div className="font-mono text-[11px] font-bold tracking-[0.4em] text-vermillion">
              ※ SETTEI / <span className="font-jp">設定</span>
            </div>
            <h1 className="mt-2 flex items-end gap-4 font-sans text-[64px] font-black leading-none tracking-[-0.04em]">
              CONFIG
              <span className="font-jp-serif text-[40px] font-bold text-ink/60">設定</span>
            </h1>
          </div>
          <button
            type="button"
            onClick={reset}
            className="brutal-focus border-[3px] border-ink bg-bone px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] hover:bg-ink hover:text-bone"
            title="Restore defaults"
          >
            RESET <span className="font-jp">初期化</span>
          </button>
        </header>

        <div className="mt-8 grid grid-cols-12 gap-6">
          {/* Identity */}
          <FieldGroup
            tag="01"
            label="IDENTITY"
            jp="識別"
            description="Display name shown across the launcher."
            jpDescription="起動装置全体に表示される名前。"
            className="col-span-12 lg:col-span-6"
          >
            <BrutalInput
              label="DISPLAY NAME"
              jp="表示名"
              value={displayName}
              onChange={setDisplayName}
              placeholder="enter name / 入力..."
            />
          </FieldGroup>

          {/* Theme */}
          <FieldGroup
            tag="02"
            label="SURFACE"
            jp="面"
            description="Choose the working surface tone."
            jpDescription="作業面の色調を選ぶ。"
            className="col-span-12 lg:col-span-6"
          >
            <Segmented
              value={theme}
              onChange={(v) => setTheme(v as ThemeMode)}
              options={[
                { value: 'PAPER', label: 'PAPER · LIGHT', jp: '紙' },
                { value: 'INK', label: 'INK · DARK', jp: '墨' }
              ]}
            />
          </FieldGroup>

          {/* Language / JP visibility */}
          <FieldGroup
            tag="03"
            label="LANGUAGE"
            jp="言語"
            description="Toggle Japanese typography across the UI."
            jpDescription="日本語表記の表示切替。"
            className="col-span-12 lg:col-span-6"
          >
            <Segmented
              value={showJp ? 'ON' : 'OFF'}
              onChange={(v) => setShowJp(v === 'ON')}
              options={[
                { value: 'ON', label: 'JP VISIBLE', jp: '表示' },
                { value: 'OFF', label: 'JP HIDDEN', jp: '非表示' }
              ]}
            />
            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-wide text-ink/55">
              When hidden, all kanji / kana labels collapse. Latin labels remain.
            </p>
          </FieldGroup>

          {/* Density */}
          <FieldGroup
            tag="04"
            label="DENSITY"
            jp="密度"
            description="Spacing rhythm of the grid."
            jpDescription="格子の間合い。"
            className="col-span-12 lg:col-span-6"
          >
            <Segmented
              value={density}
              onChange={(v) => setDensity(v as DensityMode)}
              options={[
                { value: 'COMPACT', label: 'COMPACT', jp: '密' },
                { value: 'NORMAL', label: 'NORMAL', jp: '中' },
                { value: 'WIDE', label: 'WIDE', jp: '疎' }
              ]}
            />
          </FieldGroup>

          {/* Toggles */}
          <FieldGroup
            tag="05"
            label="BEHAVIOR"
            jp="挙動"
            description="System level switches."
            jpDescription="系統の切替。"
            className="col-span-12 lg:col-span-6"
          >
            <div className="flex flex-col gap-0 border-[3px] border-ink">
              <Toggle
                label="NOTIFICATIONS"
                jp="通知"
                checked={notifications}
                onChange={setNotifications}
              />
              <div className="h-[3px] w-full bg-ink" />
              <Toggle
                label="AUTOLAUNCH ON BOOT"
                jp="自動起動"
                checked={autoLaunch}
                onChange={setAutoLaunch}
              />
            </div>
          </FieldGroup>

          {/* Preview */}
          <section className="col-span-12 border-[3px] border-ink bg-bone">
            <div className="border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone">
              PREVIEW · <span className="font-jp">確認</span>
            </div>
            <dl className="grid grid-cols-1 gap-0 sm:grid-cols-5">
              <Preview k="NAME" jp="名前" v={displayName || '—'} />
              <Preview k="SURFACE" jp="面" v={theme} />
              <Preview k="JP" jp="日本語" v={showJp ? 'ON' : 'OFF'} />
              <Preview k="DENSITY" jp="密度" v={density} />
              <Preview
                k="NOTIFY · AUTORUN"
                jp="通知・自動"
                v={`${notifications ? 'ON' : 'OFF'} · ${autoLaunch ? 'ON' : 'OFF'}`}
                last
              />
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}

function FieldGroup({
  tag,
  label,
  jp,
  description,
  jpDescription,
  className,
  children
}: {
  tag: string
  label: string
  jp: string
  description: string
  jpDescription: string
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className={`border-[3px] border-ink bg-bone ${className ?? ''}`}>
      <div className="flex items-center justify-between border-b-[3px] border-ink bg-ink px-4 py-2 font-mono text-[10px] font-bold tracking-[0.3em] text-bone">
        <div className="flex items-center gap-3">
          <span className="border-[2px] border-bone px-1.5">{tag}</span>
          <span>{label}</span>
          <span className="font-jp tracking-[0.2em]">{jp}</span>
        </div>
      </div>
      <div className="p-5">
        <p className="font-mono text-[11px] leading-relaxed tracking-wide text-ink/70">
          {description}
        </p>
        <p className="font-jp text-[12px] leading-relaxed tracking-[0.1em] text-ink/55">
          {jpDescription}
        </p>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  )
}

function BrutalInput({
  label,
  jp,
  value,
  onChange,
  placeholder
}: {
  label: string
  jp: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}): React.JSX.Element {
  return (
    <label className="flex items-stretch border-[3px] border-ink bg-bone">
      <div className="flex shrink-0 flex-col justify-center border-r-[3px] border-ink bg-ink px-3 py-2 font-mono text-[10px] font-bold tracking-[0.25em] text-bone">
        <span>{label}</span>
        <span className="mt-0.5 font-jp text-[10px] font-normal tracking-[0.2em] text-bone/70">
          {jp}
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-bone px-4 py-3 font-mono text-[13px] tracking-wide text-ink placeholder:text-ink/40 focus:outline-none brutal-focus"
      />
    </label>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; jp: string }[]
}): React.JSX.Element {
  return (
    <div className="flex items-stretch border-[3px] border-ink">
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'flex flex-1 flex-col items-center gap-0.5 px-3 py-3 font-mono text-[11px] font-bold tracking-[0.25em] transition-colors brutal-focus',
              i !== options.length - 1 ? 'border-r-[3px] border-ink' : '',
              active ? 'bg-ink text-bone' : 'bg-bone text-ink hover:bg-ink hover:text-bone'
            ].join(' ')}
          >
            <span>{opt.label}</span>
            <span className="font-jp text-[12px] tracking-normal opacity-80">{opt.jp}</span>
          </button>
        )
      })}
    </div>
  )
}

function Toggle({
  label,
  jp,
  checked,
  onChange
}: {
  label: string
  jp: string
  checked: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between bg-bone px-4 py-3 text-left transition-colors hover:bg-ink hover:text-bone brutal-focus"
    >
      <div className="flex flex-col">
        <span className="font-mono text-[11px] font-bold tracking-[0.25em]">{label}</span>
        <span className="font-jp text-[11px] tracking-[0.2em] opacity-65">{jp}</span>
      </div>
      <div className="flex items-center gap-0 border-[3px] border-current">
        <span
          className={[
            'px-3 py-1 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors',
            checked ? 'bg-vermillion text-bone' : 'opacity-50'
          ].join(' ')}
        >
          ON
        </span>
        <span className="block h-full w-[3px] bg-current" />
        <span
          className={[
            'px-3 py-1 font-mono text-[10px] font-bold tracking-[0.25em] transition-colors',
            !checked ? 'bg-current' : 'opacity-50'
          ].join(' ')}
        >
          <span className={!checked ? 'text-bone' : ''}>OFF</span>
        </span>
      </div>
    </button>
  )
}

function Preview({
  k,
  jp,
  v,
  last
}: {
  k: string
  jp: string
  v: string
  last?: boolean
}): React.JSX.Element {
  return (
    <div
      className={[
        'flex flex-col gap-1 p-4',
        last ? '' : 'border-b-[3px] border-ink sm:border-b-0 sm:border-r-[3px]'
      ].join(' ')}
    >
      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-ink/60">
        <span>{k}</span>
        <span className="font-jp text-[11px] tracking-[0.2em]">{jp}</span>
      </div>
      <div className="font-sans text-[16px] font-black tracking-tight text-ink">{v}</div>
    </div>
  )
}

export default Settings
