import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const sectionAnchors = [
  { hash: 'features', key: 'landing.nav.inside' },
  { hash: 'how', key: 'landing.nav.how' },
  { hash: 'exam', key: 'landing.nav.exam' },
  { hash: 'week', key: 'landing.nav.week' },
]

const pageLinks = [
  { to: '/about', key: 'public.nav.about' },
  { to: '/faq', key: 'public.nav.faq' },
]

export function PublicHeader() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const session = useAppStore((state) => state.session)
  const [menuOpen, setMenuOpen] = useState(false)
  const anchorPrefix = location.pathname === '/' ? '' : '/'

  return (
    <header className="sticky top-0 z-40 border-b-2 border-foreground/80 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo textClassName="hidden min-[360px]:inline" />
        <nav
          className="hidden items-center gap-4 text-base font-semibold text-muted-foreground lg:flex xl:gap-5"
          aria-label="Public navigation"
        >
          {sectionAnchors.map((item) => (
            <a
              key={item.hash}
              href={`${anchorPrefix}#${item.hash}`}
              className="link-underline hover:text-foreground"
            >
              {t(item.key)}
            </a>
          ))}
          {pageLinks.map((page) => (
            <NavLink
              key={page.to}
              to={page.to}
              className={({ isActive }) =>
                cn('link-underline hover:text-foreground', isActive && 'text-foreground')
              }
            >
              {t(page.key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          {session ? (
            <Button size="sm" className="group" onClick={() => navigate('/dashboard')}>
              {t('nav.dashboard')}
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/auth">{t('common.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth?mode=signup">{t('landing.getStarted')}</Link>
              </Button>
            </>
          )}
          <button
            className="ml-1 flex size-10 items-center justify-center rounded-[4px_10px_5px_8px] border-2 border-foreground lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t-2 border-dashed border-border bg-background px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1 text-base font-semibold">
            {sectionAnchors.map((item) => (
              <a
                key={item.hash}
                href={`${anchorPrefix}#${item.hash}`}
                onClick={() => setMenuOpen(false)}
                className="link-underline rounded-md px-2 py-2 transition-colors hover:bg-muted"
              >
                {t(item.key)}
              </a>
            ))}
            {pageLinks.map((page) => (
              <NavLink
                key={page.to}
                to={page.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'link-underline rounded-md px-2 py-2 transition-colors hover:bg-muted',
                    isActive && 'text-foreground',
                  )
                }
              >
                {t(page.key)}
              </NavLink>
            ))}
            {!session && (
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link to="/auth">{t('common.login')}</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
