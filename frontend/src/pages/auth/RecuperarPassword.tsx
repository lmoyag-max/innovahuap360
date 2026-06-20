import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle2 } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'

const schema = z.object({ email: z.string().email('Ingresa un correo válido') })
type FormValues = z.infer<typeof schema>

export default function RecuperarPassword() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await api.post('/auth/forgot-password', values)
      setSent(true)
    } catch (error) {
      setServerError(apiErrorMessage(error))
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: 'var(--green-500)' }} />
        <h1 className="text-[17px] font-bold text-ink mb-2">Revisa tu correo</h1>
        <p className="text-[13px] text-muted">
          Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Es válido por 30
          minutos.
        </p>
        <Link to="/login" className="inline-block mt-5 text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[17px] font-bold text-ink mb-1">Recuperar contraseña</h1>
      <p className="text-[13px] text-muted mb-6">Te enviaremos un enlace de un solo uso a tu correo institucional.</p>

      {serverError && <p className="text-[12.5px] mb-4" style={{ color: 'var(--accent)' }}>{serverError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-body">Correo institucional</span>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="email"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              placeholder="nombre@huap.cl"
              {...register('email')}
            />
          </div>
          {errors.email && <span className="text-[11.5px]" style={{ color: 'var(--accent)' }}>{errors.email.message}</span>}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-md text-white font-semibold text-[13.5px] disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
        </button>
      </form>

      <Link to="/login" className="block text-center mt-5 text-[12.5px] text-muted hover:text-ink transition-colors">
        Volver a iniciar sesión
      </Link>
    </div>
  )
}
