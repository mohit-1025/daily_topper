import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, LogOut, Settings, Sparkles, UserRound } from 'lucide-react'
import { mobileNavItems, navItems } from '@/components/layout/nav-items'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const session = useAppStore((state) => state.session)
  const logout = useAppStore((state) => state.logout)
  const secondaryActive = ['/progress', '/quizzes', '/exam', '/settings'].includes(location.pathname)

  return (
    <>
      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl md:hidden"
        aria-label="Primary navigation"
      >
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[10px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', active && 'bg-primary/10')}>
                  <Icon className="size-[19px]" />
                </span>
                <span className="truncate">{t(`nav.${item.key}`)}</span>
              </NavLink>
            )
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 pt-1.5 text-[10px] font-semibold transition-colors',
              secondaryActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label={t('common.more')}
          >
            <span className={cn('flex h-7 w-12 items-center justify-center rounded-full transition-colors', secondaryActive && 'bg-primary/10')}>
              <Sparkles className="size-[19px]" />
            </span>
            <span>{t('common.more')}</span>
          </button>
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t('common.more')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 px-5 pb-4">
            {navItems.slice(4).map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex min-h-[76px] flex-col items-start justify-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors',
                    active ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border bg-card hover:bg-muted',
                  )}
                >
                  <Icon className="size-5" />
                  {t(`nav.${item.key}`)}
                  <ChevronRight className="hidden" />
                </NavLink>
              )
            })}
          </div>
          <div className="space-y-1 border-t border-border px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <NavLink
              to="/settings"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-muted"
            >
              <Settings className="size-4" />
              {t('nav.settings')}
            </NavLink>
            {session?.guest && (
              <button
                onClick={() => {
                  setMoreOpen(false)
                  navigate('/auth?mode=signup')
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-muted"
              >
                <UserRound className="size-4" />
                {t('settings.createAccount')}
              </button>
            )}
            <button
              onClick={async () => {
                setMoreOpen(false)
                await logout()
                navigate('/')
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              {t('common.logout')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
