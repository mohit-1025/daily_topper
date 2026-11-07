import { Link, useLocation } from 'react-router-dom'
import { BookDoodle } from '@/components/shared/doodles'
import { cn } from '@/lib/utils'

export function Logo({
  to = '/',
  compact = false,
  className,
  textClassName,
}: {
  to?: string
  compact?: boolean
  className?: string
  textClassName?: string
}) {
  const location = useLocation()

  return (
    <Link
      to={to}
      onClick={() => {
        if (location.pathname === to) window.scrollTo({ top: 0 })
      }}
      className={cn('group inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none', className)}
      aria-label="Daily Topper home"
    >
      <span className="relative flex size-10 shrink-0 -rotate-2 items-center justify-center rounded-[4px_11px_5px_9px] border-2 border-foreground bg-card text-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.3)]">
        <BookDoodle className="size-5" strokeWidth={2} />
        <span className="absolute -right-1.5 -top-1.5 h-3 w-6 rotate-6 bg-[var(--tape)]" aria-hidden />
      </span>
      {!compact && (
        <span className={cn('whitespace-nowrap font-display text-xl tracking-wide', textClassName)}>
          Daily <span className="mark">Topper</span>
        </span>
      )}
    </Link>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 -rotate-2 items-center justify-center rounded-[4px_11px_5px_9px] border-2 border-foreground bg-card text-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.3)]',
        className,
      )}
    >
      <BookDoodle className="size-5" strokeWidth={2} />
    </span>
  )
}
