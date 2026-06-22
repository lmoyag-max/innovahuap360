export interface EconomicData {
  estimatedCosts: string
  requiredResources: string
  licenses: string
  infrastructureCosts: string
  manHours: string
  recurringCosts: string
  expectedBenefit: string
}

const FIELDS: { key: keyof EconomicData; label: string; type?: 'text' | 'number'; full?: boolean }[] = [
  { key: 'estimatedCosts', label: 'Costos estimados' },
  { key: 'requiredResources', label: 'Recursos necesarios' },
  { key: 'licenses', label: 'Licencias' },
  { key: 'infrastructureCosts', label: 'Infraestructura' },
  { key: 'manHours', label: 'Horas hombre estimadas', type: 'number' },
  { key: 'recurringCosts', label: 'Costos recurrentes' },
  { key: 'expectedBenefit', label: 'Beneficio esperado', full: true },
]

/** Tab de evaluación económica: campos descriptivos/numéricos libres (no son criterios puntuables). */
export function EconomicSection({
  data,
  onChange,
  canManage,
}: {
  data: EconomicData
  onChange: (data: EconomicData) => void
  canManage: boolean
}) {
  return (
    <div>
      <h4 className="text-[14px] font-bold text-ink mb-1">Evaluación económica</h4>
      <p className="text-[12px] text-muted mb-4">Estimaciones de costos, recursos y beneficio esperado del proyecto.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {FIELDS.map((f) => (
          <label key={f.key} className={`flex flex-col gap-1.5 ${f.full ? 'sm:col-span-2' : ''}`}>
            <span className="text-[12px] font-semibold text-body">{f.label}</span>
            <input
              type={f.type ?? 'text'}
              min={f.type === 'number' ? 0 : undefined}
              value={data[f.key]}
              disabled={!canManage}
              onChange={(e) => onChange({ ...data, [f.key]: e.target.value })}
              className="h-10 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
