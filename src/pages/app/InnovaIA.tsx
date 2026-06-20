import { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { iaCaps, iaCard } from '../../data/app'

interface Msg { who: 'ia' | 'user'; text: string; card?: boolean }

const initial: Msg[] = [
  { who: 'ia', text: 'Hola, soy InnovaIA, el copiloto del Comité de Innovación. ¿En qué te ayudo hoy? Puedo redactar actas, fichas de proyecto, KPIs, cartas Gantt e informes.' },
  { who: 'user', text: 'Genera una ficha de proyecto para el piloto de triage con IA.' },
  { who: 'ia', text: 'Listo. Preparé una ficha con objetivo, alcance, sponsor y 3 KPIs sugeridos:', card: true },
]

export default function InnovaIA() {
  const [msgs, setMsgs] = useState<Msg[]>(initial)
  const [input, setInput] = useState('')

  function send(text: string) {
    const t = text.trim()
    if (!t) return
    setMsgs((m) => [
      ...m,
      { who: 'user', text: t },
      { who: 'ia', text: 'Trabajando en ello… puedo generar un borrador con el contexto del portafolio actual. (Demostración de interfaz.)' },
    ])
    setInput('')
  }

  return (
    <div className="p-4 sm:p-6 max-w-[880px] mx-auto flex flex-col h-full animate-viewin">
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-4.5 mb-[18px]">
        <span
          className="w-[42px] h-[42px] rounded-xl text-white flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,var(--violet-500),var(--accent))' }}
        >
          <Sparkles size={20} />
        </span>
        <div>
          <h1 className="text-[21px] text-ink tracking-tight font-extrabold">InnovaIA</h1>
          <div className="text-[12.5px] text-muted">Copiloto del Comité de Innovación</div>
        </div>
        <span
          className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-[5px] rounded-full"
          style={{ color: 'var(--violet-600)', background: 'var(--violet-50)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--violet-500)' }} /> EN LÍNEA
        </span>
      </div>

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

        {/* Ficha generada */}
        <div className="self-start max-w-[80%] bg-card border border-line rounded-[14px] p-4">
          <div className="text-[13px] font-bold text-ink mb-3">{iaCard.title}</div>
          <div className="flex flex-col gap-2">
            {iaCard.rows.map((r) => (
              <div key={r.k} className="flex gap-3 text-[12.5px]">
                <span className="w-[70px] shrink-0 font-mono text-muted">{r.k}</span>
                <span className="text-ink">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 pt-3">
        <div className="flex flex-wrap gap-2 mb-3">
          {iaCaps.map((c) => (
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
          <button
            onClick={() => send(input)}
            aria-label="Enviar"
            className="w-10 h-10 shrink-0 rounded-[9px] text-white flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
