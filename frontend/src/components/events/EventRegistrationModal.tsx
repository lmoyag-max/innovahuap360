import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { api, apiErrorMessage } from '../../lib/api'

interface FormState {
  fullName: string
  rut: string
  email: string
  phone: string
  unit: string
  position: string
  observation: string
}

const EMPTY: FormState = { fullName: '', rut: '', email: '', phone: '', unit: '', position: '', observation: '' }

const RUT_PATTERN = '^\\d{7,8}-[0-9kK]$'

export function EventRegistrationModal({
  event,
  onClose,
}: {
  event: { id: string; title: string } | null
  onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY)

  const submit = useMutation({
    mutationFn: () => {
      if (!event) throw new Error('Evento no disponible')
      const { observation, ...required } = form
      return api.post(`/public/eventos/${event.id}/inscripciones`, {
        ...required,
        observation: observation || undefined,
      })
    },
  })

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setForm(EMPTY)
      submit.reset()
    }, 200)
  }

  return (
    <Modal open={!!event} onClose={handleClose} title="Inscripción al evento" maxWidth={480}>
      {submit.isSuccess ? (
        <div className="text-center py-4">
          <span
            className="inline-flex w-12 h-12 rounded-2xl items-center justify-center mb-4"
            style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
          >
            <Check size={22} />
          </span>
          <p className="text-[14px] text-body leading-relaxed">
            Su inscripción fue registrada correctamente. Recibirá una confirmación en su correo electrónico.
          </p>
          <button
            onClick={handleClose}
            className="mt-5 h-10 px-5 rounded-xl text-white font-bold text-sm"
            style={{ background: 'var(--accent)' }}
          >
            Cerrar
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit.mutate()
          }}
        >
          {submit.isError && (
            <p className="mb-4 p-3 rounded-[10px] text-[13px]" style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}>
              {apiErrorMessage(
                submit.error,
                'No fue posible registrar la inscripción en este momento. Intente nuevamente o contacte al Comité de Innovación.',
              )}
            </p>
          )}

          <label className="block text-[13px] font-semibold text-ink mb-1.5">Evento</label>
          <input
            value={event?.title ?? ''}
            disabled
            className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-sunken text-body text-sm outline-none mb-4"
          />

          <Field label="Nombre completo" value={form.fullName} onChange={set('fullName')} required minLength={2} />
          <Field label="RUT" placeholder="12345678-9" value={form.rut} onChange={set('rut')} required pattern={RUT_PATTERN} />
          <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required />
          <Field label="Teléfono" value={form.phone} onChange={set('phone')} required minLength={2} />
          <Field label="Servicio o unidad" value={form.unit} onChange={set('unit')} required minLength={2} />
          <Field label="Cargo o rol" value={form.position} onChange={set('position')} required minLength={2} />

          <label className="block text-[13px] font-semibold text-ink mb-1.5">Observación (opcional)</label>
          <textarea
            value={form.observation}
            onChange={set('observation')}
            maxLength={2000}
            className="w-full h-20 p-3 rounded-[10px] border border-line bg-inset text-body text-sm outline-none resize-none mb-5 focus:border-[var(--accent)]"
          />

          <button
            type="submit"
            disabled={submit.isPending}
            className="w-full h-11 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {submit.isPending ? 'Enviando…' : 'Confirmar inscripción'}
          </button>
        </form>
      )}
    </Modal>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  pattern,
  type = 'text',
}: {
  label: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
  minLength?: number
  pattern?: string
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
        pattern={pattern}
        className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-inset text-body text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
      />
    </div>
  )
}
