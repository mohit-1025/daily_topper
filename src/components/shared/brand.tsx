import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({
  to = '/',
  compact = false,
  className,
}: {
  to?: string
  compact?: boolean
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn('group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      aria-label="Daily Topper home"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
        <GraduationCap className="size-5" strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background bg-accent" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight">
          Daily <span className="gradient-text">Topper</span>
        </span>
      )}
    </Link>
  )
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow',
        className,
      )}
    >
      <GraduationCap className="size-5" strokeWidth={2.2} />
    </span>
  )
}
