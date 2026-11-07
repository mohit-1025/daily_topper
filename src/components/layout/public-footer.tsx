import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { useAppStore } from '@/store/useAppStore'

export function PublicFooter({ anchorsFromHome = false }: { anchorsFromHome?: boolean }) {
  const { t } = useTranslation()
  const session = useAppStore((state) => state.session)
  const prefix = anchorsFromHome ? '/' : ''

  const sections = [
    { href: `${prefix}#features`, label: t('landing.nav.inside') },
    { href: `${prefix}#how`, label: t('landing.nav.how') },
    { href: `${prefix}#exam`, label: t('landing.nav.exam') },
    { href: `${prefix}#week`, label: t('landing.nav.week') },
  ]

  const pages = [
    { to: '/about', label: t('public.nav.about') },
    { to: '/faq', label: t('public.nav.faq') },
  ]

  const legal = [
    { to: '/privacy', label: t('public.nav.privacy') },
    { to: '/terms', label: t('public.nav.terms') },
  ]

  return (
    <footer className="border-t-2 border-foreground/80 bg-card/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.9fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-3 max-w-[40ch] text-base leading-7 text-muted-foreground">
              {t('landing.footerNote')}
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <ShieldCheck className="size-4" /> {t('landing.deviceNote')}
            </p>
          </div>

          <nav
            aria-label={t('public.footer.explore')}
            className="max-sm:border-t-2 max-sm:border-dashed max-sm:border-border max-sm:pt-5"
          >
            <p className="font-display text-lg">{t('public.footer.explore')}</p>
            <ul className="mt-2 space-y-1.5 text-base text-muted-foreground">
              {sections.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="link-underline hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            aria-label={t('public.footer.pages')}
            className="max-sm:border-t-2 max-sm:border-dashed max-sm:border-border max-sm:pt-5"
          >
            <p className="font-display text-lg">{t('public.footer.pages')}</p>
            <ul className="mt-2 space-y-1.5 text-base text-muted-foreground">
              {pages.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="link-underline hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            aria-label={t('public.footer.legal')}
            className="max-sm:border-t-2 max-sm:border-dashed max-sm:border-border max-sm:pt-5"
          >
            <p className="font-display text-lg">{t('public.footer.legal')}</p>
            <ul className="mt-2 space-y-1.5 text-base text-muted-foreground">
              {legal.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="link-underline hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            aria-label={t('public.footer.account')}
            className="max-sm:border-t-2 max-sm:border-dashed max-sm:border-border max-sm:pt-5"
          >
            <p className="font-display text-lg">{t('public.footer.account')}</p>
            <ul className="mt-2 space-y-1.5 text-base text-muted-foreground">
              {session ? (
                <li>
                  <Link to="/dashboard" className="link-underline hover:text-foreground">
                    {t('nav.dashboard')}
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/auth" className="link-underline hover:text-foreground">
                      {t('common.login')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth?mode=signup" className="link-underline hover:text-foreground">
                      {t('common.signup')}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
        <p className="mt-10 border-t-2 border-dashed border-border pt-4 text-sm text-muted-foreground">
          © 2026 Daily Topper
        </p>
      </div>
    </footer>
  )
}
