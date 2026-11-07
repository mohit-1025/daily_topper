import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteDoodle, PencilDoodle, StarDoodle } from '@/components/shared/doodles'
import { cn } from '@/lib/utils'
import { NoteLabel, PageHero } from './shared'

export function AboutPage() {
  const { t } = useTranslation()

  const principles = [
    {
      icon: CalendarDays,
      title: t('public.about.principles.p1Title'),
      desc: t('public.about.principles.p1Desc'),
      tone: 'bg-accent/60',
    },
    {
      icon: BookOpenCheck,
      title: t('public.about.principles.p2Title'),
      desc: t('public.about.principles.p2Desc'),
      tone: 'bg-secondary/70',
    },
    {
      icon: ShieldCheck,
      title: t('public.about.principles.p3Title'),
      desc: t('public.about.principles.p3Desc'),
      tone: 'bg-[hsl(var(--margin-line-hsl)/0.16)]',
    },
  ]

  const audience = [
    { icon: GraduationCap, title: t('public.about.audience.a1Title'), desc: t('public.about.audience.a1Desc') },
    { icon: Target, title: t('public.about.audience.a2Title'), desc: t('public.about.audience.a2Desc') },
    { icon: BookOpenCheck, title: t('public.about.audience.a3Title'), desc: t('public.about.audience.a3Desc') },
  ]

  return (
    <>
      <PageHero
        eyebrow={t('public.about.eyebrow')}
        title={t('public.about.title')}
        intro={t('public.about.intro')}
      />
      <div className="mx-auto mt-10 w-full max-w-5xl space-y-12 px-4 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
          <div>
            <NoteLabel index="01">
              <PencilDoodle className="size-5" /> {t('public.about.storyTitle')}
            </NoteLabel>
            <span
              aria-hidden
              className="mt-2 block font-display text-7xl leading-[0.8] text-[hsl(var(--margin-line-hsl)/0.6)]"
            >
              &ldquo;
            </span>
            <StarDoodle className="mt-3 size-8 -rotate-12 text-[var(--margin-line)]" />
          </div>
          <div className="paper-card p-6 sm:p-8">
            <p className="max-w-[62ch] text-base leading-8 text-muted-foreground first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-foreground">
              {t('public.about.story1')}
            </p>
            <p className="mt-5 max-w-[62ch] border-l-2 border-[var(--margin-line)] pl-4 text-base leading-8 text-muted-foreground">
              {t('public.about.story2')}
            </p>
          </div>
        </section>

        <section>
          <NoteLabel index="02">
            <NoteDoodle className="size-5" /> {t('public.about.principlesTitle')}
          </NoteLabel>
          <ul className="mt-5 grid gap-5 md:grid-cols-3">
            {principles.map((principle, index) => {
              const Icon = principle.icon
              return (
                <li
                  key={principle.title}
                  className="group relative overflow-hidden paper-card p-0 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]"
                >
                  <div
                    className={cn(
                      'flex items-center justify-between border-b-2 border-foreground/70 px-5 py-2 text-sm font-semibold',
                      principle.tone,
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="size-4" strokeWidth={2} /> 0{index + 1}
                    </span>
                    <span className="font-display text-base leading-none text-foreground/60">
                      p. 0{index + 1}
                    </span>
                  </div>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-4 right-2 select-none font-display text-7xl leading-none text-foreground/[0.06]"
                  >
                    0{index + 1}
                  </span>
                  <div className="relative p-5">
                    <h3 className="font-display text-xl leading-7">{principle.title}</h3>
                    <p className="mt-1 text-base leading-7 text-muted-foreground">{principle.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <NoteLabel index="03">
            <GraduationCap className="size-5" /> {t('public.about.audienceTitle')}
          </NoteLabel>
          <div className="paper-card mt-5 p-2 sm:p-3">
            <ul className="divide-y-2 divide-dashed divide-border">
              {audience.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.title}
                    className="group flex items-start gap-4 rounded-[4px_10px_6px_8px] p-3 transition-colors duration-200 hover:bg-accent/20 sm:p-4"
                  >
                    <span className="mt-0.5 flex size-10 shrink-0 -rotate-2 items-center justify-center rounded-[4px_10px_5px_8px] border-2 border-foreground transition-transform duration-200 group-hover:rotate-3">
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-7">{item.title}</h3>
                      <p className="mt-0.5 text-base leading-7 text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="paper-card tape relative -rotate-1 p-6 pt-10 text-center transition-[transform,box-shadow] duration-200 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)] sm:p-8 sm:pt-12">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-[4px_12px_6px_10px] border border-dashed border-foreground/20"
          />
          <StarDoodle className="absolute left-5 top-6 size-6 -rotate-12 text-[var(--margin-line)]" />
          <PencilDoodle className="absolute bottom-5 right-5 hidden size-6 rotate-12 text-muted-foreground sm:block" />
          <h2 className="relative text-balance font-display text-3xl leading-tight">
            {t('public.about.ctaTitle')}
          </h2>
          <p className="relative mx-auto mt-2 max-w-[52ch] text-base leading-8 text-muted-foreground">
            {t('public.about.ctaDesc')}
          </p>
          <div className="relative mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild className="group">
              <Link to="/auth?mode=signup">
                {t('landing.getStarted')}
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/faq">{t('public.nav.faq')}</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
