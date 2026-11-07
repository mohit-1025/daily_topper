import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  className,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  eyebrow?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 inline-block -rotate-1 border-b-2 border-[var(--margin-line)] text-base font-semibold text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-[60ch] text-base leading-8 text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
