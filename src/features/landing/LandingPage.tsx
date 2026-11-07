import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  Flame,
  GraduationCap,
  LineChart,
  ShieldCheck,
  Target,
  Upload,
} from 'lucide-react'
import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'
import {
  ArrowDoodle,
  CalendarDoodle,
  CircleCrossDoodle,
  NoteDoodle,
  PencilDoodle,
  StarDoodle,
  TickDoodle,
} from '@/components/shared/doodles'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/misc'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

function TodayCard() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:ml-auto">
      <div className="paper-card tape tilted p-5 pt-8 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl leading-8">Saturday, 7 Nov</p>
            <p className="text-base text-muted-foreground">Board exams in 38 days</p>
          </div>
          <span className="flex items-center gap-1 rounded-[3px_8px_4px_7px] border-2 border-foreground bg-accent/60 px-2 py-0.5 text-sm font-semibold">
            <Flame className="size-3.5" /> 6
          </span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <Progress value={50} className="flex-1" />
          <span className="font-display text-3xl leading-none">50%</span>
        </div>

        <ul className="mt-4 space-y-2 text-base">
          <li className="flex items-center gap-2 rounded-[3px_7px_4px_6px] border border-border/80 bg-card/60 px-2.5 py-1.5">
            <TickDoodle className="size-4 shrink-0" />
            <span className="flex-1 truncate">Physics · Laws of Motion</span>
            <span className="text-sm text-muted-foreground">done</span>
          </li>
          <li className="slot-missed flex items-center gap-2 rounded-[3px_7px_4px_6px] border border-[hsl(var(--margin-line-hsl)/0.6)] px-2.5 py-1.5">
            <CircleCrossDoodle className="size-4 shrink-0" />
            <span className="slot-title flex-1 truncate">Chemistry · Bonding</span>
            <span className="slot-meta text-sm">missed</span>
          </li>
          <li className="slot-moved flex items-center gap-2 rounded-[3px_7px_4px_6px] border-2 border-foreground/70 px-2.5 py-1.5">
            <ArrowDoodle className="size-4 shrink-0" />
            <span className="flex-1 truncate">Maths · Integration</span>
            <span className="text-sm">moved to 7 pm</span>
          </li>
          <li className="flex items-center gap-2 rounded-[3px_7px_4px_6px] border border-border/80 bg-card/60 px-2.5 py-1.5">
            <NoteDoodle className="size-4 shrink-0" />
            <span className="flex-1 truncate">Revision · Chemical bonding</span>
            <span className="text-sm text-muted-foreground">25 min</span>
          </li>
        </ul>

        <p className="mt-4 -rotate-1 font-display text-xl">
          Plan updated. <span className="mark mark-draw [animation-delay:160ms]">Nothing dropped.</span>
        </p>
      </div>
    </div>
  )
}

const week = [
  { day: 'Mon', date: 9, slots: [{ text: 'Physics', tone: 'done' }, { text: 'Maths', tone: 'scheduled' }] },
  { day: 'Tue', date: 10, slots: [{ text: 'Chemistry', tone: 'missed' }] },
  { day: 'Wed', date: 11, slots: [{ text: 'Chemistry · moved', tone: 'moved' }, { text: 'Maths', tone: 'scheduled' }] },
  { day: 'Thu', date: 12, slots: [{ text: 'Physics', tone: 'scheduled' }] },
  { day: 'Fri', date: 13, slots: [{ text: 'Revision', tone: 'done' }, { text: 'Maths', tone: 'scheduled' }] },
  { day: 'Sat', date: 14, slots: [{ text: 'Quiz day', tone: 'scheduled' }] },
  { day: 'Sun', date: 15, slots: [] },
]

function WeekSlot({ text, tone }: { text: string; tone: string }) {
  return (
    <div
      className={cn(
        'rounded-[3px_6px_4px_5px] border px-1.5 py-1 text-sm leading-5',
        tone === 'done' && 'border-border bg-card/70',
        tone === 'scheduled' && 'border-border',
        tone === 'missed' && 'slot-missed border-[var(--margin-line)]',
        tone === 'moved' && 'slot-moved border-2 border-foreground/70',
      )}
    >
      <span className={cn(tone === 'missed' && 'slot-title')}>{text}</span>
    </div>
  )
}

