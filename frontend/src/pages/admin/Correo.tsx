import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Mail, RefreshCcw, Send, XCircle } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { api, apiErrorMessage } from '../../lib/api'

interface MailHealth {
  host: string
  port: number
  secure: boolean
  user: string
  from: string
  fromName: string
  configured: boolean
  connection: 'ok' | 'error'
  message: string
  checkedAt: string
}

export default function Correo() {
  const queryClient = useQueryClient()
  const [testTo, setTestTo] = useState('')
  const [testFeedback, setTestFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  const { data: health, isLoading, isFetching } = useQuery<MailHealth>({
    queryKey: ['mail-health'],
    queryFn: async () => (await api.get('/mail/health')).data,
  })

  const testMutation = useMutation({
    mutationFn: (to: string) => api.post('/mail/test', { to }),
    onSuccess: () => {
      setTestFeedback({ ok: true, message: `Correo de prueba enviado a ${testTo}.` })
      queryClient.invalidateQueries({ queryKey: ['mail-health'] })
    },
    onError: (error) => setTestFeedback({ ok: false, message: apiErrorMessage(error, 'No fue posible enviar el correo de prueba') }),
  })

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault()
    setTestFeedback(null)
    testMutation.mutate(testTo)
  }

  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>ADMINISTRACIÓN</Eyebrow>
      <h1 className="mt-1.5 mb-2 text-[22px] sm:text-[26px] text-ink tracking-tight font-extrabold">Correo</h1>
      <p className="text-[13px] text-muted mb-5">
        Configuración SMTP usada para recuperación de contraseña, notificaciones del Banco de Ideas y avisos del
        Comité. La contraseña SMTP nunca se muestra aquí ni se expone por API.
      </p>

      {isLoading && <p className="text-[13px] text-muted">Cargando…</p>}

      {health && (
        <div className="bg-card border border-line rounded-card p-5 mb-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-[14px] font-bold text-ink flex items-center gap-2">
              <Mail size={16} /> Configuración SMTP
            </h3>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['mail-health'] })}
              disabled={isFetching}
              className="h-8 px-3 rounded-md border border-line text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <RefreshCcw size={13} className={isFetching ? 'animate-spin' : ''} /> Verificar conexión
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px] mb-4">
            <Field label="SMTP_HOST" value={health.host} />
            <Field label="SMTP_PORT" value={String(health.port)} />
            <Field label="SMTP_USER" value={health.user || '—'} />
            <Field label="SMTP_FROM" value={health.from} />
            <Field label="SMTP_FROM_NAME" value={health.fromName} />
            <Field label="SMTP_SECURE" value={health.secure ? 'true' : 'false'} />
          </div>

          <div
            className="flex items-start gap-2 p-3 rounded-md text-[12.5px]"
            style={
              health.connection === 'ok'
                ? { background: 'var(--green-50, #ecfdf5)', color: 'var(--green-700, #047857)' }
                : { background: 'var(--accent-50)', color: 'var(--accent-700)' }
            }
          >
            {health.connection === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
            <div>
              <div className="font-semibold">{health.connection === 'ok' ? 'Conexión SMTP correcta' : 'No se pudo conectar al SMTP'}</div>
              <div className="opacity-90">{health.message}</div>
              <div className="text-[11px] opacity-70 mt-1">Última verificación: {new Date(health.checkedAt).toLocaleString('es-CL')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-line rounded-card p-5">
        <h3 className="text-[14px] font-bold text-ink mb-3">Probar envío</h3>
        <form onSubmit={handleTest} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
            <span className="text-[12px] font-semibold text-body">Correo destinatario</span>
            <input
              type="email"
              required
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="nombre@huap.cl"
              className="h-10 px-3 rounded-md border border-line bg-inset text-[13px] outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={testMutation.isPending}
            className="h-10 px-4 rounded-md text-white font-semibold text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            <Send size={14} /> {testMutation.isPending ? 'Enviando…' : 'Probar envío'}
          </button>
        </form>
        {testFeedback && (
          <p className="mt-3 text-[12.5px]" style={{ color: testFeedback.ok ? 'var(--green-700, #047857)' : 'var(--accent-700)' }}>
            {testFeedback.message}
          </p>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-inset rounded-md px-3 py-2">
      <div className="text-[10.5px] font-mono text-subtle uppercase tracking-wide">{label}</div>
      <div className="text-ink font-medium truncate">{value}</div>
    </div>
  )
}
