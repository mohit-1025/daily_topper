import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  Flame,
  GraduationCap,
  LineChart,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Upload,
  X,
} from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/misc'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

function StudyDayPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-amber-400/20 blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative overflow-hidden rounded-3xl border border-white/30 bg-card/90 shadow-lift backdrop-blur-xl dark:border-white/10"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <GraduationCap className="size-4" />
            </span>
            <div>
              <p className="text-xs font-semibold">Good evening, Riya 👋</p>
              <p className="text-[10px] text-muted-foreground">Saturday, 7 November</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-accent">
            <Flame className="size-3.5 fill-accent" /> 6 days
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Today’s plan</span>
            <span>3 of 4 done</span>
          </div>
          <Progress value={75} className="h-1.5" indicatorClassName="bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
          {[
            { subject: 'Physics', topic: 'Laws of Motion · Work Energy', time: '5:30 PM', status: 'Done', tone: 'border-l-emerald-500', chip: 'bg-emerald-500/10 text-emerald-600' },
            { subject: 'Chemistry', topic: 'Chemical Bonding · Equilibrium', time: '6:30 PM', status: 'Now', tone: 'border-l-indigo-500', chip: 'bg-indigo-500/10 text-indigo-500' },
            { subject: 'Mathematics', topic: 'Integration · Vectors', time: '7:30 PM', status: 'Scheduled', tone: 'border-l-sky-500', chip: 'bg-sky-500/10 text-sky-600' },
          ].map((slot) => (
            <div
              key={slot.subject}
              className={cn('flex items-center gap-3 rounded-xl border border-border/70 border-l-[3px] bg-background/70 p-2.5', slot.tone)}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold">
                {slot.subject.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold">{slot.subject}</p>
                <p className="truncate text-[10px] text-muted-foreground">{slot.topic}</p>
              </div>
              <div className="text-right">
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', slot.chip)}>{slot.status}</span>
                <p className="mt-0.5 text-[9px] text-muted-foreground">{slot.time}</p>
              </div>
            </div>
          ))}
          <div className="flex items-end justify-between gap-2 rounded-xl border border-border/70 bg-background/50 p-3">
            {[38, 64, 48, 82, 56, 72, 45].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'w-full rounded-t-md bg-gradient-to-t',
                    index === 3 ? 'from-indigo-500 to-fuchsia-400' : 'from-indigo-500/30 to-indigo-400/20',
                  )}
                  style={{ height: `${height * 0.55}px` }}
                />
                <span className="text-[8px] text-muted-foreground">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-4 top-28 hidden items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lift backdrop-blur sm:flex"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <Check className="size-4" />
        </span>
        <div>
          <p className="text-[9px] text-muted-foreground">Quiz score</p>
          <p className="text-xs font-bold">92%</p>
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute -right-3 bottom-16 hidden items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-lift backdrop-blur sm:flex"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
          <Sparkles className="size-4" />
        </span>
        <div>
          <p className="text-[9px] text-muted-foreground">Weak topic</p>
          <p className="text-xs font-bold">Re-queued</p>
        </div>
      </motion.div>
    </div>
  )
}

