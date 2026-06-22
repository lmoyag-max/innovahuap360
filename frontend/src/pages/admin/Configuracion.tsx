import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

interface Setting { key: string; value: unknown }

export default function Configuracion() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Record<string, string>>({})

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => (await api.get('/admin/settings')).data,
  })

  const saveMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => api.put(`/admin/settings/${key}`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-settings'] }),
  })

  const knownKeys = ['executive_kpis', 'executive_impact', 'executive_strategic_lines', 'public_home_progress_pct', 'public_home_beneficiaries']
  const numericKeys = new Set(['public_home_progress_pct', 'public_home_beneficiaries'])
  const existingKeys = new Set(settings?.map((s) => s.key))
  const allKeys = [...new Set([...knownKeys, ...(settings?.map((s) => s.key) ?? [])])]

  const valueFor = (key: string) => {
    if (draft[key] !== undefined) return draft[key]
    const found = settings?.find((s) => s.key === key)
    if (found) return JSON.stringify(found.value, null, 2)
    return numericKeys.has(key) ? 'null' : '[]'
  }

  const handleSave = (key: string) => {
    try {
      const parsed = JSON.parse(valueFor(key))
      saveMutation.mutate({ key, value: parsed })
    } catch {
      alert('El valor debe ser JSON válido (ej: [] o {})')
    }
  }

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-2 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Configuración</h1>
      <p className="text-[13px] text-muted mb-5">
        Parámetros institucionales en formato JSON, curados manualmente por Dirección — alimentan el{' '}
        <strong>Dashboard Ejecutivo</strong>: <code className="font-mono">executive_kpis</code> (ej.{' '}
        <code className="font-mono text-[11px]">{'[{"v":"$184M","l":"Beneficio estimado anual","s":"+18% vs 2025","tone":"var(--green-500)"}]'}</code>
        ), <code className="font-mono">executive_impact</code> (ej.{' '}
        <code className="font-mono text-[11px]">{'[{"l":"Clínico","pct":78,"color":"var(--accent)"}]'}</code>) y{' '}
        <code className="font-mono">executive_strategic_lines</code> (ej.{' '}
        <code className="font-mono text-[11px]">{'[{"l":"Impacto institucional","v":"Alto","pct":84,"color":"var(--green-500)"}]'}</code>).
        <br />
        El <strong>Inicio público</strong> usa además <code className="font-mono">public_home_progress_pct</code> (número 0-100, ej.{' '}
        <code className="font-mono text-[11px]">72</code>) y <code className="font-mono">public_home_beneficiaries</code> (número, ej.{' '}
        <code className="font-mono text-[11px]">82400</code>) para el bloque "Impacto de innovación" — son estimaciones de criterio de
        Dirección, no se calculan automáticamente; si quedan en <code className="font-mono">null</code> simplemente no se muestran.
      </p>

      {isLoading && <p className="text-[13px] text-muted">Cargando…</p>}
      {saveMutation.error && <p className="text-[12.5px] mb-3" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveMutation.error)}</p>}

      <div className="flex flex-col gap-4">
        {allKeys.map((key) => (
          <div key={key} className="bg-card border border-line rounded-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13.5px] font-bold text-ink font-mono">{key}</h3>
              {!existingKeys.has(key) && <span className="text-[11px] text-muted">(sin configurar)</span>}
            </div>
            <textarea
              value={valueFor(key)}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 rounded-md border border-line bg-inset text-[12.5px] font-mono"
            />
            <button
              onClick={() => handleSave(key)}
              disabled={saveMutation.isPending}
              className="mt-3 h-9 px-3.5 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              <Save size={14} /> Guardar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
