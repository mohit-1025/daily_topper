import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookDoodle, NoteDoodle, StarDoodle } from '@/components/shared/doodles'

export function NoteLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-base text-muted-foreground">
      <span className="flex size-7 -rotate-3 items-center justify-center rounded-[4px_8px_5px_7px] border-2 border-foreground bg-card font-display text-sm text-foreground">
        {index}
      </span>
      {children}
    </p>
  )
}

export function PageHero({
  eyebrow,
  title,
  intro,
  updated,
}: {
  eyebrow: string
  title: string
  intro: string
  updated?: string
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6">
      <div className="flex items-start justify-between gap-8">
        <div className="max-w-[62ch]">
          <p className="inline-flex -rotate-1 items-center gap-2 border-2 border-dashed border-foreground/50 bg-accent/25 px-2.5 py-1 text-sm font-semibold">
            <StarDoodle className="size-4" /> {eyebrow}
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-[62ch] text-lg leading-8 text-muted-foreground">{intro}</p>
          {updated && (
            <p className="mt-4 inline-flex items-center gap-2 border-b-2 border-dashed border-border pb-1 text-sm text-muted-foreground">
              <CalendarDays className="size-4" /> {updated}
            </p>
          )}
        </div>

        <div aria-hidden className="relative hidden shrink-0 md:block">
          <div className="paper-card tape w-40 -rotate-2 p-4 pt-6">
            <BookDoodle className="size-6" />
            <p className="mt-3 font-display text-lg leading-6">
              Daily <span className="mark">Topper</span>
            </p>
            <span className="mt-3 block border-t-2 border-dashed border-border" />
            <span className="mt-2 block h-1 w-16 bg-accent" />
            <span className="mt-1.5 block h-1 w-20 bg-border" />
            <span className="mt-1.5 block h-1 w-12 bg-border" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <span className="h-0 flex-1 border-t-2 border-dashed border-border" />
        <span className="size-2 rotate-45 border-2 border-foreground/60" />
        <span className="h-0 flex-1 border-t-2 border-dashed border-border" />
      </div>
    </div>
  )
}

export function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  const { t } = useTranslation()
  const sections = [1, 2, 3, 4, 5, 6].map((index) => ({
    id: `${page}-s${index}`,
    title: t(`public.${page}.s${index}Title`),
    body: t(`public.${page}.s${index}Body`),
  }))

  return (
    <>
      <PageHero
        eyebrow={t(`public.${page}.eyebrow`)}
        title={t(`public.${page}.title`)}
        intro={t(`public.${page}.intro`)}
        updated={t(`public.${page}.updated`)}
      />
      <div className="mx-auto mt-10 grid w-full max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <div className="paper-card sticky top-24 p-4">
            <p className="flex items-center gap-2 font-display text-lg">
              <NoteDoodle className="size-5" /> {t('public.legal.onThisPage')}
            </p>
            <ol className="mt-3 space-y-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="group flex items-start gap-2 text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="font-display text-xs text-foreground/50">0{index + 1}</span>
                    <span className="link-underline">{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 border-t-2 border-dashed border-border pt-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 -rotate-3 items-center justify-center rounded-[4px_8px_5px_7px] border-2 border-foreground/60 font-display text-xs">
                  0{index + 1}
                </span>
                <div>
                  <h2 className="font-display text-2xl">{section.title}</h2>
                  <p className="mt-2 max-w-[65ch] text-base leading-8 text-muted-foreground">{section.body}</p>
                </div>
              </div>
            </section>
          ))}

          <div className="paper-card tape relative mt-10 p-6 pt-9">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-2.5 rounded-[4px_12px_6px_10px] border border-dashed border-foreground/15"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-foreground/70 bg-accent/30">
                  <ShieldCheck className="size-5" strokeWidth={1.9} />
                </span>
                <p className="max-w-[52ch] text-base leading-8 text-muted-foreground">{t('landing.footerNote')}</p>
              </div>
              <Button variant="outline" size="sm" asChild className="group shrink-0">
                <Link to="/faq">
                  {t('public.nav.faq')}
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
