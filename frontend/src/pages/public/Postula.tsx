import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

const ambitos = ['Clínico', 'Gestión', 'Digital', 'Humanización', 'IA']
const beneficios = [
  { t: 'Abierto a todos', d: 'Funcionarios, usuarios y colaboradores.' },
  { t: 'Acompañamiento', d: 'Te ayudamos a darle forma con la ficha de factibilidad.' },
  { t: 'Transparente', d: 'Sigue tu idea en el portafolio público.' },
]

interface FormState {
  proponentName: string
  unit: string
  title: string
  description: string
}

const EMPTY: FormState = { proponentName: '', unit: '', title: '', description: '' }

export default function Postula() {
  const [scope, setScope] = useState('Clínico')
  const [form, setForm] = useState<FormState>(EMPTY)

  const submit = useMutation({
    mutationFn: () => api.post('/public/ideas', { ...form, scope }),
    onSuccess: () => setForm(EMPTY),
  })

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

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
          Gracias por postular. El Comité de Innovación revisará tu propuesta en las próximas sesiones de triage.
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
            No necesitas tener todo resuelto. Cuéntanos qué problema viste y cómo crees que podríamos
            mejorarlo. El Comité te acompaña en el resto.
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
            submit.mutate()
          }}
        >
          {submit.error && (
            <p className="mb-4 p-3 rounded-[10px] text-[13px]" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
              {apiErrorMessage(submit.error)}
            </p>
          )}

          <Field label="Nombre del proponente" placeholder="Tu nombre" value={form.proponentName} onChange={set('proponentName')} required minLength={2} />
          <Field label="Unidad o servicio" placeholder="Ej: Urgencia, Farmacia, TI…" value={form.unit} onChange={set('unit')} />
          <Field label="Título de tu idea" placeholder="En una frase, ¿cuál es tu idea?" value={form.title} onChange={set('title')} required minLength={5} />
          <label className="block text-[13px] font-semibold text-ink mb-1.5">¿Qué problema resuelve?</label>
          <textarea
            placeholder="Describe el problema y cómo lo mejorarías… (mínimo 20 caracteres)"
            value={form.description}
            onChange={set('description')}
            required
            minLength={20}
            className="w-full h-24 p-3 rounded-[10px] border border-line bg-inset text-body text-sm outline-none resize-none mb-4 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />

          <label className="block text-[13px] font-semibold text-ink mb-2.5">Ámbito</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {ambitos.map((a) => {
              const on = a === scope
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setScope(a)}
                  className="text-[12.5px] px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    on
                      ? { color: 'var(--accent)', background: 'var(--accent-50)', borderColor: 'var(--accent-100)' }
                      : { color: 'var(--text-body)', background: 'var(--surface-sunken)', borderColor: 'var(--border)' }
                  }
                >
                  {a}
                </button>
              )
            })}
          </div>

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full h-[50px] rounded-xl text-white font-bold text-[15px] transition-colors disabled:opacity-60"
            style={{ background: 'var(--accent)', boxShadow: '0 6px 18px rgba(237,29,37,.32)' }}
          >
            {submit.isPending ? 'Enviando…' : 'Enviar mi idea'}
          </button>
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
}: {
  label: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <input
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
