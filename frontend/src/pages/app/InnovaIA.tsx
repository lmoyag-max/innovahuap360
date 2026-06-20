import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Sparkles, Send } from 'lucide-react'
import { api, apiErrorMessage } from '../../lib/api'

interface Msg { who: 'ia' | 'user'; text: string }

const WELCOME: Msg = {
  who: 'ia',
  text: 'Hola, soy InnovaIA, el copiloto del Comité de Innovación. ¿En qué te ayudo hoy? Puedo redactar actas, fichas de proyecto, KPIs, cartas Gantt e informes.',
}

interface Capabilities { capabilities: string[]; provider: string; configured: boolean }

export default function InnovaIA() {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME])
  const [input, setInput] = useState('')

  const { data: caps } = useQuery<Capabilities>({
    queryKey: ['innovaia-capabilities'],
    queryFn: async () => (await api.get('/innovaia/capabilities')).data,
  })

  const askMutation = useMutation({
    mutationFn: (prompt: string) => api.post<{ answer: string }>('/innovaia/ask', { prompt }),
  })

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => [...m, { who: 'user', text: t }])
    setInput('')
    askMutation.mutate(t, {
      onSuccess: (res) => setMsgs((m) => [...m, { who: 'ia', text: res.data.answer || 'No obtuve una respuesta del modelo.' }]),
      onError: (err) => setMsgs((m) => [...m, { who: 'ia', text: apiErrorMessage(err, 'InnovaIA no está disponible en este momento.') }]),
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-[880px] mx-auto flex flex-col h-full animate-viewin">
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-4.5 mb-[18px]">
        <span className="w-[42px] h-[42px] rounded-xl text-white flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--violet-500),var(--accent))' }}>
          <Sparkles size={20} />
        </span>
        <div>
          <h1 className="text-[21px] text-ink tracking-tight font-extrabold">InnovaIA</h1>
          <div className="text-[12.5px] text-muted">Copiloto del Comité de Innovación</div>
        </div>
        {caps && (
          <span
            className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-[5px] rounded-full"
            style={caps.configured ? { color: 'var(--green-600)', background: 'var(--green-50)' } : { color: 'var(--amber-600)', background: 'var(--amber-50)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: caps.configured ? 'var(--green-500)' : 'var(--amber-500)' }} />
            {caps.configured ? 'EN LÍNEA' : 'NO CONFIGURADO'}
          </span>
        )}
      </div>

      {!caps?.configured && caps && (
        <div className="mb-4 p-3 rounded-[10px] text-[12.5px]" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}>
          InnovaIA no tiene un proveedor de IA configurado en este entorno (variables <code className="font-mono">INNOVAIA_PROVIDER</code> /{' '}
          <code className="font-mono">INNOVAIA_API_KEY</code>). Puedes seguir probando la interfaz; las respuestas mostrarán este aviso.
        </div>
      )}

      {/* Conversación */}
      <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto p-0.5 pb-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] px-4 py-3 text-sm leading-relaxed"
              style={
                m.who === 'user'
                  ? { background: 'var(--accent)', color: '#fff', borderRadius: '14px 14px 4px 14px' }
                  : { background: 'var(--surface-card)', color: 'var(--text-body)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px' }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {askMutation.isPending && (
          <div className="flex justify-start">
            <div className="px-4 py-3 text-sm text-muted border border-line rounded-[14px]">Pensando…</div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 pt-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {(caps?.capabilities ?? []).map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="text-xs text-body bg-card border border-line px-3 py-1.5 rounded-full transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2.5 items-center bg-card border border-line rounded-xl p-2 pl-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Pídele algo a InnovaIA…"
            className="flex-1 border-none bg-transparent outline-none text-sm text-body"
          />
          <button onClick={() => send(input)} aria-label="Enviar" className="w-10 h-10 shrink-0 rounded-[9px] text-white flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
