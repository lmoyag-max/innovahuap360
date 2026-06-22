import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Image as ImageIcon, Upload as UploadIcon, FileType2 } from 'lucide-react'
import { EmptyState } from '../../../../components/ui'
import { api, apiErrorMessage } from '../../../../lib/api'
import { EvidenciaModal, type Evidencia } from '../EvidenciaModal'

function iconFor(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  return FileType2
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Tab de evidencias: grid de tarjetas + subida de archivos + visor modal. */
export function EvidenciasSection({
  fichaId,
  evidences,
  canManage,
  canDelete,
}: {
  fichaId: string
  evidences: Evidencia[]
  canManage: boolean
  canDelete: boolean
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState<Evidencia | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['factibilidad-ficha', fichaId] })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/factibilidad/fichas/${fichaId}/evidencias`, form)
    },
    onSuccess: invalidate,
  })

  const handleFile = (file: File | undefined) => {
    if (!file) return
    uploadMutation.mutate(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-[14px] font-bold text-ink">Evidencias y documentos</h4>
          <p className="text-[12px] text-muted">Fotografías, capturas, PDF y documentos (Word) de respaldo. Máx. 10 MB por archivo.</p>
        </div>
        {canManage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="h-9 px-3.5 rounded-md text-white font-bold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60 shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <UploadIcon size={14} /> {uploadMutation.isPending ? 'Subiendo…' : 'Subir evidencia'}
            </button>
          </>
        )}
      </div>

      {uploadMutation.error && <p className="text-[12px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(uploadMutation.error)}</p>}

      {evidences.length === 0 ? (
        <EmptyState icon={<ImageIcon size={22} />} title="Sin evidencias todavía" description="Sube fotografías, PDF o documentos que respalden esta evaluación." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {evidences.map((ev) => {
            const Icon = iconFor(ev.upload.mimeType)
            return (
              <button
                key={ev.id}
                onClick={() => setActive(ev)}
                className="group bg-card border border-line rounded-[10px] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-2" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
                  <Icon size={17} />
                </span>
                <div className="text-[12px] font-semibold text-ink truncate">{ev.upload.originalName}</div>
                <div className="text-[10.5px] text-muted mt-0.5">{formatBytes(ev.upload.sizeBytes)}</div>
              </button>
            )
          })}
        </div>
      )}

      <EvidenciaModal
        evidencia={active}
        open={!!active}
        onClose={() => setActive(null)}
        canDelete={canDelete}
        onDeleted={() => {
          setActive(null)
          invalidate()
        }}
      />
    </div>
  )
}
