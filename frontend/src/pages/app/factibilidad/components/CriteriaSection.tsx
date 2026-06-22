import { Plus, Trash2 } from 'lucide-react'
import { ProgressBar } from '../../../../components/ui'

export interface CriterionRow {
  criterionName: string
  score: number
}

const ROW_COLORS = ['var(--green-500)', 'var(--blue-500)', 'var(--amber-500)', 'var(--violet-500)', 'var(--accent)', 'var(--blue-600)']

/** Tab de evaluación por categoría (técnica/operacional/normativa): misma UX que el editor de criterios original. */
export function CriteriaSection({
  title,
  description,
  criteria,
  onChange,
  canManage,
}: {
  title: string
  description: string
  criteria: CriterionRow[]
  onChange: (rows: CriterionRow[]) => void
  canManage: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div>
          <h4 className="text-[14px] font-bold text-ink">{title}</h4>
          <p className="text-[12px] text-muted">{description}</p>
        </div>
        {canManage && (
          <button
            onClick={() => onChange([...criteria, { criterionName: 'Nuevo criterio', score: 50 }])}
            className="text-[12px] font-semibold inline-flex items-center gap-1 shrink-0"
            style={{ color: 'var(--accent)' }}
          >
            <Plus size={14} /> Agregar criterio
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {criteria.length === 0 && <p className="text-[12.5px] text-muted">Sin criterios en esta categoría todavía.</p>}
        {criteria.map((c, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              {canManage ? (
                <input
                  value={c.criterionName}
                  onChange={(e) => onChange(criteria.map((row, idx) => (idx === i ? { ...row, criterionName: e.target.value } : row)))}
                  className="text-[13.5px] text-body font-medium bg-transparent border-none outline-none flex-1"
                />
              ) : (
                <span className="text-[13.5px] text-body font-medium">{c.criterionName}</span>
              )}
              <span className="font-mono text-[13px] font-bold flex items-center gap-1" style={{ color: ROW_COLORS[i % ROW_COLORS.length] }}>
                {canManage ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={c.score}
                    onChange={(e) => onChange(criteria.map((row, idx) => (idx === i ? { ...row, score: Number(e.target.value) } : row)))}
                    className="w-12 bg-transparent border-none outline-none text-right font-mono"
                  />
                ) : c.score}
                <span className="text-subtle font-normal">/100</span>
                {canManage && (
                  <button onClick={() => onChange(criteria.filter((_, idx) => idx !== i))} className="text-subtle hover:text-[var(--accent)]">
                    <Trash2 size={13} />
                  </button>
                )}
              </span>
            </div>
            <ProgressBar pct={c.score} color={ROW_COLORS[i % ROW_COLORS.length]} />
          </div>
        ))}
      </div>
    </div>
  )
}
