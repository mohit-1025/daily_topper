import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO, subDays } from 'date-fns'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  Flame,
  LineChart as LineChartIcon,
  Loader2,
  Printer,
  Target,
  Trophy,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState, Progress, Skeleton } from '@/components/ui/misc'
import { PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import { useAppStore } from '@/store/useAppStore'
import { computeStreak, computeTopicPerformance, studyMinutes, subjectAccuracy } from '@/services/plannerService'
import { cn, formatDuration, longDate, percent, prettyDate, shortWeekday, todayISO } from '@/lib/utils'
import type { RevisionSheet, Subject, Topic } from '@/types'

const CHART_COLORS = {
  ink: 'hsl(var(--foreground))',
  rule: 'hsl(var(--rule-hsl))',
  margin: 'hsl(var(--margin-line-hsl))',
  highlighter: 'hsl(var(--highlighter-hsl))',
  tape: 'hsl(var(--tape-hsl))',
}

const axisTick = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
const tooltipStyle = {
  borderRadius: 4,
  border: '2px solid hsl(var(--foreground))',
  background: 'hsl(var(--paper-hsl))',
  fontSize: 13,
  color: 'hsl(var(--foreground))',
  boxShadow: '3px 3px 0 hsl(var(--foreground) / 0.2)',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return map[character] ?? character
  })
}

