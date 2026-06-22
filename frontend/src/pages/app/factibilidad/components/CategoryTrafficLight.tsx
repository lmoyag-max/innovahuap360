import { Dot } from '../../../../components/ui'

export type CriterioCategoria = 'TECNICA' | 'OPERACIONAL' | 'NORMATIVA'

const CATEGORY_LABEL: Record<CriterioCategoria, string> = {
  TECNICA: 'Técnica',
  OPERACIONAL: 'Operacional',
  NORMATIVA: 'Normativa',
}
const CATEGORIES: CriterioCategoria[] = ['TECNICA', 'OPERACIONAL', 'NORMATIVA']

function tone(avg: number) {
  if (avg >= 70) return { color: 'var(--green-600)', bg: 'var(--green-50)' }
  if (avg >= 40) return { color: 'var(--amber-600)', bg: 'var(--amber-50)' }
  return { color: 'var(--accent-700)', bg: 'var(--accent-50)' }
}

/** Semáforo por categoría: promedio de los criterios de cada categoría, coloreado tipo semáforo. */
export function CategoryTrafficLight({ criteria }: { criteria: { categoria: CriterioCategoria; score: number }[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CATEGORIES.map((cat) => {
        const rows = criteria.filter((c) => c.categoria === cat)
        const avg = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : null
        const t = avg === null ? { color: 'var(--slate-400)', bg: 'var(--surface-sunken)' } : tone(avg)
        return (
          <span
            key={cat}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ color: t.color, background: t.bg }}
          >
            <Dot color={t.color} size={7} /> {CATEGORY_LABEL[cat]} {avg !== null ? avg : '—'}
          </span>
        )
      })}
    </div>
  )
}
