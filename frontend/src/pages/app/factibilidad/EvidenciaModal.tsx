import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, FileType2, Trash2 } from 'lucide-react'
import { Modal } from '../../../components/ui'
import { api, apiErrorMessage } from '../../../lib/api'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'

/** Igual que downloadUpload/previewUpload de lib/api.ts, pero contra el endpoint
 * de descarga protegida de evidencias (/factibilidad/evidencias/:id/download),
 * distinto del genérico /uploads/:id/download. */
async function fetchEvidenciaBlobUrl(evidenciaId: string): Promise<string> {
  const response = await api.get(`/factibilidad/evidencias/${evidenciaId}/download`, { responseType: 'blob' })
  return URL.createObjectURL(response.data as Blob)
}
async function downloadEvidencia(evidenciaId: string, filename: string) {
  const url = await fetchEvidenciaBlobUrl(evidenciaId)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export interface Evidencia {
  id: string
  description: string | null
  upload: {
    id: string
    originalName: string
    mimeType: string
    sizeBytes: number
    createdAt: string
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Modal de visualización de una evidencia: imagen ampliada, PDF embebido, o documento con ícono + descarga. */
export function EvidenciaModal({
  evidencia,
  open,
  onClose,
  canDelete,
  onDeleted,
}: {
  evidencia: Evidencia | null
  open: boolean
  onClose: () => void
  canDelete: boolean
  onDeleted: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    setPreviewUrl(null)
    if (!open || !evidencia) return
    const isPreviewable = evidencia.upload.mimeType.startsWith('image/') || evidencia.upload.mimeType === 'application/pdf'
    if (!isPreviewable) return
    let url: string | null = null
    fetchEvidenciaBlobUrl(evidencia.id)
      .then((u) => { url = u; setPreviewUrl(u) })
      .catch(() => undefined)
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [open, evidencia])

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/factibilidad/evidencias/${evidencia!.id}`),
    onSuccess: () => {
      setConfirmingDelete(false)
      onDeleted()
    },
  })

  if (!evidencia) return null
  const { mimeType, originalName, sizeBytes, createdAt } = evidencia.upload
  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  return (
    <>
      <Modal open={open} onClose={onClose} title={originalName} maxWidth={720}>
        <div className="mb-4">
          {isImage && (previewUrl ? (
            <img src={previewUrl} alt={originalName} className="w-full max-h-[460px] object-contain rounded-[10px] border border-line bg-inset" />
          ) : (
            <div className="h-[200px] rounded-[10px] border border-line bg-inset flex items-center justify-center text-[12px] text-muted">Cargando vista previa…</div>
          ))}
          {isPdf && (previewUrl ? (
            <iframe title={originalName} src={previewUrl} className="w-full h-[460px] rounded-[10px] border border-line" />
          ) : (
            <div className="h-[200px] rounded-[10px] border border-line bg-inset flex items-center justify-center text-[12px] text-muted">Cargando vista previa…</div>
          ))}
          {!isImage && !isPdf && (
            <div className="h-[140px] rounded-[10px] border border-line bg-inset flex flex-col items-center justify-center gap-2 text-muted">
              <FileType2 size={28} />
              <span className="text-[12px]">Vista previa no disponible para este tipo de archivo</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-[11.5px] text-muted mb-4 p-3 rounded-[10px] bg-inset">
          <div><strong className="text-ink">Subido:</strong> {new Date(createdAt).toLocaleString('es-CL')}</div>
          <div><strong className="text-ink">Tamaño:</strong> {formatBytes(sizeBytes)}</div>
          {evidencia.description && <div className="col-span-2"><strong className="text-ink">Descripción:</strong> {evidencia.description}</div>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => downloadEvidencia(evidencia.id, originalName)}
            className="h-9 px-3.5 rounded-md text-white font-bold text-[12.5px] inline-flex items-center gap-1.5"
            style={{ background: 'var(--accent)' }}
          >
            <Download size={14} /> Descargar
          </button>
          {canDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="h-9 px-3.5 rounded-md border border-line bg-card text-[12.5px] font-semibold inline-flex items-center gap-1.5"
              style={{ color: 'var(--accent)' }}
            >
              <Trash2 size={14} /> Eliminar
            </button>
          )}
          <button onClick={onClose} className="h-9 px-3.5 rounded-md border border-line bg-card text-[12.5px] font-semibold text-body ml-auto">
            Cerrar
          </button>
        </div>
        {deleteMutation.error && <p className="text-[12px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(deleteMutation.error)}</p>}
      </Modal>

      <ConfirmDeleteModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        title="Eliminar evidencia"
        description={`¿Confirmas eliminar definitivamente "${originalName}"? Esta acción no se puede deshacer.`}
        confirmText="ELIMINAR"
        error={deleteMutation.error ? apiErrorMessage(deleteMutation.error) : null}
      />
    </>
  )
}
