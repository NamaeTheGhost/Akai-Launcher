import ModalShell from './ModalShell'

interface Props {
  open: boolean
  title?: string
  jp?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

function ConfirmDialog({
  open,
  title = 'CONFIRM',
  jp = '確認',
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  destructive,
  onConfirm,
  onClose
}: Props): React.JSX.Element | null {
  if (!open) return null
  return (
    <ModalShell
      title={title}
      jp={jp}
      kanji={destructive ? '削' : '確'}
      onClose={onClose}
      width="max-w-[440px]"
    >
      <div className="px-5 py-5 font-mono text-[12px] leading-relaxed tracking-wide text-ink/80">
        {message}
      </div>
      <footer className="flex items-stretch border-t-[3px] border-ink">
        <button
          type="button"
          onClick={onClose}
          className="brutal-focus flex flex-1 items-center justify-center gap-2 border-r-[3px] border-ink bg-bone px-4 py-3 font-mono text-[11px] font-bold tracking-[0.3em] text-ink transition-colors hover:bg-ink hover:text-bone"
        >
          <span>{cancelLabel}</span>
          <span className="font-jp text-[12px] tracking-normal">取消</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={[
            'brutal-focus flex flex-1 items-center justify-center gap-2 px-4 py-3 font-mono text-[11px] font-bold tracking-[0.3em] text-bone transition-colors',
            destructive ? 'bg-vermillion hover:bg-vermillion-deep' : 'bg-ink hover:bg-vermillion'
          ].join(' ')}
        >
          <span>{confirmLabel}</span>
          <span className="font-jp text-[12px] tracking-normal">
            {destructive ? '削除' : '実行'}
          </span>
        </button>
      </footer>
    </ModalShell>
  )
}

export default ConfirmDialog
