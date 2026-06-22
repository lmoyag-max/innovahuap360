import { Link } from 'react-router-dom'
import { Dot } from './Badge'

export interface Project {
  name: string
  desc: string
  stage: string
  owner: string
  kpi: string
  /** color de la barra superior / categoría */
  bar: string
}

/** Tarjeta de proyecto destacado (proyectos público e inicio). */
export function ProjectCard({ project, to = '/proyectos' }: { project: Project; to?: string }) {
  return (
    <Link
      to={to}
      className="group bg-card border border-line rounded-card overflow-hidden shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover block"
    >
      <div className="h-[7px]" style={{ background: project.bar }} />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <Dot color={project.bar} size={8} />
          <span className="font-mono text-[10px] tracking-wider text-muted bg-sunken px-2 py-0.5 rounded-full">
            {project.stage}
          </span>
        </div>
        <h4 className="text-[16.5px] text-ink tracking-tight leading-snug mb-1.5 font-semibold">
          {project.name}
        </h4>
        <p className="text-[13px] text-muted leading-relaxed mb-4">{project.desc}</p>
        <div className="flex items-center justify-between pt-3.5 border-t border-line text-xs">
          <span className="text-muted">{project.owner}</span>
          <span className="font-mono font-semibold" style={{ color: 'var(--accent)' }}>
            {project.kpi}
          </span>
        </div>
      </div>
    </Link>
  )
}
