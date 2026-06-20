import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth, apiErrorMessage } from '../../lib/auth-context'

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
type FormValues = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname?: string } } }
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await login(values.email, values.password)
      navigate(location.state?.from?.pathname ?? '/app', { replace: true })
    } catch (error) {
      setServerError(apiErrorMessage(error, 'No fue posible iniciar sesión'))
    }
  }

  return (
    <div>
      <h1 className="text-[19px] font-bold text-ink mb-1">Acceso Comité</h1>
      <p className="text-[13px] text-muted mb-6">Plataforma interna del Comité de Innovación HUAP.</p>

      {serverError && (
        <div className="flex items-start gap-2 mb-4 p-3 rounded-md text-[12.5px]" style={{ background: 'var(--accent-50)', color: 'var(--accent-700)' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-body">Correo institucional</span>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="email"
              autoComplete="email"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              placeholder="nombre@huap.cl"
              {...register('email')}
            />
          </div>
          {errors.email && <span className="text-[11.5px]" style={{ color: 'var(--accent)' }}>{errors.email.message}</span>}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-semibold text-body">Contraseña</span>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="password"
              autoComplete="current-password"
              className="w-full h-11 pl-9 pr-3 rounded-md border border-line bg-inset text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
              placeholder="••••••••"
              {...register('password')}
            />
          </div>
          {errors.password && <span className="text-[11.5px]" style={{ color: 'var(--accent)' }}>{errors.password.message}</span>}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-md text-white font-semibold text-[13.5px] disabled:opacity-60"
          style={{ background: 'var(--accent)' }}
        >
          {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      <Link to="/recuperar-password" className="block text-center mt-5 text-[12.5px] text-muted hover:text-ink transition-colors">
        ¿Olvidaste tu contraseña?
      </Link>
    </div>
  )
}
