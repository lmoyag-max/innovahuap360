import { Link } from 'react-router-dom'

/** Logotipo + wordmark INNOVAHUAP 360. `subtitle` cambia según contexto. */
export default function Brand({
  subtitle = 'COMITÉ DE INNOVACIÓN · HUAP',
  to = '/',
}: {
  subtitle?: string
  to?: string
}) {
  return (
    <Link to={to} className="flex items-center gap-2.5 shrink-0">
      <img src="/logo.png" alt="HUAP" className="w-9 h-9 object-contain" />
      <span className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-ink text-[15px] whitespace-nowrap">
          INNOVA<span style={{ color: 'var(--accent)' }}>HUAP</span>{' '}
          <span className="font-semibold text-muted">360</span>
        </span>
        <span className="font-mono text-[8.5px] tracking-[0.1em] text-subtle mt-0.5 whitespace-nowrap">
          {subtitle}
        </span>
      </span>
    </Link>
  )
}
