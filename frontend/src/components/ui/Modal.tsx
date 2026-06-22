import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** Modal genérico: overlay, cierre con click fuera / Escape, bloqueo de scroll del body. */
export function Modal({
  open,
  onClose,
  title,
  maxWidth = 560,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  maxWidth?: number
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-viewin"
      style={{ background: 'rgba(15, 18, 24, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-card border border-line rounded-card w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line sticky top-0 bg-card z-10">
            <div className="text-[15px] font-bold text-ink">{title}</div>
            <button onClick={onClose} className="text-muted hover:text-ink shrink-0" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
