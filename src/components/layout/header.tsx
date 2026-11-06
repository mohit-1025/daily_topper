import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Flame, LogOut, Settings, Sparkles, UserRound } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/store/useAppStore'
import { computeStreak } from '@/services/plannerService'
import { greetingKey, initials, longDate } from '@/lib/utils'

export function Header() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const profile = useAppStore((state) => state.profile)
  const session = useAppStore((state) => state.session)
  const slots = useAppStore((state) => state.slots)
  const logout = useAppStore((state) => state.logout)
  const streak = useMemo(() => computeStreak(slots), [slots])
  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const language = (i18n.language as 'en' | 'hi') || 'en'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-2 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-bold leading-tight sm:text-lg">
            {t(greetingKey())}, {firstName}{' '}
            <span aria-hidden>👋</span>
          </p>
          <p className="mt-0.5 hidden text-xs text-muted-foreground xs:block">
            {longDate(new Date(), language)}
          </p>
        </div>

        <div
          className="flex h-9 items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 text-accent"
          title={`${t('streak.current')}: ${streak.current} · ${t('streak.best')}: ${streak.best}`}
        >
          <Flame className="size-4 fill-accent" />
          <span className="text-sm font-bold tabular-nums">{streak.current}</span>
          <span className="hidden text-[11px] font-medium sm:inline">{t('streak.label')}</span>
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open account menu"
            >
              <Avatar className="size-9 ring-2 ring-border">
                <AvatarFallback>{initials(profile?.name ?? 'Student')}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <p className="text-sm font-semibold text-foreground">{profile?.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{session?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {session?.guest ? (
                  <Badge variant="accent">{t('common.demo')}</Badge>
                ) : (
                  <Badge variant="success">{profile?.course || t('common.welcome')}</Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="size-4" />
                {t('nav.settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/progress">
                <Sparkles className="size-4" />
                {t('nav.progress')}
              </Link>
            </DropdownMenuItem>
            {session?.guest && (
              <DropdownMenuItem asChild>
                <Link to="/auth?mode=signup">
                  <UserRound className="size-4" />
                  {t('settings.createAccount')}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logout()
                navigate('/')
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
