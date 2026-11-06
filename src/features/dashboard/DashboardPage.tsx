import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flame,
  LineChart,
  PlayCircle,
  Plus,
  Sparkles,
  Target,
  Trophy,
  Upload,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/misc'
import { EmptyState } from '@/components/ui/misc'
import { StatusBadge } from '@/components/shared/status-badge'
import { useAppStore } from '@/store/useAppStore'
import {
  computeStreak,
  examDaysLeft,
  slotsForDate,
  studyMinutes,
} from '@/services/plannerService'
import {
  addMinutesToTime,
  cn,
  formatDuration,
  greetingKey,
  longDate,
  percent,
  shortWeekday,
  todayISO,
} from '@/lib/utils'
import { addDays, format, subDays } from 'date-fns'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const profile = useAppStore((state) => state.profile)
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const slots = useAppStore((state) => state.slots)
  const settings = useAppStore((state) => state.settings)
  const attempts = useAppStore((state) => state.attempts)
  const examMode = useAppStore((state) => state.examMode)
  const lastInsight = useAppStore((state) => state.lastInsight)
  const regeneratePlan = useAppStore((state) => state.regeneratePlan)

  const today = todayISO()
  const todaySlots = slotsForDate(slots, today)
  const doneToday = todaySlots.filter((slot) => slot.status === 'done')
  const nextSlot = todaySlots.find((slot) => ['scheduled', 'running'].includes(slot.status))
  const streak = computeStreak(slots)
  const plannedMinutes = todaySlots.reduce((sum, slot) => sum + slot.duration, 0)
  const doneMinutes = studyMinutes(todaySlots)
  const coveredCount = topics.filter((topic) => topic.status === 'covered').length
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  const upcomingExam = examMode.active
    ? [...examMode.exams]
        .filter((exam) => examDaysLeft(exam.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date))[0]
    : undefined
  const upcomingSubject = upcomingExam ? subjectById.get(upcomingExam.subjectId) : undefined

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index)
    const iso = format(date, 'yyyy-MM-dd')
    const minutes = studyMinutes(slots.filter((slot) => slot.date === iso))
    return { iso, label: shortWeekday(iso, settings.language), minutes, isToday: iso === today }
  })
  const maxWeek = Math.max(settings.studyHours * 60, ...week.map((day) => day.minutes), 60)
  const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0)
  const recentAttempts = [...attempts]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 5)
  const avgScore = recentAttempts.length
    ? Math.round(recentAttempts.reduce((sum, attempt) => sum + attempt.scorePercent, 0) / recentAttempts.length)
    : 0

  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const coveredPercent = percent(coveredCount, Math.max(1, topics.length))

  if (!subjects.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={t('common.today')}
          title={`${t(greetingKey())}, ${firstName}`}
          subtitle={longDate(new Date(), settings.language)}
        />
        <Card>
          <EmptyState
            icon={BookOpen}
            title={t('dashboard.emptyTitle')}
            description={t('dashboard.emptyDesc')}
            action={
              <Button asChild>
                <Link to="/subjects">
                  <Plus className="size-4" /> {t('dashboard.addSubject')}
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={longDate(new Date(), settings.language)}
        title={`${t(greetingKey())}, ${firstName}`}
        subtitle={t('dashboard.subtitle', { name: firstName })}
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-bold text-amber-700 dark:text-accent">
              <Flame className="size-4 fill-accent text-accent" />
              {streak.current} <span className="text-xs font-medium">{t('streak.label')}</span>
            </span>
            <Button variant="outline" size="sm" onClick={regeneratePlan}>
              <Sparkles className="size-4" /> {t('common.regenerate')}
            </Button>
          </div>
        }
      />

      {upcomingExam && (
        <Link
          to="/exam"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent p-4 transition-colors hover:border-violet-500/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t('dashboard.examBannerTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.examBannerDesc', {
                  count: Math.max(0, examDaysLeft(upcomingExam.date)),
                  subject: upcomingSubject?.name ?? 'your exam',
                })}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-violet-500 px-3.5 py-2 text-xs font-bold text-white transition-transform group-hover:translate-x-0.5 sm:self-auto">
            {t('dashboard.examBannerCta')} <ArrowRight className="size-3.5" />
          </span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.todayTasks')}</p>
                <p className="mt-2 font-display text-3xl font-extrabold">
                  {doneToday.length}<span className="text-lg text-muted-foreground">/{todaySlots.length}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.completed')}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <ClipboardCheck className="size-5" />
              </span>
            </div>
            <Progress value={percent(doneToday.length, Math.max(1, todaySlots.length))} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.studyTime')}</p>
                <p className="mt-2 font-display text-3xl font-extrabold">{formatDuration(doneMinutes)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('dashboard.studyGoal', { hours: settings.studyHours })} · {formatDuration(plannedMinutes)}
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-info/10 text-info">
                <Clock className="size-5" />
              </span>
            </div>
            <Progress
              value={percent(doneMinutes, Math.max(1, settings.studyHours * 60))}
              className="mt-3"
              indicatorClassName="bg-info"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.streakLabel')}</p>
                <p className="mt-2 font-display text-3xl font-extrabold">{streak.current}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('streak.best')}: {streak.best} · {t('streak.fire')}
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-amber-600 dark:text-accent">
                <Flame className="size-5" />
              </span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 7 }, (_, index) => {
                const iso = subDays(new Date(), 6 - index).toISOString().slice(0, 10)
                const active = slots.some((slot) => slot.date === iso && slot.status === 'done')
                return (
                  <span
                    key={iso}
                    className={cn(
                      'h-1.5 flex-1 rounded-full',
                      active ? 'bg-accent' : 'bg-muted',
                    )}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('dashboard.coveredTopics')}</p>
                <p className="mt-2 font-display text-3xl font-extrabold">{coveredCount}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {coveredPercent}% of {topics.length} topics · {t('dashboard.weeklyQuiz')} {avgScore}%
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
                <Target className="size-5" />
              </span>
            </div>
            <Progress value={coveredPercent} className="mt-3" indicatorClassName="bg-success" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">{t('dashboard.todayTasks')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.todaySubtitle')}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                {t('dashboard.viewAll')} <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {todaySlots.length === 0 && (
              <EmptyState
                icon={CalendarClock}
                title={t('dashboard.noTasksTitle')}
                description={t('dashboard.noTasksDesc')}
                action={
                  <Button size="sm" onClick={regeneratePlan}>
                    <Sparkles className="size-4" /> {t('dashboard.regenerate')}
                  </Button>
                }
                className="py-8"
              />
            )}
            {todaySlots.slice(0, 4).map((slot) => {
              const subject = subjectById.get(slot.subjectId)
              const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id))
              return (
                <div
                  key={slot.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ backgroundColor: subject?.color ?? '#6366f1' }}
                    >
                      {subject?.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{subject?.name ?? 'Study'}</p>
                        <StatusBadge status={slot.status} source={slot.source} />
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {slot.start}–{addMinutesToTime(slot.start, slot.duration)} · {slot.duration} {t('common.minutes')}
                        {slotTopics.length ? ` · ${slotTopics.map((topic) => topic.name).join(', ')}` : ''}
                      </p>
                    </div>
                  </div>
                  {['scheduled', 'running'].includes(slot.status) && (
                    <Button asChild size="sm" variant={slot.status === 'running' ? 'default' : 'outline'}>
                      <Link to="/tasks">
                        <PlayCircle className="size-4" /> {slot.status === 'running' ? t('common.resume') : t('common.start')}
                      </Link>
                    </Button>
                  )}
                </div>
              )
            })}
            {todaySlots.length > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 text-xs">
                <span className="font-medium text-muted-foreground">
                  {nextSlot
                    ? `${t('dashboard.upNext')}: ${subjectById.get(nextSlot.subjectId)?.name} · ${nextSlot.start}`
                    : doneToday.length === todaySlots.length
                      ? t('tasks.allDoneTitle')
                      : t('dashboard.noTasksTitle')}
                </span>
                <span className="font-semibold">
                  {t('tasks.progress', { done: doneToday.length, total: todaySlots.length })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('dashboard.weeklyOverview')}</CardTitle>
                <Badge variant="secondary">{formatDuration(weekMinutes)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.weeklySubtitle')}</p>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-2">
                {week.map((day) => (
                  <div key={day.iso} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {day.minutes ? Math.round(day.minutes / 60 * 10) / 10 + 'h' : ''}
                    </span>
                    <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-muted/50">
                      <div
                        className={cn(
                          'w-full rounded-md bg-gradient-to-t transition-all',
                          day.isToday
                            ? 'from-indigo-600 to-fuchsia-400'
                            : 'from-indigo-500/40 to-indigo-400/25',
                        )}
                        style={{ height: `${Math.max(4, (day.minutes / maxWeek) * 100)}%` }}
                      />
                    </div>
                    <span className={cn('text-[10px]', day.isToday ? 'font-bold text-primary' : 'text-muted-foreground')}>
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('dashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { to: '/tasks', icon: PlayCircle, label: t('dashboard.startFocus'), tone: 'text-primary bg-primary-soft' },
                { to: '/quizzes', icon: ClipboardCheck, label: t('dashboard.takeQuiz'), tone: 'text-info bg-info/10' },
                { to: '/subjects', icon: Upload, label: t('dashboard.addUpload'), tone: 'text-success bg-success/10' },
                { to: '/progress', icon: LineChart, label: t('dashboard.reviewSheet'), tone: 'text-violet-500 bg-violet-500/10' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:border-primary/30 hover:bg-primary-soft/40"
                >
                  <span className={cn('flex size-9 items-center justify-center rounded-lg', action.tone)}>
                    <action.icon className="size-4" />
                  </span>
                  <span className="text-xs font-semibold leading-tight">{action.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Sparkles className="size-4" />
              </span>
              <CardTitle className="text-base">{t('dashboard.planInsight')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {lastInsight || t('dashboard.todaySubtitle')}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {subjects.slice(0, 5).map((subject) => (
                <Link key={subject.id} to={`/subjects/${subject.id}`}>
                  <Badge variant="outline" className="hover:border-primary/40 hover:text-primary">
                    {subject.name} · {subject.selfRating}/5
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">{t('dashboard.weeklyQuiz')}</CardTitle>
              <p className="text-xs text-muted-foreground">{recentAttempts.length ? `${recentAttempts.length} recent attempts` : t('progress.noAttempts')}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/quizzes">
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAttempts.length === 0 ? (
              <p className="rounded-xl bg-muted/50 px-3 py-4 text-center text-xs text-muted-foreground">
                {t('progress.noAttemptsDesc')}
              </p>
            ) : (
              <div className="space-y-2">
                {recentAttempts.slice(0, 3).map((attempt) => (
                  <Link
                    key={attempt.id}
                    to={`/quizzes?attempt=${attempt.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2.5 transition-colors hover:border-primary/30"
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                        attempt.scorePercent >= 70
                          ? 'bg-success/10 text-success'
                          : attempt.scorePercent >= 40
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {attempt.scorePercent}%
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{attempt.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(attempt.submittedAt), 'd MMM, HH:mm')} · {attempt.correctCount}/{attempt.total} {t('quizzes.correct')}
                      </p>
                    </div>
                    <CheckCircle2 className="size-4 shrink-0 text-muted-foreground/40" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        {t('dashboard.weeklyOverview')} · {format(addDays(new Date(), 0), 'd MMM yyyy')} · {i18n.language.toUpperCase()}
      </p>
    </div>
  )
}