function WeekPlanPreview() {
  const days = [
    { day: 'Mon', dots: ['bg-sky-500', 'bg-emerald-500'], count: 3 },
    { day: 'Tue', dots: ['bg-emerald-500', 'bg-emerald-500', 'bg-amber-500'], count: 3 },
    { day: 'Wed', dots: ['bg-sky-500', 'bg-violet-500'], count: 2 },
    { day: 'Thu', dots: ['bg-emerald-500', 'bg-sky-500', 'bg-emerald-500'], count: 3 },
    { day: 'Fri', dots: ['bg-sky-500', 'bg-violet-500', 'bg-sky-500'], count: 3 },
    { day: 'Sat', dots: ['bg-emerald-500', 'bg-sky-500'], count: 2 },
    { day: 'Sun', dots: [], count: 0 },
  ]
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="size-4 text-primary" />
          November 2026
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-sky-500" /> Scheduled</span>
          <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-emerald-500" /> Done</span>
          <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-violet-500" /> Revision</span>
        </div>
      </div>
      <div className="grid grid-cols-7 divide-x divide-border">
        {days.map((day, index) => (
          <div key={day.day} className={cn('min-h-[132px] p-2 sm:p-3', index === 5 && 'bg-primary/[0.035]')}>
            <p className={cn('text-[10px] font-semibold', index === 5 ? 'text-primary' : 'text-muted-foreground')}>{day.day}</p>
            <p className="mt-0.5 text-xs font-bold">{7 + index}</p>
            <div className="mt-2 space-y-1">
              {day.dots.map((dot, dotIndex) => (
                <div key={dotIndex} className="flex items-center gap-1 rounded bg-background/80 p-1">
                  <i className={cn('size-1.5 shrink-0 rounded-full', dot)} />
                  <span className="hidden truncate text-[8px] text-muted-foreground sm:block">
                    {dotIndex === 0 ? '45 min' : 'Revision'}
                  </span>
                </div>
              ))}
              {day.count === 0 && <p className="mt-5 text-center text-[9px] text-muted-foreground/60">Rest</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useAppStore((state) => state.session)
  const startGuest = useAppStore((state) => state.startGuest)
  const [guestLoading, setGuestLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleGuest = async () => {
    setGuestLoading(true)
    await startGuest()
    navigate('/dashboard')
  }

  const featureItems = [
    { icon: Sparkles, title: t('landing.features.plannerTitle'), desc: t('landing.features.plannerDesc'), tone: 'from-indigo-500/15 to-violet-500/5 text-indigo-500' },
    { icon: ClipboardCheck, title: t('landing.features.quizTitle'), desc: t('landing.features.quizDesc'), tone: 'from-emerald-500/15 to-teal-500/5 text-emerald-600' },
    { icon: BookOpenCheck, title: t('landing.features.revisionTitle'), desc: t('landing.features.revisionDesc'), tone: 'from-amber-500/15 to-orange-500/5 text-amber-600' },
    { icon: Upload, title: t('landing.features.uploadTitle'), desc: t('landing.features.uploadDesc'), tone: 'from-sky-500/15 to-blue-500/5 text-sky-600' },
    { icon: LineChart, title: t('landing.features.analyticsTitle'), desc: t('landing.features.analyticsDesc'), tone: 'from-fuchsia-500/15 to-pink-500/5 text-fuchsia-500' },
    { icon: Target, title: t('landing.features.examModeTitle'), desc: t('landing.features.examDesc'), tone: 'from-violet-500/15 to-purple-500/5 text-violet-500' },
  ]

  const steps = [
    { icon: GraduationCap, title: t('landing.steps.oneTitle'), desc: t('landing.steps.oneDesc') },
    { icon: CalendarDays, title: t('landing.steps.twoTitle'), desc: t('landing.steps.twoDesc') },
    { icon: Sparkles, title: t('landing.steps.threeTitle'), desc: t('landing.steps.threeDesc') },
  ]

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Landing navigation">
            <a href="#features" className="transition-colors hover:text-foreground">{t('landing.featuresTitle')}</a>
            <a href="#how" className="transition-colors hover:text-foreground">{t('landing.howTitle')}</a>
            <a href="#exam" className="transition-colors hover:text-foreground">{t('nav.exam')}</a>
            <a href="#preview" className="transition-colors hover:text-foreground">{t('landing.mockupTitle')}</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="hidden sm:inline-flex" />
            {session ? (
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                {t('nav.dashboard')}
                <ArrowRight />
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
              className="flex size-10 items-center justify-center rounded-xl border border-border md:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1 text-sm font-medium">
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-muted">{t('landing.featuresTitle')}</a>
              <a href="#how" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-muted">{t('landing.howTitle')}</a>
              <a href="#exam" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-muted">{t('nav.exam')}</a>
              <a href="#preview" onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 hover:bg-muted">{t('landing.mockupTitle')}</a>
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-3">
                <ThemeToggle />
                {!session && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/auth">{t('common.login')}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="mesh-bg relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="outline" className="mb-5 gap-1.5 border-primary/25 bg-primary/5 px-3 py-1 text-primary">
                <Sparkles className="size-3.5" />
                {t('landing.badge')}
              </Badge>
              <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                {t('landing.heroTitle')}
                <br />
                <span className="gradient-text">{t('landing.heroAccent')}</span>
              </h1>
              <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t('landing.heroSubtitle')}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="group">
                  <Link to="/auth?mode=signup">
                    {t('landing.getStarted')}
                    <ArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleGuest}
                  loading={guestLoading}
                  className="border-primary/25 bg-card/70 backdrop-blur"
                >
                  {!guestLoading && <Sparkles className="text-primary" />}
                  {t('landing.tryGuest')}
                </Button>
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" />
                {t('landing.guestHint')}
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['RS', 'AK', 'NP', 'MV'].map((initials, index) => (
                    <span
                      key={initials}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full border-2 border-background text-[9px] font-bold text-white',
                        ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-fuchsia-500'][index],
                      )}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="size-3 fill-current" />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{t('landing.trusted')}</p>
                </div>
              </div>
            </motion.div>
            <StudyDayPreview />
          </div>
        </section>

        <section className="border-y border-border bg-card/50">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 divide-x divide-border px-4 sm:px-6 lg:grid-cols-4">
            {[
              { value: '12,400+', label: t('landing.stats.students') },
              { value: '86,000+', label: t('landing.stats.quizzes') },
              { value: '2.1M', label: t('landing.stats.topics') },
              { value: '47,300h', label: t('landing.stats.hours') },
            ].map((stat, index) => (
              <div key={stat.label} className={cn('px-4 py-6 text-center', index >= 2 && 'border-t border-border lg:border-t-0')}>
                <p className="font-display text-2xl font-extrabold sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 gap-1.5 border-primary/20 text-primary">
              <Sparkles className="size-3.5" /> Features
            </Badge>
            <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.featuresTitle')}</h2>
            <p className="mt-3 text-muted-foreground">{t('landing.featuresSubtitle')}</p>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: index * 0.05 }}
                  className="surface surface-hover group p-5"
                >
                  <div className={cn('mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br', feature.tone)}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-display text-base font-bold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        <section id="how" className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-4 gap-1.5 border-primary/20 text-primary">
                <Clock className="size-3.5" /> 3 steps
              </Badge>
              <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.howTitle')}</h2>
              <p className="mt-3 text-muted-foreground">{t('landing.howSubtitle')}</p>
            </motion.div>
            <div className="relative mt-12 grid gap-5 md:grid-cols-3">
              <div className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-primary/20 md:block" />
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <motion.div key={step.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: index * 0.1 }} className="relative">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-card text-primary shadow-soft">
                        <Icon className="size-6" />
                        <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-5 font-display text-base font-bold">{step.title}</h3>
                      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        <section id="exam" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Badge variant="violet" className="mb-4 gap-1.5">
                <Target className="size-3.5" /> {t('nav.exam')}
              </Badge>
              <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.examTitle')}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{t('landing.examSubtitle')}</p>
              <ul className="mt-6 space-y-3">
                {[t('exam.rule1'), t('exam.rule4'), t('exam.rule2'), t('exam.rule3')].map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-7" asChild>
                <Link to="/auth?mode=signup">
                  {t('landing.getStarted')} <ArrowRight />
                </Link>
              </Button>
            </motion.div>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 blur-2xl" />
              <div className="overflow-hidden rounded-3xl border border-violet-500/20 bg-card shadow-lift">
                <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{t('exam.activeTitle')}</p>
                    <p className="font-display text-lg font-bold">Physics · Board Paper 1</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-extrabold">12</p>
                    <p className="text-[10px] text-white/70">{t('exam.countdown')}</p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  {[
                    { label: 'Laws of Motion', tag: 'Revision', tone: 'text-violet-500 bg-violet-500/10' },
                    { label: 'Electrostatics', tag: 'Weak · Priority', tone: 'text-rose-500 bg-rose-500/10' },
                    { label: 'Current Electricity', tag: 'Practice quiz', tone: 'text-emerald-600 bg-emerald-500/10' },
                    { label: 'Optics', tag: 'Revision due', tone: 'text-amber-600 bg-amber-500/10' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <i className="size-2 rounded-full bg-violet-500" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                      <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', item.tone)}>{item.tag}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center gap-2 rounded-xl bg-violet-500/5 px-3 py-2.5 text-[11px] text-violet-600 dark:text-violet-300">
                    <CalendarDays className="size-4 shrink-0" />
                    Day before the paper is reserved entirely for Physics.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="preview" className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <motion.div {...fadeUp} className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.mockupTitle')}</h2>
              <p className="mt-3 text-muted-foreground">{t('landing.mockupSubtitle')}</p>
            </motion.div>
            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
              <WeekPlanPreview />
            </motion.div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Clock, label: '4h study goal', desc: 'Built around your real hours' },
                { icon: Flame, label: '6-day streak', desc: 'One quiz is all it takes' },
                { icon: LineChart, label: 'Live analytics', desc: 'See what is actually working' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-12 text-center text-white shadow-glow sm:px-12">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_35%),radial-gradient(circle_at_80%_80%,white_0,transparent_35%)]" />
            <div className="relative">
              <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Your best study day starts today.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
                Try the full demo — pre-loaded student, live streak, quizzes and exam mode. No signup needed.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90" onClick={handleGuest} loading={guestLoading}>
                  {!guestLoading && <Sparkles />}
                  {t('landing.tryGuest')}
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                  <Link to="/auth?mode=signup">{t('landing.getStarted')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-muted-foreground">{t('landing.footerNote')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <Link to="/auth" className="hover:text-foreground">Log in</Link>
            <Link to="/auth?mode=signup" className="hover:text-foreground">Sign up</Link>
            <span className="flex items-center gap-1"><ShieldCheck className="size-3.5" /> Privacy-first</span>
          </div>
          <p className="text-[11px] text-muted-foreground">© 2026 Daily Topper · BharatCode Build League</p>
        </div>
      </footer>
    </div>
  )
}
