import { useState } from 'react'
import ModalShell from './ModalShell'
import { useScan } from '../context/useScan'
import type { CustomGame } from '@preload/types'

interface Props {
  open: boolean
  editing?: CustomGame | null
  onClose: () => void
}

interface FormState {
  name: string
  jp: string
  category: string
  installPath: string
  exePath: string
  launchUri: string
  notes: string
}

function buildInitial(editing: CustomGame | null | undefined): FormState {
  return {
    name: editing?.name ?? '',
    jp: editing?.jp ?? '',
    category: editing?.category ?? '',
    installPath: editing?.installPath ?? '',
    exePath: editing?.exePath ?? '',
    launchUri: editing?.launchUri ?? '',
    notes: editing?.notes ?? ''
  }
}

function CustomGameModal({ open, editing, onClose }: Props): React.JSX.Element | null {
  if (!open) return null
  return (
    <CustomGameModalInner
      key={editing ? `edit-${editing.id}-${editing.updatedAt}` : 'new'}
      editing={editing ?? null}
      onClose={onClose}
    />
  )
}

function CustomGameModalInner({
  editing,
  onClose
}: {
  editing: CustomGame | null
  onClose: () => void
}): React.JSX.Element {
  const { addCustomGame, updateCustomGame } = useScan()
  const [form, setForm] = useState<FormState>(() => buildInitial(editing))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (k: keyof FormState, v: string): void => setForm((s) => ({ ...s, [k]: v }))

  const pickExe = async (): Promise<void> => {
    const result = await window.api.library.pickFile({
      title: 'Select game executable',
      filters: [
        { name: 'Executables', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result) {
      const dir = result.replace(/\\[^\\]+$/, '')
      setForm((s) => ({
        ...s,
        exePath: result,
        installPath: s.installPath || dir,
        name: s.name || guessName(result)
      }))
    }
  }

  const pickFolder = async (): Promise<void> => {
    const result = await window.api.library.pickFile({
      title: 'Select install folder',
      directory: true
    })
    if (result) {
      setForm((s) => ({
        ...s,
        installPath: result,
        name: s.name || guessName(result)
      }))
    }
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required · 名前は必須')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const payload = {
        name: form.name.trim(),
        jp: form.jp.trim() || undefined,
        category: form.category.trim() || undefined,
        installPath: form.installPath.trim() || undefined,
        exePath: form.exePath.trim() || undefined,
        launchUri: form.launchUri.trim() || undefined,
        notes: form.notes.trim() || undefined
      }
      if (editing) {
        await updateCustomGame(editing.id, payload)
      } else {
        await addCustomGame(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell
      title={editing ? 'EDIT GAME' : 'ADD GAME'}
      jp={editing ? '編集' : '追加'}
      kanji={editing ? '編' : '追'}
      onClose={onClose}
      width="max-w-[680px]"
    >
      <form onSubmit={submit} className="flex flex-col">
        <Section label="IDENTITY" jp="名前">
          <Field label="NAME" jp="名前" required>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. UNDERTALE"
              className="brutal-input"
            />
          </Field>
          <Row>
            <Field label="JP NAME" jp="日本名">
              <input
                value={form.jp}
                onChange={(e) => update('jp', e.target.value)}
                placeholder="アンダーテール"
                className="brutal-input font-jp"
              />
            </Field>
            <Field label="CATEGORY" jp="分類">
              <input
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                placeholder="RPG / Indie / Portable"
                className="brutal-input"
              />
            </Field>
          </Row>
        </Section>

        <Section label="LOCATION" jp="場所">
          <Field label="EXECUTABLE" jp="実行体">
            <div className="flex">
              <input
                value={form.exePath}
                onChange={(e) => update('exePath', e.target.value)}
                placeholder="C:\Games\MyGame\game.exe"
                className="brutal-input flex-1"
              />
              <button
                type="button"
                onClick={pickExe}
                className="brutal-focus -ml-[3px] border-[3px] border-ink bg-ink px-3 font-mono text-[10px] font-bold tracking-[0.25em] text-bone transition-colors hover:bg-vermillion hover:border-vermillion"
              >
                BROWSE
              </button>
            </div>
          </Field>
          <Field label="INSTALL FOLDER" jp="設置場所">
            <div className="flex">
              <input
                value={form.installPath}
                onChange={(e) => update('installPath', e.target.value)}
                placeholder="C:\Games\MyGame"
                className="brutal-input flex-1"
              />
              <button
                type="button"
                onClick={pickFolder}
                className="brutal-focus -ml-[3px] border-[3px] border-ink bg-ink px-3 font-mono text-[10px] font-bold tracking-[0.25em] text-bone transition-colors hover:bg-vermillion hover:border-vermillion"
              >
                FOLDER
              </button>
            </div>
          </Field>
          <Field label="LAUNCH URI" jp="起動URI">
            <input
              value={form.launchUri}
              onChange={(e) => update('launchUri', e.target.value)}
              placeholder="optional · steam://run/440 or app://..."
              className="brutal-input font-mono"
            />
          </Field>
        </Section>

        <Section label="NOTES" jp="覚書" last>
          <Field label="NOTES" jp="覚書">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              placeholder="Anything to remember..."
              className="brutal-input min-h-[72px] resize-y"
            />
          </Field>
        </Section>

        {error ? (
          <div className="border-t-[3px] border-vermillion bg-vermillion/10 px-5 py-2 font-mono text-[11px] font-bold tracking-[0.2em] text-vermillion">
            {error}
          </div>
        ) : null}

        <footer className="flex items-stretch border-t-[3px] border-ink">
          <button
            type="button"
            onClick={onClose}
            className="brutal-focus flex flex-1 items-center justify-center gap-2 border-r-[3px] border-ink bg-bone px-4 py-3 font-mono text-[11px] font-bold tracking-[0.3em] text-ink transition-colors hover:bg-ink hover:text-bone"
          >
            <span>CANCEL</span>
            <span className="font-jp text-[12px] tracking-normal">取消</span>
          </button>
          <button
            type="submit"
            disabled={busy}
            className="brutal-focus flex flex-1 items-center justify-center gap-2 bg-ink px-4 py-3 font-mono text-[11px] font-bold tracking-[0.3em] text-bone transition-colors hover:bg-vermillion disabled:opacity-50"
          >
            <span>{busy ? '…' : editing ? 'SAVE' : 'ADD GAME'}</span>
            <span className="font-jp text-[12px] tracking-normal">{editing ? '保存' : '追加'}</span>
          </button>
        </footer>
      </form>
    </ModalShell>
  )
}

function Section({
  label,
  jp,
  children,
  last
}: {
  label: string
  jp: string
  children: React.ReactNode
  last?: boolean
}): React.JSX.Element {
  return (
    <div
      className={['flex flex-col gap-3 px-5 py-4', last ? '' : 'border-b-[3px] border-ink'].join(
        ' '
      )}
    >
      <div className="flex items-center gap-3 font-mono text-[10px] font-bold tracking-[0.3em] text-ink/60">
        <span>{label}</span>
        <span className="font-jp text-[11px] tracking-[0.2em]">{jp}</span>
        <span className="h-px flex-1 bg-ink/30" />
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  jp,
  required,
  children
}: {
  label: string
  jp: string
  required?: boolean
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
        <span>
          {label}
          {required ? <span className="ml-1 text-vermillion">*</span> : null}
        </span>
        <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">{jp}</span>
      </div>
      {children}
    </label>
  )
}

function Row({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="grid grid-cols-2 gap-4">{children}</div>
}

function guessName(p: string): string {
  const file = p.split(/[\\/]/).pop() ?? ''
  const base = file.replace(/\.(exe|bat|cmd|lnk)$/i, '')
  return base
}

export default CustomGameModal
