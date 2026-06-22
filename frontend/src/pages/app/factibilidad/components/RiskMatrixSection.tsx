import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '../../../../components/ui'

export type RiesgoProbabilidad = 'BAJA' | 'MEDIA' | 'ALTA'
export type RiesgoImpacto = 'BAJO' | 'MEDIO' | 'ALTO'
export type RiesgoNivel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

export interface RiskRow {
  risk: string
  probability: RiesgoProbabilidad
  impact: RiesgoImpacto
  mitigation: string
  responsible: string
}

const RISK_LEVEL_MATRIX: Record<RiesgoProbabilidad, Record<RiesgoImpacto, RiesgoNivel>> = {
  BAJA: { BAJO: 'BAJO', MEDIO: 'BAJO', ALTO: 'MEDIO' },
  MEDIA: { BAJO: 'BAJO', MEDIO: 'MEDIO', ALTO: 'ALTO' },
  ALTA: { BAJO: 'MEDIO', MEDIO: 'ALTO', ALTO: 'CRITICO' },
}

const LEVEL_META: Record<RiesgoNivel, { label: string; color: string; bg: string }> = {
  BAJO: { label: 'Bajo', color: 'var(--green-600)', bg: 'var(--green-50)' },
  MEDIO: { label: 'Medio', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  ALTO: { label: 'Alto', color: 'var(--accent)', bg: 'var(--accent-50)' },
  CRITICO: { label: 'Crítico', color: '#fff', bg: 'var(--accent-700)' },
}

const emptyRow = (): RiskRow => ({ risk: '', probability: 'MEDIA', impact: 'MEDIO', mitigation: '', responsible: '' })

/** Matriz de riesgos editable: riesgo, probabilidad x impacto -> nivel calculado, mitigación, responsable. */
export function RiskMatrixSection({
  risks,
  onChange,
  canManage,
}: {
  risks: RiskRow[]
  onChange: (rows: RiskRow[]) => void
  canManage: boolean
}) {
  const update = (i: number, patch: Partial<RiskRow>) => onChange(risks.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-[14px] font-bold text-ink">Matriz de riesgos</h4>
          <p className="text-[12px] text-muted">Probabilidad × impacto determina el nivel y prioridad de mitigación.</p>
        </div>
        {canManage && (
          <button
            onClick={() => onChange([...risks, emptyRow()])}
            className="text-[12px] font-semibold inline-flex items-center gap-1 shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            <Plus size={14} /> Agregar riesgo
          </button>
        )}
      </div>

      {risks.length === 0 && <p className="text-[12.5px] text-muted">Sin riesgos registrados todavía.</p>}

      <div className="flex flex-col gap-3">
        {risks.map((r, i) => {
          const level = RISK_LEVEL_MATRIX[r.probability][r.impact]
          const meta = LEVEL_META[level]
          return (
            <div key={i} className="border border-line rounded-[10px] p-3.5">
              <div className="flex items-start gap-2 mb-2.5">
                {canManage ? (
                  <input
                    value={r.risk}
                    onChange={(e) => update(i, { risk: e.target.value })}
                    placeholder="Describe el riesgo"
                    className="flex-1 h-9 px-2.5 rounded-md border border-line bg-inset text-[13px]"
                  />
                ) : (
                  <span className="flex-1 text-[13px] text-body font-medium pt-1.5">{r.risk || '—'}</span>
                )}
                <Badge color={meta.color} bg={meta.bg}>{meta.label.toUpperCase()}</Badge>
                {canManage && (
                  <button onClick={() => onChange(risks.filter((_, idx) => idx !== i))} className="text-subtle hover:text-[var(--accent)] mt-1.5">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] text-subtle font-semibold uppercase">Probabilidad</span>
                  {canManage ? (
                    <select value={r.probability} onChange={(e) => update(i, { probability: e.target.value as RiesgoProbabilidad })} className="h-8 px-2 rounded-md border border-line bg-inset text-[12px]">
                      <option value="BAJA">Baja</option>
                      <option value="MEDIA">Media</option>
                      <option value="ALTA">Alta</option>
                    </select>
                  ) : (
                    <span className="text-[12.5px] text-body">{r.probability}</span>
                  )}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] text-subtle font-semibold uppercase">Impacto</span>
                  {canManage ? (
                    <select value={r.impact} onChange={(e) => update(i, { impact: e.target.value as RiesgoImpacto })} className="h-8 px-2 rounded-md border border-line bg-inset text-[12px]">
                      <option value="BAJO">Bajo</option>
                      <option value="MEDIO">Medio</option>
                      <option value="ALTO">Alto</option>
                    </select>
                  ) : (
                    <span className="text-[12.5px] text-body">{r.impact}</span>
                  )}
                </label>
                <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                  <span className="text-[10.5px] text-subtle font-semibold uppercase">Mitigación</span>
                  {canManage ? (
                    <input value={r.mitigation} onChange={(e) => update(i, { mitigation: e.target.value })} className="h-8 px-2 rounded-md border border-line bg-inset text-[12px]" />
                  ) : (
                    <span className="text-[12.5px] text-body">{r.mitigation || '—'}</span>
                  )}
                </label>
                <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                  <span className="text-[10.5px] text-subtle font-semibold uppercase">Responsable</span>
                  {canManage ? (
                    <input value={r.responsible} onChange={(e) => update(i, { responsible: e.target.value })} className="h-8 px-2 rounded-md border border-line bg-inset text-[12px]" />
                  ) : (
                    <span className="text-[12.5px] text-body">{r.responsible || '—'}</span>
                  )}
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
