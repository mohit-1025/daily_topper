import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flame,
  LineChart,
  PlayCircle,
  Plus,
  Target,
  Trophy,
  Upload,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, Progress } from '@/components/ui/misc'
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowDoodle, CalendarDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import { useAppStore } from '@/store/useAppStore'
import { computeStreak, examDaysLeft, slotsForDate, studyMinutes } from '@/services/plannerService'
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
        <div className="border-y-2 border-dashed border-border py-10">
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
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: t('dashboard.todayTasks'),
      value: `${doneToday.length}/${todaySlots.length}`,
      foot: t('dashboard.completed'),
      icon: ClipboardCheck,
      progress: percent(doneToday.length, Math.max(1, todaySlots.length)),
    },
    {
      label: t('dashboard.studyTime'),
      value: formatDuration(doneMinutes),
      foot: t('dashboard.studyGoal', { hours: settings.studyHours }),
      icon: Clock,
      progress: percent(doneMinutes, Math.max(1, settings.studyHours * 60)),
    },
    {
      label: t('dashboard.streakLabel'),
      value: String(streak.current),
      foot: `${t('streak.best')}: ${streak.best}`,
      icon: Flame,
      progress: null,
    },
    {
      label: t('dashboard.coveredTopics'),
      value: String(coveredCount),
      foot: `${coveredPercent}% · ${t('dashboard.weeklyQuiz')} ${avgScore}%`,
      icon: Target,
      progress: coveredPercent,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={longDate(new Date(), settings.language)}
        title={`${t(greetingKey())}, ${firstName}`}
        subtitle={t('dashboard.subtitle', { name: firstName })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-[4px_9px_5px_8px] border-2 border-foreground bg-accent px-3 py-1.5 text-base font-bold">
              <Flame className="size-4" />
              {streak.current} <span className="text-sm font-medium">{t('streak.label')}</span>
            </span>
            <Button variant="outline" size="sm" onClick={regeneratePlan}>
              <PencilDoodle className="size-5" /> {t('common.regenerate')}
            </Button>
          </div>
        }
      />

      {upcomingExam && (
        <Link
          to="/exam"
          className="flex flex-col gap-3 border-l-4 border-[var(--margin-line)] bg-accent/45 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <Trophy className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">{t('dashboard.examBannerTitle')}</p>
              <p className="text-base text-muted-foreground">
                {t('dashboard.examBannerDesc', {
                  count: Math.max(0, examDaysLeft(upcomingExam.date)),
                  subject: upcomingSubject?.name ?? 'your exam',
                })}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start font-semibold underline decoration-2 underline-offset-4 sm:self-auto">
            {t('dashboard.examBannerCta')} <ArrowRight className="size-4" />
          </span>
        </Link>
      )}

      <section
        aria-label={t('dashboard.todayTasks')}
        className="grid grid-cols-2 border-y-2 border-dashed border-border sm:grid-cols-4 sm:divide-x-2 sm:divide-dashed sm:divide-border"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="px-1 py-4 sm:px-4">
              <p className="flex items-center gap-1.5 text-base text-muted-foreground">
                <Icon className="size-4" /> {stat.label}
              </p>
              <p className="mt-1 font-display text-4xl font-bold leading-none">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.foot}</p>
              {stat.progress !== null && <Progress value={stat.progress} className="mt-2" />}
              {stat.progress === null && (
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 7 }, (_, index) => {
                    const iso = subDays(new Date(), 6 - index).toISOString().slice(0, 10)
                    const active = slots.some((slot) => slot.date === iso && slot.status === 'done')
                    return (
                      <span
                        key={iso}
                        className={cn(
                          'size-2.5 rounded-[1px] border border-foreground',
                          active ? 'bg-accent' : 'bg-transparent',
                        )}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
            <div>
              <CardTitle>{t('dashboard.todayTasks')}</CardTitle>
              <p className="text-base text-muted-foreground">{t('dashboard.todaySubtitle')}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                {t('dashboard.viewAll')} <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {todaySlots.length === 0 && (
              <EmptyState
                icon={CalendarDoodle}
                title={t('dashboard.noTasksTitle')}
                description={t('dashboard.noTasksDesc')}
                action={
                  <Button size="sm" onClick={regeneratePlan}>
                    <PencilDoodle className="size-5" /> {t('dashboard.regenerate')}
                  </Button>
                }
                className="py-8"
              />
            )}
            {todaySlots.slice(0, 4).map((slot) => {
              const subject = subjectById.get(slot.subjectId)
              const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id))
              const missed = slot.status === 'missed'
              return (
                <div
                  key={slot.id}
                  className={cn(
                    'flex flex-col gap-2 border-b-2 border-dashed border-border py-3 last:border-b-0 sm:flex-row sm:items-center',
                    missed && 'slot-missed',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[3px_7px_4px_6px] border-2 border-foreground text-xs font-bold">
                      {subject?.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{subject?.name ?? 'Study'}</p>
                        <StatusBadge status={slot.status} source={slot.source} />
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
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
              <p className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-border pt-3 text-sm">
                <span className="text-muted-foreground">
                  {nextSlot
                    ? `${t('dashboard.upNext')}: ${subjectById.get(nextSlot.subjectId)?.name} · ${nextSlot.start}`
                    : doneToday.length === todaySlots.length
                      ? t('tasks.allDoneTitle')
                      : t('dashboard.noTasksTitle')}
                </span>
                <span className="font-semibold">
                  {t('tasks.progress', { done: doneToday.length, total: todaySlots.length })}
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{t('dashboard.weeklyOverview')}</CardTitle>
                <span className="font-display text-2xl font-bold">{formatDuration(weekMinutes)}</span>
              </div>
              <p className="text-base text-muted-foreground">{t('dashboard.weeklySubtitle')}</p>
            </CardHeader>
            <CardContent>
              <div className="flex h-32 items-end gap-2 border-b-2 border-foreground pb-1">
                {week.map((day) => (
                  <div key={day.iso} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">
                      {day.minutes ? `${Math.round((day.minutes / 60) * 10) / 10}h` : ''}
                    </span>
                    <div className="flex h-20 w-full items-end">
                      <div
                        className={cn(
                          'w-full border-2 border-foreground',
                          day.isToday ? 'bg-accent' : 'bg-[hsl(var(--rule-hsl)/0.85)]',
                        )}
                        style={{ height: `${Math.max(4, (day.minutes / maxWeek) * 100)}%` }}
                      />
                    </div>
                    <span className={cn('text-sm', day.isToday ? 'font-bold' : 'text-muted-foreground')}>
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <section className="border-t-2 border-border pt-4">
            <h3 className="font-display text-xl font-bold">{t('dashboard.quickActions')}</h3>
            <div className="mt-2 grid grid-cols-2 gap-x-4">
              {[
                { to: '/tasks', icon: PlayCircle, label: t('dashboard.startFocus') },
                { to: '/quizzes', icon: ClipboardCheck, label: t('dashboard.takeQuiz') },
                { to: '/subjects', icon: Upload, label: t('dashboard.addUpload') },
                { to: '/progress', icon: LineChart, label: t('dashboard.reviewSheet') },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-2 border-b-2 border-dashed border-border py-3 font-semibold"
                >
                  <action.icon className="size-4 shrink-0" />
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 border-l-4 border-[var(--margin-line)] pl-4">
          <h3 className="flex items-center gap-2 font-display text-xl font-bold">
            <PencilDoodle className="size-5" /> {t('dashboard.planInsight')}
          </h3>
          <p className="mt-1 max-w-[62ch] leading-8 text-muted-foreground">{lastInsight || t('dashboard.planFallback')}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {subjects.slice(0, 5).map((subject) => (
              <Link key={subject.id} to={`/subjects/${subject.id}`}>
                <Badge variant="outline">
                  {subject.name} · {subject.selfRating}/5
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-bold">{t('dashboard.weeklyQuiz')}</h3>
              <p className="text-sm text-muted-foreground">
                {recentAttempts.length ? `${recentAttempts.length} recent attempts` : t('progress.noAttempts')}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/quizzes">
                <ArrowDoodle className="size-5" />
              </Link>
            </Button>
          </div>
          {recentAttempts.length === 0 ? (
            <p className="mt-3 border-y-2 border-dashed border-border py-6 text-center text-base text-muted-foreground">
              {t('progress.noAttemptsDesc')}
            </p>
          ) : (
            <div className="mt-1">
              {recentAttempts.slice(0, 3).map((attempt) => (
                <Link
                  key={attempt.id}
                  to={`/quizzes?attempt=${attempt.id}`}
                  className="flex items-center gap-3 border-b-2 border-dashed border-border py-3"
                >
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-[3px_7px_4px_6px] border-2 border-foreground font-display text-lg font-bold',
                      attempt.scorePercent >= 70
                        ? 'bg-accent'
                        : attempt.scorePercent >= 40
                          ? 'bg-secondary'
                          : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {attempt.scorePercent}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{attempt.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(attempt.submittedAt), 'd MMM, HH:mm')} · {attempt.correctCount}/{attempt.total}{' '}
                      {t('quizzes.correct')}
                    </p>
                  </div>
                  <CheckCircle2 className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 pb-2 text-sm text-muted-foreground">
        <TickDoodle className="size-4" /> {format(addDays(new Date(), 0), 'd MMM yyyy')} · {i18n.language.toUpperCase()}
      </p>
    </div>
  )
}