function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 text-base text-muted-foreground">
      <span className="flex size-7 -rotate-3 items-center justify-center rounded-[4px_8px_5px_7px] border-2 border-foreground bg-card font-display text-sm text-foreground">
        {index}
      </span>
      {children}
    </p>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startGuest = useAppStore((state) => state.startGuest)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleGuest = async () => {
    setGuestLoading(true)
    await startGuest()
    navigate('/dashboard')
  }

  const featureItems = [
    { icon: CalendarDays, title: t('landing.features.plannerTitle'), desc: t('landing.features.plannerDesc') },
    { icon: ClipboardCheck, title: t('landing.features.quizTitle'), desc: t('landing.features.quizDesc') },
    { icon: BookOpenCheck, title: t('landing.features.revisionTitle'), desc: t('landing.features.revisionDesc') },
    { icon: Upload, title: t('landing.features.uploadTitle'), desc: t('landing.features.uploadDesc') },
    { icon: LineChart, title: t('landing.features.analyticsTitle'), desc: t('landing.features.analyticsDesc') },
    { icon: Target, title: t('landing.features.examModeTitle'), desc: t('landing.features.examDesc') },
  ]

  const steps = [
    { title: t('landing.steps.oneTitle'), desc: t('landing.steps.oneDesc') },
    { title: t('landing.steps.twoTitle'), desc: t('landing.steps.twoDesc') },
    { title: t('landing.steps.threeTitle'), desc: t('landing.steps.threeDesc') },
  ]

  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      <PublicHeader />

      <main>
        <section className="ruled-page mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="pl-6 sm:pl-10">
            <p className="inline-flex items-center gap-2 text-base text-muted-foreground">
              <PencilDoodle className="size-4" /> {t('landing.badge')}
            </p>
            <h1 className="mt-3 text-balance font-display text-5xl leading-[1.12] sm:text-6xl">
              {t('landing.heroTitle')}
              <br />
              <span className="mark mark-draw">{t('landing.heroAccent')}</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-8 text-muted-foreground">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="group">
                <Link to="/auth?mode=signup">
                  {t('landing.getStarted')}
                  <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="group" onClick={handleGuest} loading={guestLoading}>
                {!guestLoading && <StarDoodle className="size-4 transition-transform duration-200 group-hover:rotate-12" />}
                {t('landing.tryGuest')}
              </Button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-base text-muted-foreground">
              <ShieldCheck className="mt-1 size-4 shrink-0" />
              <span className="max-w-[55ch]">{t('landing.guestHint')}</span>
            </p>
            <p className="mt-6 inline-flex -rotate-1 items-center gap-2 border-b-2 border-[var(--margin-line)] pb-0.5 text-base font-semibold">
              <StarDoodle className="size-4" /> {t('landing.trusted')}
            </p>
          </div>
          <TodayCard />
        </section>

        <section id="features" className="scroll-mt-20 border-t-2 border-foreground/25 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[56ch]">
                <SectionLabel index="01">
                  <NoteDoodle className="size-5" /> {t('landing.featuresEyebrow')}
                </SectionLabel>
                <h2 className="mt-2 text-balance font-display text-4xl leading-tight">{t('landing.featuresTitle')}</h2>
                <p className="mt-3 text-lg leading-8 text-muted-foreground">{t('landing.featuresSubtitle')}</p>
              </div>
              <p className="inline-flex -rotate-1 items-center gap-2 self-start border-2 border-dashed border-foreground/50 bg-accent/20 px-3 py-1.5 font-display text-base md:self-end">
                <PencilDoodle className="size-4" /> {t('landing.featuresStamp')}
              </p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featureItems.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li
                    key={feature.title}
                    className="group paper-card p-5 pb-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 -rotate-2 items-center justify-center rounded-[4px_10px_5px_8px] border-2 border-foreground transition-transform duration-200 group-hover:rotate-3 group-hover:scale-105">
                        <Icon className="size-5" strokeWidth={1.9} />
                      </span>
                      <span aria-hidden className="flex-1 border-t-2 border-dotted border-border" />
                      <span className="font-display text-sm text-muted-foreground">p. {String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-4 font-display text-xl leading-7">{feature.title}</h3>
                    <p className="mt-1 text-base leading-7 text-muted-foreground">{feature.desc}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="relative overflow-hidden border-t-2 border-foreground/25 py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:18px_18px] opacity-60" />
          <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionLabel index="02">
              <GraduationCap className="size-5" /> {t('landing.audienceEyebrow')}
            </SectionLabel>
            <h2 className="mt-2 font-display text-4xl">{t('landing.audienceTitle')}</h2>
            <p className="mt-2 max-w-[60ch] text-lg leading-8 text-muted-foreground">
              {t('landing.audienceSubtitle')}
            </p>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: GraduationCap,
                  tag: t('landing.audience.schoolTag'),
                  title: t('landing.audience.schoolTitle'),
                  desc: t('landing.audience.schoolDesc'),
                  tone: 'bg-accent/60',
                },
                {
                  icon: Target,
                  tag: t('landing.audience.entranceTag'),
                  title: t('landing.audience.entranceTitle'),
                  desc: t('landing.audience.entranceDesc'),
                  tone: 'bg-[hsl(var(--margin-line-hsl)/0.16)]',
                },
                {
                  icon: BookOpenCheck,
                  tag: t('landing.audience.universityTag'),
                  title: t('landing.audience.universityTitle'),
                  desc: t('landing.audience.universityDesc'),
                  tone: 'bg-secondary/70',
                },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.title}
                    className="group relative overflow-hidden paper-card p-0 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]"
                  >
                    <div
                      className={cn(
                        'flex items-center justify-between border-b-2 border-foreground/70 px-5 py-2 text-sm font-semibold',
                        item.tone,
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="size-4" strokeWidth={2} /> {item.tag}
                      </span>
                      <span className="font-display text-base leading-none text-foreground/60">
                        0{index + 1}
                      </span>
                    </div>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-4 right-2 select-none font-display text-7xl leading-none text-foreground/[0.06]"
                    >
                      0{index + 1}
                    </span>
                    <div className="relative p-5">
                      <h3 className="font-display text-xl leading-7">{item.title}</h3>
                      <p className="mt-1 max-w-[38ch] text-base leading-7 text-muted-foreground">{item.desc}</p>
                      <span aria-hidden className="mt-4 block h-1 w-14 rounded-full bg-[hsl(var(--margin-line-hsl)/0.35)] transition-all duration-200 group-hover:w-24" />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t-2 border-foreground/25 bg-card/40 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionLabel index="03">
              <PencilDoodle className="size-5" /> {t('landing.nav.how')}
            </SectionLabel>
            <h2 className="mt-2 font-display text-4xl">{t('landing.howTitle')}</h2>
            <p className="mt-2 max-w-[60ch] text-lg leading-8 text-muted-foreground">{t('landing.howSubtitle')}</p>
            <ol className="relative mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="group relative">
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-14 right-[-2rem] top-7 hidden border-t-2 border-dashed border-foreground/25 md:block"
                    />
                  )}
                  <div className="relative z-10 flex size-14 -rotate-2 items-center justify-center rounded-[6px_14px_8px_12px] border-2 border-foreground bg-card font-display text-2xl shadow-[2px_2px_0_hsl(var(--foreground)/0.25)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:rotate-3">
                    0{index + 1}
                  </div>
                  <div className="paper-card mt-4 p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]">
                    <h3 className="font-display text-2xl leading-8">{step.title}</h3>
                    <p className="mt-1 max-w-[45ch] text-base leading-7 text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="exam" className="scroll-mt-20 border-t-2 border-foreground/25 py-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div className="max-w-[58ch]">
              <SectionLabel index="04">
                <CalendarDoodle className="size-5" /> {t('landing.nav.exam')}
              </SectionLabel>
              <h2 className="mt-2 text-balance font-display text-4xl leading-tight">{t('landing.examTitle')}</h2>
              <p className="mt-3 text-lg leading-8 text-muted-foreground">{t('landing.examSubtitle')}</p>
              <ul className="mt-5 space-y-2">
                {[t('exam.rule1'), t('exam.rule4'), t('exam.rule2'), t('exam.rule3')].map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-base leading-7">
                    <TickDoodle className="mt-1 size-4 shrink-0" />
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
              <Button className="group mt-6" asChild>
                <Link to="/auth?mode=signup">
                  {t('landing.getStarted')} <ArrowDoodle className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>

            <div className="paper-card tape p-5 pt-8 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]">
              <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-border pb-3">
                <div>
                  <p className="text-base text-muted-foreground">Next paper</p>
                  <p className="font-display text-2xl leading-8">Physics · Paper 1</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl leading-none">12</p>
                  <p className="text-sm text-muted-foreground">days left</p>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-base">
                {[
                  { label: 'Laws of Motion', tag: 'Revision' },
                  { label: 'Electrostatics', tag: 'Weak · priority' },
                  { label: 'Current Electricity', tag: 'Practice quiz' },
                  { label: 'Optics', tag: 'Revision due' },
                ].map((item, index) => (
                  <li
                    key={item.label}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-[3px_7px_4px_6px] border px-3 py-1.5',
                      index === 1 ? 'border-[var(--margin-line)] bg-[hsl(var(--margin-line-hsl)/0.12)]' : 'border-border',
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <i className="size-2 rounded-full bg-foreground" />
                      {item.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{item.tag}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 -rotate-1 font-display text-xl">
                The day before belongs to <span className="mark mark-draw">Physics</span>.
              </p>
            </div>
          </div>
        </section>

        <section id="week" className="scroll-mt-20 border-t-2 border-foreground/25 bg-card/40 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionLabel index="05">
              <CalendarDays className="size-5" /> {t('landing.nav.week')}
            </SectionLabel>
            <h2 className="mt-2 font-display text-4xl">{t('landing.mockupTitle')}</h2>
            <p className="mt-2 max-w-[60ch] text-lg leading-8 text-muted-foreground">{t('landing.mockupSubtitle')}</p>

            <div className="paper-card relative mt-10 p-4 pt-6 sm:pt-10">
              <div aria-hidden className="absolute inset-x-8 -top-2.5 z-10 hidden justify-between sm:flex">
                {Array.from({ length: 16 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-5 w-2 -rotate-6 rounded-full border-2 border-foreground bg-[var(--paper)] shadow-[1px_1px_0_hsl(var(--foreground)/0.18)]"
                  />
                ))}
              </div>
              <span aria-hidden className="absolute bottom-8 left-3 top-12 hidden w-px bg-[hsl(var(--margin-line-hsl)/0.45)] sm:block" />
              <div className="hidden sm:block">
                <div className="grid grid-cols-7 gap-1.5 border-b-2 border-foreground/40 pb-2 md:gap-2">
                  {week.map((day) => (
                    <div key={day.day} className="min-w-0 text-sm font-semibold md:text-base">
                      {day.day} <span className="font-normal text-muted-foreground">{day.date}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1.5 md:gap-2">
                  {week.map((day) => (
                    <div key={day.day} className="min-h-[132px] min-w-0 space-y-1.5">
                      {day.slots.length === 0 && (
                        <p className="mt-8 text-center text-sm text-muted-foreground">rest</p>
                      )}
                      {day.slots.map((slot) => (
                        <WeekSlot key={slot.text} text={slot.text} tone={slot.tone} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <ul className="space-y-2 sm:hidden">
                {week.map((day) => (
                  <li key={day.day} className="rounded-[4px_10px_6px_8px] border-2 border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">
                        {day.day} <span className="font-normal text-muted-foreground">{day.date}</span>
                      </p>
                      {day.slots.length === 0 && <span className="text-sm text-muted-foreground">rest</span>}
                    </div>
                    {day.slots.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {day.slots.map((slot) => (
                          <WeekSlot key={slot.text} text={slot.text} tone={slot.tone} />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-border pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-warning" /> moved</span>
                <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-[var(--margin-line)]" /> missed</span>
                <span className="flex items-center gap-1"><Check className="size-3" /> done</span>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-2 border-foreground/25 py-12">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="paper-card tape flex flex-col gap-5 p-5 pt-9 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)] sm:p-6 sm:pt-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="relative flex size-12 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-foreground/70 bg-accent/30">
                  <ShieldCheck className="size-5" strokeWidth={1.9} />
                  <span aria-hidden className="absolute -inset-1 rounded-full border border-foreground/20" />
                </span>
                <div>
                  <h2 className="font-display text-2xl leading-8">{t('landing.trustTitle')}</h2>
                  <p className="mt-1 max-w-[58ch] text-base leading-7 text-muted-foreground">{t('landing.trustDesc')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:max-w-xs lg:justify-end">
                {[t('landing.trustPoint1'), t('landing.trustPoint2'), t('landing.trustPoint3')].map((point) => (
                  <span
                    key={point}
                    className="rounded-[3px_8px_4px_7px] border-2 border-foreground/60 bg-accent/40 px-2.5 py-0.5 text-sm font-semibold"
                  >
                    {point}
                  </span>
                ))}
                <Button variant="outline" size="sm" asChild className="group">
                  <Link to="/privacy">
                    {t('landing.trustCta')}
                    <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <div className="paper-card tape relative -rotate-1 p-8 pt-12 text-center transition-[transform,box-shadow] duration-200 hover:rotate-0 hover:shadow-[5px_5px_0_hsl(var(--foreground)/0.28)]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-3 rounded-[4px_12px_6px_10px] border border-dashed border-foreground/20"
            />
            <StarDoodle className="absolute left-6 top-7 size-6 -rotate-12 text-[var(--margin-line)]" />
            <PencilDoodle className="absolute bottom-6 right-6 hidden size-6 rotate-12 text-muted-foreground sm:block" />
            <h2 className="relative text-balance font-display text-4xl leading-tight">
              Start with <span className="mark mark-draw">today</span>. The rest can move.
            </h2>
            <p className="relative mx-auto mt-3 max-w-[52ch] text-lg leading-8 text-muted-foreground">
              Bring your syllabus and exam date. We will write the first plan with you.
            </p>
            <div className="relative mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup">{t('landing.getStarted')}</Link>
              </Button>
              <Button size="lg" variant="outline" onClick={handleGuest} loading={guestLoading}>
                {t('landing.tryGuest')}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
