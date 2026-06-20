import { Search, FileText, Download, FolderOpen } from 'lucide-react'
import { Eyebrow } from '../../components/ui'
import { conocFolders, conocRecientes } from '../../data/app'

export default function ConocimientoInterno() {
  return (
    <div className="p-4 sm:p-6 animate-viewin">
      <Eyebrow>REPOSITORIO INTERNO</Eyebrow>
      <h1 className="mt-1.5 mb-1 text-[22px] sm:text-2xl text-ink tracking-tight font-extrabold">
        Conocimiento del Comité
      </h1>

      <div className="relative max-w-[480px] my-4.5 my-5">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle" />
        <input
          placeholder="Buscar actas, informes, resoluciones…"
          className="w-full h-[42px] pl-9 pr-3.5 rounded-[10px] border border-line bg-card text-body text-[13.5px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6.5 mb-7">
        {conocFolders.map((f) => (
          <div
            key={f.l}
            className="bg-card border border-line rounded-[13px] p-4.5 p-[18px] text-center cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <span
              className="inline-flex w-10 h-10 rounded-[10px] items-center justify-center mb-2.5"
              style={{ background: 'var(--accent-50)', color: 'var(--accent)' }}
            >
              <FolderOpen size={18} />
            </span>
            <div className="text-[13px] font-semibold text-ink">{f.l}</div>
            <div className="font-mono text-[11px] text-muted mt-0.5">{f.n} docs</div>
          </div>
        ))}
      </div>

      <h3 className="text-[15px] text-ink mb-3 font-bold">Recientes</h3>
      <div className="bg-card border border-line rounded-card overflow-hidden">
        {conocRecientes.map((d) => (
          <div key={d.title} className="flex items-center gap-3.5 px-4 py-3.5 sm:px-[18px] border-b border-line last:border-0 hover:bg-hover transition-colors">
            <span className="w-[34px] h-[34px] shrink-0 rounded-[9px] bg-sunken text-muted flex items-center justify-center">
              <FileText size={17} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{d.title}</div>
              <div className="font-mono text-[11px] text-muted mt-0.5">{d.type} · {d.who} · {d.when}</div>
            </div>
            <button className="shrink-0 text-muted hover:text-[var(--accent)] transition-colors">
              <Download size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
