import { useState } from 'react'
import ModalShell from './ModalShell'
import { useScan } from '../context/useScan'
import type { Collection } from '@preload/types'

interface Props {
  open: boolean
  editing?: Collection | null
  onClose: () => void
}

interface FormState {
  name: string
  jp: string
  kanji: string
  description: string
}

const KANJI_PRESETS = ['集', '推', '友', '夜', '楽', '冒', '剣', '探', '宇', '匠', '夢', '鬼']

function buildInitial(editing: Collection | null | undefined): FormState {
  return {
    name: editing?.name ?? '',
    jp: editing?.jp ?? '',
    kanji: editing?.kanji ?? '',
    description: editing?.description ?? ''
  }
}

function CollectionModal({ open, editing, onClose }: Props): React.JSX.Element | null {
  if (!open) return null
  return (
    <CollectionModalInner
      key={editing ? `edit-${editing.id}-${editing.updatedAt}` : 'new'}
      editing={editing ?? null}
      onClose={onClose}
    />
  )
}

function CollectionModalInner({
  editing,
  onClose
}: {
  editing: Collection | null
  onClose: () => void
}): React.JSX.Element {
  const { addCollection, updateCollection } = useScan()
  const [form, setForm] = useState<FormState>(() => buildInitial(editing))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (k: keyof FormState, v: string): void => setForm((s) => ({ ...s, [k]: v }))

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
        kanji: form.kanji.trim().slice(0, 2) || undefined,
        description: form.description.trim() || undefined
      }
      if (editing) {
        await updateCollection(editing.id, payload)
      } else {
        await addCollection(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const previewKanji = form.kanji.trim().slice(0, 2) || '集'

  return (
    <ModalShell
      title={editing ? 'EDIT COLLECTION' : 'NEW COLLECTION'}
      jp={editing ? '編集' : '新集'}
      kanji={previewKanji}
      onClose={onClose}
      width="max-w-[560px]"
    >
      <form onSubmit={submit} className="flex flex-col">
        <div className="grid grid-cols-12 gap-0 border-b-[3px] border-ink">
          <div className="col-span-4 flex flex-col items-center justify-center border-r-[3px] border-ink bg-ink p-4 text-bone">
            <span className="font-jp-serif text-[80px] font-black leading-none">
              {previewKanji}
            </span>
            <span className="mt-2 font-mono text-[9px] tracking-[0.3em] text-bone/65">PREVIEW</span>
          </div>
          <div className="col-span-8 flex flex-col gap-4 p-5">
            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
                <span>
                  NAME<span className="ml-1 text-vermillion">*</span>
                </span>
                <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">名前</span>
              </div>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. TO PLAY"
                className="brutal-input"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
                <span>JP NAME</span>
                <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">日本名</span>
              </div>
              <input
                value={form.jp}
                onChange={(e) => update('jp', e.target.value)}
                placeholder="プレイ予定"
                className="brutal-input font-jp"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b-[3px] border-ink px-5 py-4">
          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
              <span>KANJI MARKER</span>
              <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">漢字</span>
            </div>
            <input
              value={form.kanji}
              maxLength={2}
              onChange={(e) => update('kanji', e.target.value)}
              placeholder="集"
              className="brutal-input font-jp-serif text-center text-[20px]"
            />
          </label>
          <div className="flex flex-wrap gap-0">
            {KANJI_PRESETS.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => update('kanji', k)}
                className={[
                  'brutal-focus -ml-[2px] flex h-9 w-9 items-center justify-center border-[2px] border-ink font-jp-serif text-[18px] font-black transition-colors first:ml-0 hover:bg-ink hover:text-bone',
                  form.kanji === k ? 'bg-ink text-bone' : 'bg-bone text-ink'
                ].join(' ')}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
              <span>DESCRIPTION</span>
              <span className="font-jp text-[11px] tracking-[0.2em] text-ink/50">説明</span>
            </div>
            <textarea
              value={form.description}
              rows={3}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What this folder is for..."
              className="brutal-input min-h-[64px] resize-y"
            />
          </label>
        </div>

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
            <span>{busy ? '…' : editing ? 'SAVE' : 'CREATE'}</span>
            <span className="font-jp text-[12px] tracking-normal">{editing ? '保存' : '作成'}</span>
          </button>
        </footer>
      </form>
    </ModalShell>
  )
}

export default CollectionModal
