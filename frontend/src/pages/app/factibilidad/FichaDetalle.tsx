import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, RotateCcw, Lock, Unlock } from 'lucide-react'
import { Eyebrow, Badge } from '../../../components/ui'
import { api, apiErrorMessage } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { ScoreRadial } from './components/ScoreRadial'
import { CategoryTrafficLight, type CriterioCategoria } from './components/CategoryTrafficLight'
import { CriteriaSection, type CriterionRow } from './components/CriteriaSection'
import { RiskMatrixSection, type RiskRow } from './components/RiskMatrixSection'
import { EconomicSection, type EconomicData } from './components/EconomicSection'
import { EvidenciasSection } from './components/EvidenciasSection'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import type { Evidencia } from './EvidenciaModal'

type FichaStatus = 'BORRADOR' | 'EN_EVALUACION' | 'FINALIZADA'
type FactibilidadResultado = 'FACTIBLE' | 'FACTIBLE_CON_OBSERVACIONES' | 'REQUIERE_MAYOR_ANALISIS' | 'NO_FACTIBLE'

interface FichaDetail {
  id: string
  projectId: string
  name: string
  evaluationDate: string
  responsibleName: string
  unitId: string | null
  unit: { id: string; name: string } | null
  projectStageSnapshot: string
  evaluationObjective: string | null
  description: string | null
  status: FichaStatus
  estimatedCosts: string | null
  requiredResources: string | null
  licenses: string | null
  infrastructureCosts: string | null
  manHours: number | null
  recurringCosts: string | null
  expectedBenefit: string | null
  globalScore: number | null
  result: FactibilidadResultado | null
  deletedAt: string | null
  criteria: { categoria: CriterioCategoria; criterionName: string; score: number }[]
  risks: { risk: string; probability: 'BAJA' | 'MEDIA' | 'ALTA'; impact: 'BAJO' | 'MEDIO' | 'ALTO'; mitigation: string | null; responsible: string | null }[]
  evidences: Evidencia[]
}
interface Unit { id: string; name: string }

const STATUS_META: Record<FichaStatus, { label: string; color: string; bg: string }> = {
  BORRADOR: { label: 'Borrador', color: 'var(--slate-500)', bg: 'var(--slate-100)' },
  EN_EVALUACION: { label: 'En evaluación', color: 'var(--blue-600)', bg: 'var(--blue-50)' },
  FINALIZADA: { label: 'Finalizada', color: 'var(--green-600)', bg: 'var(--green-50)' },
}
const RESULT_META: Record<FactibilidadResultado, { label: string; color: string; bg: string }> = {
  FACTIBLE: { label: 'Factible', color: 'var(--green-600)', bg: 'var(--green-50)' },
  FACTIBLE_CON_OBSERVACIONES: { label: 'Factible con observaciones', color: 'var(--amber-600)', bg: 'var(--amber-50)' },
  REQUIERE_MAYOR_ANALISIS: { label: 'Requiere mayor análisis', color: 'var(--blue-600)', bg: 'var(--blue-50)' },
  NO_FACTIBLE: { label: 'No factible', color: 'var(--accent-700)', bg: 'var(--accent-50)' },
}

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'tecnica', label: 'Técnica' },
  { key: 'operacional', label: 'Operacional' },
  { key: 'normativa', label: 'Normativa y seguridad' },
  { key: 'economica', label: 'Económica' },
  { key: 'riesgos', label: 'Riesgos' },
  { key: 'evidencias', label: 'Evidencias' },
] as const
type TabKey = (typeof TABS)[number]['key']

function toDateInputValue(iso: string) {
  return iso ? iso.slice(0, 10) : ''
}

