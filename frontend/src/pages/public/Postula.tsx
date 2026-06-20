import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Download, FileText, Upload } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

const beneficios = [
  { t: 'Abierto a todos', d: 'Funcionarios, usuarios y colaboradores.' },
  { t: 'Acompañamiento', d: 'Te ayudamos a darle forma con la ficha técnica.' },
  { t: 'Transparente', d: 'Te notificamos por correo cada cambio de estado.' },
]

const PROJECT_TYPES = [
  { value: 'GESTION_CLINICA', label: 'Gestión Clínica' },
  { value: 'GESTION_ADMINISTRATIVA', label: 'Gestión Administrativa' },
  { value: 'ACADEMICO_IDI', label: 'Académico I+D+i' },
]

const PROJECT_STAGES = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'DESARROLLO', label: 'Desarrollo' },
  { value: 'PILOTO_IMPLEMENTACION', label: 'Piloto / Implementación' },
]

interface Unit { id: string; name: string }

interface FormState {
  proponentName: string
  position: string
  email: string
  phone: string
  unitId: string
  projectType: string
  projectStage: string
  title: string
  description: string
}

const EMPTY: FormState = {
  proponentName: '', position: '', email: '', phone: '', unitId: '',
  projectType: 'GESTION_CLINICA', projectStage: 'IDEA', title: '', description: '',
}

