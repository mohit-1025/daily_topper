import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteDoodle } from '@/components/shared/doodles'
import { PageHero } from './shared'

export function FaqPage() {
  const { t } = useTranslation()
  const faqs = [1, 2, 3, 4, 5, 6, 7, 8].map((index) => ({
    question: t(`public.faq.q${index}`),
    answer: t(`public.faq.a${index}`),
  }))

  return (
    <>
      <PageHero
        eyebrow={t('public.faq.eyebrow')}
        title={t('public.faq.title')}
        intro={t('public.faq.intro')}
      />
      <div className="mx-auto mt-10 w-full max-w-5xl px-4 sm:px-6">
        <div className="paper-card relative p-3 pt-6 sm:p-5 sm:pt-10">
          <div aria-hidden className="absolute inset-x-8 -top-2.5 z-10 hidden justify-between sm:flex">
            {Array.from({ length: 16 }).map((_, index) => (
              <span
                key={index}
                className="h-5 w-2 -rotate-6 rounded-full border-2 border-foreground bg-[var(--paper)] shadow-[1px_1px_0_hsl(var(--foreground)/0.18)]"
              />
            ))}
          </div>
          <span
            aria-hidden
            className="absolute bottom-8 left-3 top-12 hidden w-px bg-[hsl(var(--margin-line-hsl)/0.45)] sm:block"
          />

          <div className="divide-y-2 divide-dashed divide-border">
            {faqs.map((faq, index) => (
              <details key={faq.question} className="group">
                <summary className="flex cursor-pointer list-none items-start gap-3 rounded-[4px_10px_6px_8px] px-1 py-4 transition-colors duration-200 hover:bg-accent/15 sm:gap-4 sm:px-2 [&::-webkit-details-marker]:hidden">
                  <span className="mt-1 shrink-0 font-display text-sm text-muted-foreground">
                    0{index + 1}
                  </span>
                  <span className="flex-1 font-display text-xl leading-7">{faq.question}</span>
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[3px_8px_4px_7px] border-2 border-foreground transition-colors duration-200 group-hover:bg-accent/40 group-open:bg-accent/50">
                    <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" />
                  </span>
                </summary>
                <p className="max-w-[65ch] pb-4 pl-7 pr-8 text-base leading-8 text-muted-foreground sm:pl-9">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        <div className="paper-card tape relative mt-12 p-6 pt-9 sm:p-7 sm:pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-foreground/70 bg-accent/30">
                <NoteDoodle className="size-5" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-8">{t('public.faq.stillTitle')}</h2>
                <p className="mt-1 max-w-[58ch] text-base leading-8 text-muted-foreground">
                  {t('public.faq.stillDesc')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Button asChild size="sm">
                <Link to="/auth?mode=signup">{t('landing.getStarted')}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/privacy">{t('public.nav.privacy')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
