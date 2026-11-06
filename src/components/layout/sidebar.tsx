import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Flame, LogOut } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { navItems } from '@/components/layout/nav-items'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import { useAppStore } from '@/store/useAppStore'
import { computeStreak } from '@/services/plannerService'
import { cn, initials } from '@/lib/utils'

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const profile = useAppStore((state) => state.profile)
  const session = useAppStore((state) => state.session)
  const slots = useAppStore((state) => state.slots)
  const examMode = useAppStore((state) => state.examMode)
  const logout = useAppStore((state) => state.logout)
  const [leaving, setLeaving] = useState(false)
  const streak = useMemo(() => computeStreak(slots), [slots])

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-sidebar/95 backdrop-blur-xl transition-[width] duration-300 md:flex',
        collapsed ? 'w-[84px]' : 'w-[264px]',
      )}
    >
      <div className={cn('flex h-[72px] items-center border-b border-border px-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Logo to="/dashboard" compact={collapsed} />
        {!collapsed && (
          <button
            onClick={onToggle}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? t(`nav.${item.key}`) : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-[19px] shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{t(`nav.${item.key}`)}</span>
              )}
              {!collapsed && item.key === 'exam' && examMode.active && (
                <span className="size-2 rounded-full bg-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.18)]" />
              )}
              {collapsed && item.key === 'exam' && examMode.active && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-2xl border border-accent/20 bg-gradient-to-br from-amber-400/10 to-orange-500/5 p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Flame className="size-4 fill-accent" />
            </span>
            <div>
              <p className="text-sm font-bold">
                {streak.current} {t('streak.label')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('streak.best')}: {streak.best}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={cn('border-t border-border p-3', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-2.5 rounded-xl p-2', collapsed ? 'justify-center' : 'bg-muted/60')}>
          <Avatar className="size-9">
            <AvatarFallback>{initials(profile?.name ?? 'Student')}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{profile?.name ?? 'Student'}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {session?.guest ? t('guest.banner').split('—')[0] : profile?.course || profile?.email}
                </p>
              </div>
              <button
                onClick={async () => {
                  setLeaving(true)
                  await logout()
                  setLeaving(false)
                }}
                disabled={leaving}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
                aria-label={t('common.logout')}
                title={t('common.logout')}
              >
                <LogOut className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
