import { ExternalLink } from 'lucide-react'
import { Modal } from './ui/Modal'

export function PdfPreviewModal({
  open,
  onClose,
  title,
  url,
}: {
  open: boolean
  onClose: () => void
  title: string
  url: string | null
}) {
  return (
    <Modal open={open && !!url} onClose={onClose} title={title} maxWidth={860}>
      {url && (
        <>
          <iframe src={url} title={title} className="w-full h-[70vh] rounded-md border border-line" />
          <p className="mt-3 text-[12px] text-muted">
            No fue posible visualizar el documento en línea. Puede{' '}
            <a href={url} target="_blank" rel="noreferrer" className="font-semibold inline-flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              abrirlo en una nueva pestaña <ExternalLink size={12} />
            </a>
            .
          </p>
        </>
      )}
    </Modal>
  )
}
