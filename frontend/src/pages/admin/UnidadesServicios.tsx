import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

interface Unit { id: string; name: string; isActive: boolean }

export default function UnidadesServicios() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)

  const { data: units, isLoading } = useQuery<Unit[]>({
    queryKey: ['admin-units', includeInactive],
    queryFn: async () => (await api.get('/admin/units', { params: { includeInactive } })).data,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-units'] })

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/units', { name }),
    onSuccess: () => { invalidate(); setName('') },
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/units/${id}/active`, { isActive }),
    onSuccess: invalidate,
  })
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post('/admin/units/import-excel', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: invalidate,
  })

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-2 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Unidades y Servicios</h1>
      <p className="text-[13px] text-muted mb-5 max-w-[640px]">
        Tabla maestra de unidades y servicios HUAP. Alimenta el selector de "Unidad o Servicio" del formulario
        público de postulación de ideas (<code className="font-mono">/postula</code>).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <form
          className="bg-card border border-line rounded-card p-4 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMutation.mutate() }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la nueva unidad/servicio"
            className="flex-1 h-9 px-3 rounded-md border border-line bg-inset text-[12.5px]"
          />
          <button type="submit" disabled={createMutation.isPending} className="h-9 px-3 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60" style={{ background: 'var(--accent)' }}>
            <Plus size={14} /> Agregar
          </button>
        </form>

        <div className="bg-card border border-line rounded-card p-4 flex items-center gap-2.5">
          <label className="flex-1 flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-line text-[12.5px] text-muted cursor-pointer">
            <Upload size={14} />
            {importMutation.isPending ? 'Importando…' : 'Importar desde Excel (.xlsx)'}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importMutation.mutate(f) }}
            />
          </label>
        </div>
      </div>

      {(createMutation.error || importMutation.error) && (
        <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(createMutation.error ?? importMutation.error)}</p>
      )}
      {importMutation.isSuccess && (
        <p className="text-[12.5px] mb-3" style={{ color: 'var(--green-600)' }}>
          Importación completada: {importMutation.data?.data.imported} nuevas, {importMutation.data?.data.skipped} omitidas (duplicadas o inválidas).
        </p>
      )}

      <label className="flex items-center gap-2 text-[12.5px] text-muted mb-3 cursor-pointer">
        <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="accent-[var(--accent)]" />
        Mostrar inactivas
      </label>

      <div className="bg-card border border-line rounded-card overflow-hidden">
        {isLoading && <p className="p-4 text-[12.5px] text-muted">Cargando…</p>}
        {units?.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-2.5 border-b border-line last:border-0">
            <span className="text-[13px] text-ink">{u.name}</span>
            <button
              onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={u.isActive ? { color: 'var(--green-600)', background: 'var(--green-50)' } : { color: 'var(--slate-500)', background: 'var(--slate-100)' }}
            >
              {u.isActive ? 'ACTIVA' : 'INACTIVA'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