export default function Postula() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [jefaturaApproval, setJefaturaApproval] = useState<boolean | null>(null)
  const [ficha, setFicha] = useState<{ id: string; name: string } | null>(null)
  const [fichaError, setFichaError] = useState<string | null>(null)

  const { data: units } = useQuery<Unit[]>({
    queryKey: ['public-units'],
    queryFn: async () => (await api.get('/public/units')).data,
  })

  const uploadFicha = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/public/ideas/upload-ficha', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      return res.data as { id: string }
    },
    onSuccess: (data, file) => { setFicha({ id: data.id, name: file.name }); setFichaError(null) },
    onError: (err) => { setFicha(null); setFichaError(apiErrorMessage(err, 'No se pudo cargar la ficha')) },
  })

  const submit = useMutation({
    mutationFn: () =>
      api.post('/public/ideas', { ...form, jefaturaApproval, fichaUploadId: ficha?.id }),
    onSuccess: () => { setForm(EMPTY); setJefaturaApproval(null); setFicha(null) },
  })

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const canSubmit = !!ficha && jefaturaApproval !== null

  if (submit.isSuccess) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-20 text-center animate-viewin">
        <span
          className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5"
          style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
        >
          <Check size={26} />
        </span>
        <h1 className="text-[26px] text-ink tracking-tight font-extrabold mb-3">¡Idea recibida!</h1>
        <p className="text-[15px] text-body leading-relaxed mb-6">
          Gracias por postular. Te enviamos un correo de confirmación y el Comité de Innovación revisará tu
          propuesta en las próximas sesiones de triage. Te notificaremos cada cambio de estado.
        </p>
        <button
          onClick={() => submit.reset()}
          className="h-11 px-5 rounded-xl text-white font-bold text-sm"
          style={{ background: 'var(--accent)' }}
        >
          Postular otra idea
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-8 py-10 sm:py-12 animate-viewin">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-10 items-start">
        {/* Intro */}
        <div className="lg:sticky lg:top-[84px]">
          <Eyebrow>POSTULA UNA IDEA</Eyebrow>
          <h1 className="mt-2.5 text-[28px] sm:text-[34px] text-ink tracking-tight leading-[1.12] font-extrabold">
            Todas las ideas pueden transformarse en innovación
          </h1>
          <p className="mt-4 text-[15.5px] text-body leading-relaxed mb-6">
            Completa el formulario y descarga la ficha técnica oficial del Comité. El Comité te acompaña en el
            resto del proceso.
          </p>
          <div className="flex flex-col gap-3.5">
            {beneficios.map((b) => (
              <div key={b.t} className="flex gap-3 items-start">
                <span
                  className="w-[30px] h-[30px] shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
                >
                  <Check size={16} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">{b.t}</div>
                  <div className="text-[13px] text-muted">{b.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario */}
        <form
          className="bg-card border border-line rounded-2xl p-6 sm:p-7 shadow-float"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) submit.mutate()
          }}
        >
          {submit.error && (
            <p className="mb-4 p-3 rounded-[10px] text-[13px]" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
              {apiErrorMessage(submit.error)}
            </p>
          )}

          <h3 className="text-[13px] font-bold text-ink mb-3.5 uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
            Datos del solicitante
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
            <Field label="Nombre y Apellidos" placeholder="Tu nombre completo" value={form.proponentName} onChange={set('proponentName')} required minLength={2} />
            <Field label="Cargo" placeholder="Tu cargo" value={form.position} onChange={set('position')} required minLength={2} />
            <Field label="Correo electrónico" type="email" placeholder="nombre@huap.cl" value={form.email} onChange={set('email')} required />
            <Field label="Número de contacto o anexo" placeholder="Ej: 2345 o +56 9…" value={form.phone} onChange={set('phone')} required minLength={2} />
          </div>

          <label className="block text-[13px] font-semibold text-ink mb-1.5 mt-1">Unidad o Servicio</label>
          <select value={form.unitId} onChange={set('unitId')} required className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-inset text-body text-sm outline-none mb-4 focus:border-[var(--accent)]">
            <option value="" disabled>Selecciona tu unidad o servicio…</option>
            {units?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <h3 className="text-[13px] font-bold text-ink mb-3.5 mt-2 uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
            Información del proyecto
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Tipo de proyecto</label>
              <select value={form.projectType} onChange={set('projectType')} className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-inset text-body text-sm outline-none focus:border-[var(--accent)]">
                {PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Etapa</label>
              <select value={form.projectStage} onChange={set('projectStage')} className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-inset text-body text-sm outline-none focus:border-[var(--accent)]">
                {PROJECT_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <Field label="Nombre del Proyecto" placeholder="En una frase, ¿cuál es tu idea?" value={form.title} onChange={set('title')} required minLength={5} />

          <label className="block text-[13px] font-semibold text-ink mb-1.5">¿Qué problema resuelve?</label>
          <textarea
            placeholder="Describe el problema y cómo lo mejorarías… (mínimo 20 caracteres)"
            value={form.description}
            onChange={set('description')}
            required
            minLength={20}
            className="w-full h-24 p-3 rounded-[10px] border border-line bg-inset text-body text-sm outline-none resize-none mb-4 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />

          <label className="block text-[13px] font-semibold text-ink mb-2.5">Aprobación de Jefatura</label>
          <div className="flex gap-2 mb-5">
            {[{ v: true, l: 'Sí' }, { v: false, l: 'No' }].map((opt) => {
              const on = jefaturaApproval === opt.v
              return (
                <button
                  key={opt.l}
                  type="button"
                  onClick={() => setJefaturaApproval(opt.v)}
                  className="text-[12.5px] px-4 py-1.5 rounded-full border transition-colors"
                  style={
                    on
                      ? { color: 'var(--accent)', background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }
                      : { color: 'var(--text-body)', background: 'var(--surface-sunken)', borderColor: 'var(--border)' }
                  }
                >
                  {opt.l}
                </button>
              )
            })}
          </div>

          <h3 className="text-[13px] font-bold text-ink mb-2.5 uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
            Ficha técnica (obligatoria)
          </h3>
          <div className="rounded-[10px] border border-line bg-inset p-3.5 mb-6">
            <a
              href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/public/ideas/ficha-tecnica/template`}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-2.5"
              style={{ color: 'var(--accent)' }}
            >
              <Download size={14} /> 1. Descargar ficha técnica
            </a>
            <p className="text-[12px] text-muted mb-3">2. Complétala y 3. súbela aquí en formato DOC, DOCX o PDF.</p>

            <label className="flex items-center gap-2.5 h-11 px-3.5 rounded-[10px] border border-dashed border-line bg-card text-[12.5px] text-muted cursor-pointer hover:border-[var(--accent)] transition-colors">
              <Upload size={15} />
              {ficha ? <span className="text-ink font-medium truncate flex items-center gap-1.5"><FileText size={14} />{ficha.name}</span> : 'Seleccionar archivo…'}
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFicha.mutate(f) }}
              />
            </label>
            {uploadFicha.isPending && <p className="text-[11.5px] mt-2 text-muted">Subiendo ficha…</p>}
            {fichaError && <p className="text-[11.5px] mt-2" style={{ color: 'var(--accent)' }}>{fichaError}</p>}
          </div>

          <button
            type="submit"
            disabled={submit.isPending || !canSubmit}
            className="w-full h-[50px] rounded-xl text-white font-bold text-[15px] transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent)', boxShadow: '0 6px 18px rgba(237,29,37,.32)' }}
          >
            {submit.isPending ? 'Enviando…' : 'Enviar mi idea'}
          </button>
          {!canSubmit && <p className="text-[11.5px] text-muted text-center mt-2">Completa la aprobación de jefatura y adjunta la ficha técnica para poder enviar.</p>}
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  type = 'text',
}: {
  label: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
  type?: string
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-inset text-body text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
      />
    </div>
  )
}
