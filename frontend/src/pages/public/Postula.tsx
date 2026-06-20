import { useState } from 'react'
import { Check } from 'lucide-react'
import { Eyebrow } from '../../components/ui'

const ambitos = ['Clínico', 'Gestión', 'Digital', 'Humanización', 'IA']
const beneficios = [
  { t: 'Abierto a todos', d: 'Funcionarios, usuarios y colaboradores.' },
  { t: 'Acompañamiento', d: 'Te ayudamos a darle forma con la ficha de factibilidad.' },
  { t: 'Transparente', d: 'Sigue tu idea en el portafolio público.' },
]

export default function Postula() {
  const [ambito, setAmbito] = useState('Clínico')

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
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2 mb-5.5 mb-6">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <span
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0"
                  style={
                    n === 1
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--surface-sunken)', color: 'var(--text-muted)' }
                  }
                >
                  {n}
                </span>
                {i < 2 && <span className="h-0.5 flex-1 bg-line mx-1" />}
              </div>
            ))}
          </div>

          <Field label="Nombre del proponente" placeholder="Tu nombre" />
          <Field label="Unidad o servicio" placeholder="Ej: Urgencia, Farmacia, TI…" />
          <Field label="Título de tu idea" placeholder="En una frase, ¿cuál es tu idea?" />
          <label className="block text-[13px] font-semibold text-ink mb-1.5">¿Qué problema resuelve?</label>
          <textarea
            placeholder="Describe el problema y cómo lo mejorarías…"
            className="w-full h-24 p-3 rounded-[10px] border border-line bg-inset text-body text-sm outline-none resize-none mb-4 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
          />

          <label className="block text-[13px] font-semibold text-ink mb-2.5">Ámbito</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {ambitos.map((a) => {
              const on = a === ambito
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmbito(a)}
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
            className="w-full h-[50px] rounded-xl text-white font-bold text-[15px] transition-colors"
            style={{ background: 'var(--accent)', boxShadow: '0 6px 18px rgba(237,29,37,.32)' }}
          >
            Enviar mi idea
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full h-11 px-3.5 rounded-[10px] border border-line bg-inset text-body text-sm outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
      />
    </div>
  )
}
