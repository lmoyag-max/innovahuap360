import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Lock, CheckCircle2 } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
type FormValues = z.infer<typeof schema>

export default function RestablecerPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await api.post('/auth/reset-password', { token, newPassword: values.newPassword })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (error) {
      setServerError(apiErrorMessage(error, 'El enlace no es válido o ya expiró'))
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: 'var(--green-500)' }} />
        <h1 className="text-[17px] font-bold text-ink mb-2">Contraseña actualizada</h1>
        <p className="text-[13px] text-muted">Redirigiendo a inicio de sesión…</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-[17px] font-bold text-ink mb-1">Restablecer contraseña</h1>
      <p className="text-[13px] text-muted mb-6">Define una nueva contraseña para tu cuenta.</p>

      {serverError && <p className="text-[12.5px] mb-4" style={{ color: 'var(--accent)' }}>{serverError}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-body">Nueva contraseña</span>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="password"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              {...register('newPassword')}
            />
          </div>
          {errors.newPassword && <span className="text-[11.5px]" style={{ color: 'var(--accent)' }}>{errors.newPassword.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-body">Confirmar contraseña</span>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="password"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-[11.5px]" style={{ color: 'var(--accent)' }}>{errors.confirmPassword.message}</span>
          )}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-md text-white font-semibold text-[13.5px] disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {isSubmitting ? 'Guardando…' : 'Restablecer contraseña'}
        </button>
      </form>

      <Link to="/login" className="block text-center mt-5 text-[12.5px] text-muted hover:text-ink transition-colors">
        Volver a iniciar sesión
      </Link>
    </div>
  )
}