export default function FichaDetalle() {
  const { fichaId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('projects.manage')
  const canDelete = hasPermission('factibilidad.delete')

  const [tab, setTab] = useState<TabKey>('general')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const { data: ficha, isLoading } = useQuery<FichaDetail>({
    queryKey: ['factibilidad-ficha', fichaId],
    queryFn: async () => (await api.get(`/factibilidad/fichas/${fichaId}`)).data,
  })
  const { data: units } = useQuery<Unit[]>({
    queryKey: ['public-units'],
    queryFn: async () => (await api.get('/public/units')).data,
  })

  const [general, setGeneral] = useState({ name: '', evaluationDate: '', responsibleName: '', unitId: '', evaluationObjective: '', description: '' })
  const [criteriaByCategory, setCriteriaByCategory] = useState<Record<CriterioCategoria, CriterionRow[]>>({ TECNICA: [], OPERACIONAL: [], NORMATIVA: [] })
  const [risks, setRisks] = useState<RiskRow[]>([])
  const [economic, setEconomic] = useState<EconomicData>({ estimatedCosts: '', requiredResources: '', licenses: '', infrastructureCosts: '', manHours: '', recurringCosts: '', expectedBenefit: '' })

  useEffect(() => {
    if (!ficha) return
    setGeneral({
      name: ficha.name,
      evaluationDate: toDateInputValue(ficha.evaluationDate),
      responsibleName: ficha.responsibleName,
      unitId: ficha.unitId ?? '',
      evaluationObjective: ficha.evaluationObjective ?? '',
      description: ficha.description ?? '',
    })
    const byCategory: Record<CriterioCategoria, CriterionRow[]> = { TECNICA: [], OPERACIONAL: [], NORMATIVA: [] }
    ficha.criteria.forEach((c) => byCategory[c.categoria].push({ criterionName: c.criterionName, score: c.score }))
    setCriteriaByCategory(byCategory)
    setRisks(ficha.risks.map((r) => ({ risk: r.risk, probability: r.probability, impact: r.impact, mitigation: r.mitigation ?? '', responsible: r.responsible ?? '' })))
    setEconomic({
      estimatedCosts: ficha.estimatedCosts ?? '',
      requiredResources: ficha.requiredResources ?? '',
      licenses: ficha.licenses ?? '',
      infrastructureCosts: ficha.infrastructureCosts ?? '',
      manHours: ficha.manHours != null ? String(ficha.manHours) : '',
      recurringCosts: ficha.recurringCosts ?? '',
      expectedBenefit: ficha.expectedBenefit ?? '',
    })
  }, [ficha])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['factibilidad-ficha', fichaId] })
    queryClient.invalidateQueries({ queryKey: ['factibilidad-fichas'] })
    queryClient.invalidateQueries({ queryKey: ['factibilidad-summary'] })
  }

  const saveGeneralMutation = useMutation({
    mutationFn: () => api.patch(`/factibilidad/fichas/${fichaId}`, {
      name: general.name,
      evaluationDate: general.evaluationDate,
      responsibleName: general.responsibleName,
      unitId: general.unitId || undefined,
      evaluationObjective: general.evaluationObjective || undefined,
      description: general.description || undefined,
    }),
    onSuccess: invalidate,
  })

  const saveEconomicMutation = useMutation({
    mutationFn: () => api.patch(`/factibilidad/fichas/${fichaId}`, {
      estimatedCosts: economic.estimatedCosts || undefined,
      requiredResources: economic.requiredResources || undefined,
      licenses: economic.licenses || undefined,
      infrastructureCosts: economic.infrastructureCosts || undefined,
      manHours: economic.manHours ? Number(economic.manHours) : undefined,
      recurringCosts: economic.recurringCosts || undefined,
      expectedBenefit: economic.expectedBenefit || undefined,
    }),
    onSuccess: invalidate,
  })

  const saveCriteriaMutation = useMutation({
    mutationFn: () => {
      const combined = (['TECNICA', 'OPERACIONAL', 'NORMATIVA'] as CriterioCategoria[]).flatMap((cat) =>
        criteriaByCategory[cat].map((c) => ({ categoria: cat, criterionName: c.criterionName, score: c.score })),
      )
      return api.put(`/factibilidad/fichas/${fichaId}/criterios`, { criteria: combined })
    },
    onSuccess: invalidate,
  })

  const saveRisksMutation = useMutation({
    mutationFn: () => api.put(`/factibilidad/fichas/${fichaId}/riesgos`, { risks }),
    onSuccess: invalidate,
  })

  const transitionMutation = useMutation({
    mutationFn: (status: FichaStatus) => api.patch(`/factibilidad/fichas/${fichaId}/status`, { status }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/factibilidad/fichas/${fichaId}`),
    onSuccess: () => {
      invalidate()
      navigate('/app/factibilidad')
    },
  })
  const restoreMutation = useMutation({
    mutationFn: () => api.post(`/factibilidad/fichas/${fichaId}/restore`),
    onSuccess: invalidate,
  })

  if (isLoading) return <div className="p-6 text-[13px] text-muted">Cargando…</div>
  if (!ficha) return <div className="p-6 text-[13px] text-muted">Ficha no encontrada.</div>

  const isFinalizada = ficha.status === 'FINALIZADA'
  const editable = canManage && !isFinalizada

  return (
    <div className="animate-viewin p-4 sm:p-6 max-w-[1040px] mx-auto">
      <Link to="/app/factibilidad" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-ink mb-4">
        <ArrowLeft size={14} /> Volver a Factibilidad
      </Link>

      {ficha.deletedAt && (
        <div className="mb-4 p-3.5 rounded-card border flex items-center justify-between gap-3 flex-wrap" style={{ background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }}>
          <span className="text-[13px] text-body">Esta ficha fue eliminada y está en la papelera.</span>
          {canDelete && (
            <button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending} className="h-8 px-3 rounded-md text-white font-bold text-[12px] inline-flex items-center gap-1.5" style={{ background: 'var(--accent)' }}>
              <RotateCcw size={13} /> {restoreMutation.isPending ? 'Restaurando…' : 'Restaurar ficha'}
            </button>
          )}
        </div>
      )}

      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge color={STATUS_META[ficha.status].color} bg={STATUS_META[ficha.status].bg}>{STATUS_META[ficha.status].label.toUpperCase()}</Badge>
            {ficha.result && <Badge color={RESULT_META[ficha.result].color} bg={RESULT_META[ficha.result].bg}>{RESULT_META[ficha.result].label.toUpperCase()}</Badge>}
          </div>
          <h1 className="text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold mb-2">{ficha.name}</h1>
          <CategoryTrafficLight criteria={ficha.criteria} />
        </div>
        <div className="flex items-center gap-4">
          <ScoreRadial score={ficha.globalScore} size={96} />
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {ficha.status === 'BORRADOR' && (
            <button onClick={() => transitionMutation.mutate('EN_EVALUACION')} className="h-8 px-3 rounded-md border border-line bg-card text-[12px] font-semibold text-body">
              Pasar a "En evaluación"
            </button>
          )}
          {ficha.status === 'EN_EVALUACION' && (
            <button onClick={() => transitionMutation.mutate('FINALIZADA')} className="h-8 px-3 rounded-md text-white font-bold text-[12px]" style={{ background: 'var(--green-600)' }}>
              <Lock size={12} className="inline mr-1" /> Finalizar evaluación
            </button>
          )}
          {ficha.status === 'FINALIZADA' && (
            <button onClick={() => transitionMutation.mutate('EN_EVALUACION')} className="h-8 px-3 rounded-md border border-line bg-card text-[12px] font-semibold text-body">
              <Unlock size={12} className="inline mr-1" /> Reabrir para editar
            </button>
          )}
          {canDelete && !ficha.deletedAt && (
            <button onClick={() => setConfirmingDelete(true)} className="h-8 px-3 rounded-md border border-line bg-card text-[12px] font-semibold inline-flex items-center gap-1.5 ml-auto" style={{ color: 'var(--accent)' }}>
              <Trash2 size={13} /> Eliminar ficha
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="h-9 px-3.5 rounded-md text-[12.5px] font-semibold transition-colors"
            style={tab === t.key ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface-inset)', color: 'var(--text-body)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-line rounded-card p-5 sm:p-6">
        {tab === 'general' && (
          <div>
            <Eyebrow>INFORMACIÓN GENERAL</Eyebrow>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">Nombre de la ficha</span>
                <input disabled={!canManage} value={general.name} onChange={(e) => setGeneral((g) => ({ ...g, name: e.target.value }))} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">Fecha de evaluación</span>
                <input type="date" disabled={!canManage} value={general.evaluationDate} onChange={(e) => setGeneral((g) => ({ ...g, evaluationDate: e.target.value }))} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">Responsable</span>
                <input disabled={!canManage} value={general.responsibleName} onChange={(e) => setGeneral((g) => ({ ...g, responsibleName: e.target.value }))} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-body">Servicio o unidad solicitante</span>
                <select disabled={!canManage} value={general.unitId} onChange={(e) => setGeneral((g) => ({ ...g, unitId: e.target.value }))} className="h-10 px-3 rounded-md border border-line bg-inset text-[13px] disabled:opacity-70">
                  <option value="">Sin especificar</option>
                  {units?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12px] font-semibold text-body">Objetivo de la evaluación</span>
                <textarea disabled={!canManage} rows={2} value={general.evaluationObjective} onChange={(e) => setGeneral((g) => ({ ...g, evaluationObjective: e.target.value }))} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none disabled:opacity-70" />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-[12px] font-semibold text-body">Descripción breve</span>
                <textarea disabled={!canManage} rows={3} value={general.description} onChange={(e) => setGeneral((g) => ({ ...g, description: e.target.value }))} className="px-3 py-2 rounded-md border border-line bg-inset text-[13px] resize-none disabled:opacity-70" />
              </label>
            </div>
            <div className="mt-3 text-[11.5px] text-muted">Etapa del proyecto al crear esta ficha: <strong className="text-ink">{ficha.projectStageSnapshot}</strong></div>
            {canManage && (
              <button onClick={() => saveGeneralMutation.mutate()} disabled={saveGeneralMutation.isPending} className="h-10 px-4 mt-4 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saveGeneralMutation.isPending ? 'Guardando…' : 'Guardar información general'}
              </button>
            )}
            {saveGeneralMutation.error && <p className="text-[12px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveGeneralMutation.error)}</p>}
          </div>
        )}

        {(tab === 'tecnica' || tab === 'operacional' || tab === 'normativa') && (
          <div>
            {tab === 'tecnica' && (
              <CriteriaSection
                title="Evaluación técnica"
                description="Disponibilidad tecnológica, infraestructura, integración, seguridad, escalabilidad, mantenibilidad, complejidad y dependencias."
                criteria={criteriaByCategory.TECNICA}
                onChange={(rows) => setCriteriaByCategory((c) => ({ ...c, TECNICA: rows }))}
                canManage={editable}
              />
            )}
            {tab === 'operacional' && (
              <CriteriaSection
                title="Evaluación operacional"
                description="Impacto en procesos, capacidad del equipo, RRHH, cambios en flujos, capacitación, soporte y adopción esperada."
                criteria={criteriaByCategory.OPERACIONAL}
                onChange={(rows) => setCriteriaByCategory((c) => ({ ...c, OPERACIONAL: rows }))}
                canManage={editable}
              />
            )}
            {tab === 'normativa' && (
              <CriteriaSection
                title="Evaluación normativa y seguridad"
                description="Protección de datos, normativa institucional, riesgos legales, consentimientos, seguridad informática y continuidad operacional."
                criteria={criteriaByCategory.NORMATIVA}
                onChange={(rows) => setCriteriaByCategory((c) => ({ ...c, NORMATIVA: rows }))}
                canManage={editable}
              />
            )}
            {editable && (
              <button onClick={() => saveCriteriaMutation.mutate()} disabled={saveCriteriaMutation.isPending} className="h-10 px-4 mt-5 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saveCriteriaMutation.isPending ? 'Guardando…' : 'Guardar evaluación'}
              </button>
            )}
            {isFinalizada && <p className="text-[12px] text-muted mt-3">Ficha finalizada: reábrela desde el encabezado para editar los criterios.</p>}
            {saveCriteriaMutation.error && <p className="text-[12px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveCriteriaMutation.error)}</p>}
          </div>
        )}

        {tab === 'economica' && (
          <div>
            <EconomicSection data={economic} onChange={setEconomic} canManage={canManage} />
            {canManage && (
              <button onClick={() => saveEconomicMutation.mutate()} disabled={saveEconomicMutation.isPending} className="h-10 px-4 mt-4 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saveEconomicMutation.isPending ? 'Guardando…' : 'Guardar evaluación económica'}
              </button>
            )}
            {saveEconomicMutation.error && <p className="text-[12px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveEconomicMutation.error)}</p>}
          </div>
        )}

        {tab === 'riesgos' && (
          <div>
            <RiskMatrixSection risks={risks} onChange={setRisks} canManage={editable} />
            {editable && (
              <button onClick={() => saveRisksMutation.mutate()} disabled={saveRisksMutation.isPending} className="h-10 px-4 mt-5 rounded-md text-white font-bold text-[12.5px] disabled:opacity-60" style={{ background: 'var(--accent)' }}>
                {saveRisksMutation.isPending ? 'Guardando…' : 'Guardar matriz de riesgos'}
              </button>
            )}
            {isFinalizada && <p className="text-[12px] text-muted mt-3">Ficha finalizada: reábrela desde el encabezado para editar los riesgos.</p>}
            {saveRisksMutation.error && <p className="text-[12px] mt-2" style={{ color: 'var(--accent)' }}>{apiErrorMessage(saveRisksMutation.error)}</p>}
          </div>
        )}

        {tab === 'evidencias' && (
          <EvidenciasSection fichaId={fichaId} evidences={ficha.evidences} canManage={editable} canDelete={canDelete} />
        )}
      </div>

      <ConfirmDeleteModal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        title="Eliminar ficha de factibilidad"
        description={`¿Confirmas eliminar definitivamente la ficha "${ficha.name}"? Quedará en la papelera y un administrador podrá restaurarla.`}
        confirmText={ficha.name}
        error={deleteMutation.error ? apiErrorMessage(deleteMutation.error) : null}
      />
    </div>
  )
}
