import type { ReactNode } from 'react'
import { Eyebrow } from './ui'

/** Cabecera estándar de página interior del portal público. */
export default function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-2.5 text-[28px] sm:text-[36px] lg:text-[38px] text-ink tracking-tight leading-[1.12] font-extrabold">
        {title}
      </h1>
      {intro && <p className="mt-4 max-w-[620px] text-[15px] sm:text-base text-body leading-relaxed">{intro}</p>}
      {children}
    </div>
  )
}
