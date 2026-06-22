import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '../../../components/ui'

/** Confirmación doble: el usuario debe escribir el texto exacto antes de poder eliminar. */
export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
  description,
  confirmText,
  error,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  title: string
  description: string
  confirmText: string
  error?: string | null
}) {
  const [typed, setTyped] = useState('')
  const matches = typed.trim() === confirmText.trim()

  const close = () => {
    setTyped('')
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title={title} maxWidth={440}>
      <div className="flex items-start gap-2.5 mb-4">
        <AlertTriangle size={18} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
        <p className="text-[13px] text-body leading-relaxed">{description}</p>
      </div>
      <label className="flex flex-col gap-1.5 mb-4">
        <span className="text-[11.5px] text-subtle font-semibold">
          Escribe <strong className="text-ink">{confirmText}</strong> para confirmar
        </span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
          className="h-10 px-3 rounded-md border border-line bg-inset text-[13px]"
        />
      </label>
      {error && <p className="text-[12px] mb-3" style={{ color: 'var(--accent)' }}>{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={!matches || isPending}
          className="h-10 px-4 rounded-md text-white font-bold text-[12.5px] disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
        <button onClick={close} className="h-10 px-4 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body">
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