function RevisionSheetBody({ sheet }: { sheet: RevisionSheet }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <section>
        <p className="mb-1.5 font-display text-xl font-bold">{t('progress.keyPoints')}</p>
        <ul className="space-y-1.5">
          {sheet.keyPoints.map((point, index) => (
            <li key={index} className="flex gap-2 leading-8">
              <TickDoodle className="mt-2 size-4 shrink-0" /> {point}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <p className="mb-1.5 font-display text-xl font-bold">{t('progress.definitions')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {sheet.definitions.map((entry, index) => (
            <div key={index} className="border-l-2 border-[var(--margin-line)] pl-2">
              <p className="font-semibold">{entry.term}</p>
              <p className="mt-0.5 leading-8 text-muted-foreground">{entry.meaning}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <p className="mb-1.5 font-display text-xl font-bold">{t('progress.mnemonics')}</p>
          <ul className="space-y-1.5">
            {sheet.mnemonics.map((mnemonic, index) => (
              <li key={index} className="border-b-2 border-dashed border-border py-1 leading-8">
                {mnemonic}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="mb-1.5 font-display text-xl font-bold">{t('progress.mistakes')}</p>
          <ul className="space-y-1.5">
            {sheet.commonMistakes.map((mistake, index) => (
              <li key={index} className="border-l-2 border-[var(--margin-line)] pl-2 leading-8 text-muted-foreground">
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function SubjectConfidence({
  subjects,
  topics,
  performance,
}: {
  subjects: Subject[]
  topics: Topic[]
  performance: ReturnType<typeof computeTopicPerformance>
}) {
  return (
    <div className="space-y-4">
      {subjects.map((subject) => {
        const actual = subjectAccuracy(subject.id, topics, performance)
        const expected = subject.selfRating * 20
        return (
          <div key={subject.id}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold">{subject.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {expected}% vs {actual === null ? '—' : `${actual}%`}
              </span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="h-2.5 border-2 border-foreground">
                <div className="h-full bg-secondary" style={{ width: `${expected}%` }} />
              </div>
              <div className="h-2.5 border-2 border-foreground">
                <div
                  className="progress-striped h-full"
                  style={{ width: `${actual ?? 0}%`, opacity: actual === null ? 0 : 1 }}
                />
              </div>
            </div>
          </div>
        )
      })}
      {subjects.length === 0 && (
        <p className="border-y-2 border-dashed border-border py-6 text-center text-base text-muted-foreground">
          Add subjects to compare confidence with quiz accuracy.
        </p>
      )}
      <div className="flex items-center gap-3 pt-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2.5 border border-foreground bg-secondary" /> Self-rating
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 border border-foreground bg-accent" /> Quiz accuracy
        </span>
      </div>
    </div>
  )
}

export function ProgressPage() {
  const { t } = useTranslation()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const slots = useAppStore((state) => state.slots)
  const attempts = useAppStore((state) => state.attempts)
  const revisionSheets = useAppStore((state) => state.revisionSheets)
  const settings = useAppStore((state) => state.settings)
  const getRevisionSheet = useAppStore((state) => state.getRevisionSheet)
  const pushToast = useAppStore((state) => state.pushToast)

  const [sheetTopic, setSheetTopic] = useState<Topic | null>(null)
  const [sheet, setSheet] = useState<RevisionSheet | null>(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [openSubjects, setOpenSubjects] = useState<string[]>(() => (subjects[0] ? [subjects[0].id] : []))

  const today = todayISO()
  const doneSlots = slots.filter((slot) => slot.status === 'done')
  const totalMinutes = studyMinutes(doneSlots)
  const streak = computeStreak(slots)
  const performance = computeTopicPerformance(attempts)
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.scorePercent, 0) / attempts.length)
    : 0
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.scorePercent), 0)

  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = subDays(new Date(), 13 - index)
    const iso = format(date, 'yyyy-MM-dd')
    return {
      iso,
      label: shortWeekday(iso, settings.language),
      minutes: studyMinutes(slots.filter((slot) => slot.date === iso)),
    }
  })
  const bestDay = trend.reduce((best, day) => Math.max(best, day.minutes), 0)
  const trendDays = trend.filter((day) => day.minutes > 0).length

  const pastSlots = slots.filter((slot) => slot.date <= today && slot.status !== 'scheduled')
  const doneCount = pastSlots.filter((slot) => slot.status === 'done').length
  const skippedCount = pastSlots.filter((slot) => slot.status === 'skipped').length
  const missedCount = pastSlots.filter((slot) => slot.status === 'missed').length
  const completionRate = percent(doneCount, pastSlots.length)
  const pieData = [
    { name: 'Done', value: doneCount, color: CHART_COLORS.highlighter },
    { name: 'Skipped', value: skippedCount, color: CHART_COLORS.tape },
    { name: 'Missed', value: missedCount, color: CHART_COLORS.margin },
  ]

  const subjectMinutes = subjects
    .map((subject) => ({
      name: subject.name,
      minutes: studyMinutes(doneSlots.filter((slot) => slot.subjectId === subject.id)),
    }))
    .filter((entry) => entry.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)

  const quizTrend = [...attempts]
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .slice(-10)
    .map((attempt) => ({
      label: format(parseISO(attempt.submittedAt), 'd MMM'),
      score: attempt.scorePercent,
      title: attempt.title,
    }))

  const ranked = [...performance].sort((a, b) => a.accuracy - b.accuracy)
  const weakest = ranked[0]
  const strongest = ranked[ranked.length - 1]

  const minutesByDay = useMemo(() => {
    const map = new Map<string, number>()
    doneSlots.forEach((slot) => {
      map.set(slot.date, (map.get(slot.date) ?? 0) + slot.duration)
    })
    return map
  }, [doneSlots])

  const heatmapDays = useMemo(
    () =>
      Array.from({ length: 84 }, (_, index) => {
        const iso = format(subDays(new Date(), 83 - index), 'yyyy-MM-dd')
        return { iso, minutes: minutesByDay.get(iso) ?? 0 }
      }),
    [minutesByDay],
  )

  const coveredTopics = topics.filter((topic) => topic.status === 'covered')
  const coveredGroups = subjects
    .map((subject) => ({
      subject,
      topics: coveredTopics
        .filter((topic) => topic.subjectId === subject.id)
        .sort((a, b) => (b.coveredAt ?? '').localeCompare(a.coveredAt ?? '')),
    }))
    .filter((group) => group.topics.length > 0)

  useEffect(() => {
    if (!sheetTopic) {
      setSheet(null)
      return undefined
    }
    let cancelled = false
    setSheet(null)
    setSheetLoading(true)
    getRevisionSheet(sheetTopic.subjectId, sheetTopic.id)
      .then((result) => {
        if (!cancelled) setSheet(result)
      })
      .catch(() => {
        if (!cancelled) pushToast('Revision sheet unavailable', 'Please try again in a moment.', 'error')
      })
      .finally(() => {
        if (!cancelled) setSheetLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheetTopic, getRevisionSheet, pushToast])

  const toggleSubjectGroup = (subjectId: string) => {
    setOpenSubjects((current) =>
      current.includes(subjectId) ? current.filter((id) => id !== subjectId) : [...current, subjectId],
    )
  }

  const sheetAsText = () => {
    if (!sheet) return ''
    return [
      sheet.title,
      '',
      `${t('progress.keyPoints')}:`,
      ...sheet.keyPoints.map((point) => `- ${point}`),
      '',
      `${t('progress.definitions')}:`,
      ...sheet.definitions.map((entry) => `- ${entry.term}: ${entry.meaning}`),
      '',
      `${t('progress.mnemonics')}:`,
      ...sheet.mnemonics.map((mnemonic) => `- ${mnemonic}`),
      '',
      `${t('progress.mistakes')}:`,
      ...sheet.commonMistakes.map((mistake) => `- ${mistake}`),
    ].join('\n')
  }

  const copySheet = async () => {
    if (!sheet) return
    try {
      await navigator.clipboard.writeText(sheetAsText())
      pushToast('Copied', 'Revision sheet copied to your clipboard.', 'success')
    } catch {
      pushToast('Could not copy', 'Your browser blocked clipboard access.', 'error')
    }
  }

  const printSheet = () => {
    if (!sheet || !sheetTopic) return
    const subject = subjects.find((item) => item.id === sheet.subjectId)
    const win = window.open('', '_blank', 'width=820,height=900')
    if (!win) {
      pushToast('Popup blocked', 'Allow popups for this site to print the sheet.', 'warning')
      return
    }
    const list = (items: string[]) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(sheet.title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Patrick Hand', 'Segoe Print', 'Comic Sans MS', cursive;
    color: #23325e;
    background: #fbfaf4;
    margin: 0;
    padding: 36px;
    line-height: 32px;
    font-size: 17px;
    background-image: repeating-linear-gradient(to bottom, transparent 0 31px, rgba(185,211,230,.55) 31px 32px);
  }
  h1, h2 { font-family: 'Caveat Brush', 'Segoe Print', cursive; font-weight: 400; }
  h1 { font-size: 34px; margin: 0 0 4px; }
  .meta { color: #4a5578; font-size: 15px; margin-bottom: 24px; }
  h2 { font-size: 24px; margin: 24px 0 6px; border-bottom: 2px dashed #23325e; padding-bottom: 2px; }
  ul { margin: 0; padding-left: 22px; }
  li { margin-bottom: 4px; }
  .defs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .def { border-left: 3px solid #e8928f; padding: 2px 10px; }
  .def b { display: block; }
  @media print { body { padding: 16mm; } }
</style></head>
<body>
  <h1>${escapeHtml(sheet.title)}</h1>
  <p class="meta">${escapeHtml(subject?.name ?? '')} · ${escapeHtml(prettyDate(today))} · Daily Topper</p>
  <h2>${escapeHtml(t('progress.keyPoints'))}</h2>
  <ul>${list(sheet.keyPoints)}</ul>
  <h2>${escapeHtml(t('progress.definitions'))}</h2>
  <div class="defs">${sheet.definitions
    .map((entry) => `<div class="def"><b>${escapeHtml(entry.term)}</b>${escapeHtml(entry.meaning)}</div>`)
    .join('')}</div>
  <h2>${escapeHtml(t('progress.mnemonics'))}</h2>
  <ul>${list(sheet.mnemonics)}</ul>
  <h2>${escapeHtml(t('progress.mistakes'))}</h2>
  <ul>${list(sheet.commonMistakes)}</ul>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={longDate(new Date(), settings.language)}
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/quizzes">
              <LineChartIcon className="size-4" /> Take a quiz
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 border-y-2 border-dashed border-border lg:grid-cols-4 lg:divide-x-2 lg:divide-dashed lg:divide-border">
        {[
          { label: t('progress.studyHours'), value: formatDuration(totalMinutes) },
          { label: t('progress.avgScore'), value: `${avgScore}%` },
          { label: t('progress.doneSlots'), value: String(doneSlots.length) },
          { label: t('progress.dayStreak'), value: String(streak.current) },
        ].map((stat) => (
          <div key={stat.label} className="px-1 py-3 lg:px-4">
            <p className="font-display text-4xl font-bold leading-none">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{t('progress.studyTime')}</CardTitle>
                <CardDescription>{t('progress.studyTimeDesc')}</CardDescription>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold leading-none">{formatDuration(totalMinutes)}</p>
                <p className="text-sm text-muted-foreground">{trendDays} active days / 14</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--rule-hsl))" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} unit="m" />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, payload) => payload?.[0]?.payload?.iso ?? ''} />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    name="Minutes"
                    stroke={CHART_COLORS.ink}
                    strokeWidth={2.5}
                    fill={CHART_COLORS.highlighter}
                    fillOpacity={0.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Best day this fortnight: <span className="font-semibold text-foreground">{formatDuration(bestDay)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('progress.completion')}</CardTitle>
            <CardDescription>{t('progress.completionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke={CHART_COLORS.ink}
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold">{completionRate}%</span>
                <span className="text-sm text-muted-foreground">completed</span>
              </div>
            </div>
            <dl className="mt-1 border-t-2 border-dashed border-border">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between border-b border-dashed border-border py-1 text-sm">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2.5 border border-foreground" style={{ backgroundColor: entry.color }} /> {entry.name}
                  </dt>
                  <dd className="font-bold">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{t('progress.quizTrend')}</CardTitle>
                <CardDescription>{t('progress.quizTrendDesc')}</CardDescription>
              </div>
              {attempts.length > 0 && (
                <Badge variant="secondary">
                  <Trophy className="size-3.5" /> Best {bestScore}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {quizTrend.length === 0 ? (
              <EmptyState
                icon={Target}
                title={t('progress.noAttempts')}
                description={t('progress.noAttemptsDesc')}
                className="py-8"
                action={
                  <Button size="sm" asChild>
                    <Link to="/quizzes">
                      <PencilDoodle className="size-5" /> {t('quizzes.generate')}
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quizTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--rule-hsl))" vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} width={44} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke={CHART_COLORS.ink}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: CHART_COLORS.highlighter, stroke: CHART_COLORS.ink, strokeWidth: 2 }}
                      activeDot={{ r: 5, fill: CHART_COLORS.ink }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('progress.ratingVsActual')}</CardTitle>
            <CardDescription>{t('progress.ratingVsActualDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectConfidence subjects={subjects} topics={topics} performance={performance} />
            {(weakest || strongest) && (
              <div className="mt-4 space-y-1.5 border-t-2 border-dashed border-border pt-3">
                {weakest && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{t('progress.weak')}</span>
                    <span className="truncate font-semibold text-destructive">
                      {weakest.topicName} · {weakest.accuracy}%
                    </span>
                  </div>
                )}
                {strongest && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{t('progress.strongest')}</span>
                    <span className="truncate font-semibold text-success">
                      {strongest.topicName} · {strongest.accuracy}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('progress.subjectSplit')}</CardTitle>
            <CardDescription>{t('progress.subjectSplitDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectMinutes.length === 0 ? (
              <p className="border-y-2 border-dashed border-border py-8 text-center text-base text-muted-foreground">
                Finish a study slot to see how your hours split across subjects.
              </p>
            ) : (
              <div style={{ height: Math.max(150, subjectMinutes.length * 44) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectMinutes} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--rule-hsl))" horizontal={false} />
                    <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} unit="m" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,228,92,0.25)' }} />
                    <Bar dataKey="minutes" name="Minutes" fill={CHART_COLORS.ink} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>{t('progress.heatmap')}</CardTitle>
                <CardDescription>{t('progress.heatmapDesc')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="accent">
                  <Flame className="size-3.5" /> {streak.current} {t('progress.dayStreak')}
                </Badge>
                {streak.best > streak.current && <Badge variant="outline">Best {streak.best}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-1">
              <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
                {heatmapDays.map((day) => {
                  const tone =
                    day.minutes === 0
                      ? 'bg-muted'
                      : day.minutes <= 30
                        ? 'bg-accent/30'
                        : day.minutes <= 60
                          ? 'bg-accent/55'
                          : day.minutes <= 90
                            ? 'bg-accent/80'
                            : 'bg-accent'
                  return (
                    <div
                      key={day.iso}
                      className={cn('size-3 rounded-[1px] border border-foreground/60 sm:size-3.5', tone)}
                      title={`${prettyDate(day.iso)} — ${day.minutes} min`}
                    />
                  )
                })}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Last 12 weeks</span>
              <span className="flex items-center gap-1">
                Less
                {['bg-muted', 'bg-accent/30', 'bg-accent/55', 'bg-accent/80', 'bg-accent'].map((tone) => (
                  <span key={tone} className={cn('size-2.5 rounded-[1px] border border-foreground/60', tone)} />
                ))}
                More
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>{t('progress.coveredTopics')}</CardTitle>
              <CardDescription>{t('progress.coveredDesc')}</CardDescription>
            </div>
            <Badge variant="success">
              <CheckCircle2 className="size-3.5" /> {coveredTopics.length} / {topics.length}
            </Badge>
          </div>
          <Progress value={percent(coveredTopics.length, Math.max(1, topics.length))} className="mt-2" />
        </CardHeader>
        <CardContent>
          {coveredGroups.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('progress.noCovered')}
              description={t('progress.noCoveredDesc')}
              className="py-8"
              action={
                <Button size="sm" asChild>
                  <Link to="/tasks">
                    <Target className="size-4" /> {t('nav.tasks')}
                  </Link>
                </Button>
              }
            />
          ) : (
            <div>
              {coveredGroups.map(({ subject, topics: groupTopics }) => {
                const open = openSubjects.includes(subject.id)
                return (
                  <div key={subject.id} className="border-b-2 border-dashed border-border">
                    <button
                      type="button"
                      onClick={() => toggleSubjectGroup(subject.id)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-2.5 py-2.5 text-left"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[2px_6px_3px_5px] border-2 border-foreground text-xs font-bold">
                        {subject.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{subject.name}</span>
                        <span className="block text-sm text-muted-foreground">{groupTopics.length} covered</span>
                      </span>
                      <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <ul>
                        {groupTopics.map((topic) => {
                          const cached = revisionSheets.some(
                            (item) => item.topicId === topic.id && item.subjectId === topic.subjectId,
                          )
                          return (
                            <li key={topic.id} className="flex items-center gap-2 border-t border-dashed border-border py-2 pl-2">
                              <TickDoodle className="size-4 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{topic.name}</p>
                                {topic.coveredAt && (
                                  <p className="text-sm text-muted-foreground">Covered {prettyDate(topic.coveredAt.slice(0, 10))}</p>
                                )}
                              </div>
                              {cached && (
                                <Badge variant="outline" className="hidden sm:inline-flex">
                                  {t('progress.cached')}
                                </Badge>
                              )}
                              <Button variant="soft" size="sm" onClick={() => setSheetTopic(topic)}>
                                <FileText className="size-3.5" />
                                <span className="hidden sm:inline">{t('progress.revisionSheet')}</span>
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(sheetTopic)} onOpenChange={(open) => !open && setSheetTopic(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="accent">
                <PencilDoodle className="size-3.5" /> {t('progress.revisionSheet')}
              </Badge>
              {sheet && revisionSheets.some((item) => item.id === sheet.id) && (
                <Badge variant="outline">{t('progress.cached')}</Badge>
              )}
            </div>
            <DialogTitle>{sheetTopic?.name ?? t('progress.revisionSheet')}</DialogTitle>
            <DialogDescription>{subjects.find((subject) => subject.id === sheetTopic?.subjectId)?.name}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            {sheetLoading || !sheet ? (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> {t('progress.generating')}
                </p>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <RevisionSheetBody sheet={sheet} />
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSheetTopic(null)}>
              {t('common.close')}
            </Button>
            <Button variant="soft" onClick={copySheet} disabled={!sheet}>
              <Copy className="size-4" /> {t('common.copy')}
            </Button>
            <Button onClick={printSheet} disabled={!sheet}>
              <Printer className="size-4" /> {t('common.print')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {coveredTopics.length === 0 && attempts.length === 0 && (
        <div className="flex flex-col gap-3 border-2 border-dashed border-foreground/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <BookOpen className="size-4" />
            Complete a slot quiz and a custom quiz to unlock the full picture.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/tasks">{t('nav.tasks')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/quizzes">{t('nav.quizzes')}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
