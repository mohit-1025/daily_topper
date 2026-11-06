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
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState, Progress, Skeleton } from '@/components/ui/misc'
import { useAppStore } from '@/store/useAppStore'
import { computeStreak, computeTopicPerformance, studyMinutes, subjectAccuracy } from '@/services/plannerService'
import { cn, formatDuration, longDate, percent, prettyDate, shortWeekday, todayISO } from '@/lib/utils'
import type { RevisionSheet, Subject, Topic } from '@/types'

const CHART_COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#ef4444',
  info: '#3b82f6',
}

const axisTick = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  fontSize: 12,
  color: 'hsl(var(--foreground))',
  boxShadow: '0 12px 32px -12px rgb(15 23 42 / 0.25)',
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
    <div className="space-y-4">
      <section>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">{t('progress.keyPoints')}</p>
        <ul className="space-y-1.5">
          {sheet.keyPoints.map((point, index) => (
            <li key={index} className="flex gap-2 text-sm leading-relaxed">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {point}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">{t('progress.definitions')}</p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {sheet.definitions.map((entry, index) => (
            <div key={index} className="rounded-lg bg-muted/40 p-2.5">
              <p className="text-xs font-bold">{entry.term}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{entry.meaning}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <section>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">{t('progress.mnemonics')}</p>
          <ul className="space-y-1.5">
            {sheet.mnemonics.map((mnemonic, index) => (
              <li key={index} className="rounded-lg bg-warning/10 px-2.5 py-2 text-[11px] leading-relaxed text-warning">
                {mnemonic}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">{t('progress.mistakes')}</p>
          <ul className="space-y-1.5">
            {sheet.commonMistakes.map((mistake, index) => (
              <li key={index} className="rounded-lg bg-destructive/5 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
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
    <div className="space-y-3">
      {subjects.map((subject) => {
        const actual = subjectAccuracy(subject.id, topics, performance)
        const expected = subject.selfRating * 20
        return (
          <div key={subject.id}>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate font-semibold">{subject.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {expected}% vs {actual === null ? '—' : `${actual}%`}
              </span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${expected}%` }} />
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${actual ?? 0}%`,
                    backgroundColor: actual === null ? 'transparent' : subject.color,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
      {subjects.length === 0 && (
        <p className="rounded-xl bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Add subjects to compare confidence with quiz accuracy.
        </p>
      )}
      <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-muted-foreground/40" /> Self-rating</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-primary" /> Quiz accuracy</span>
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
    { name: 'Done', value: doneCount, color: CHART_COLORS.success },
    { name: 'Skipped', value: skippedCount, color: CHART_COLORS.warning },
    { name: 'Missed', value: missedCount, color: CHART_COLORS.destructive },
  ]

  const subjectMinutes = subjects
    .map((subject) => ({
      name: subject.name,
      minutes: studyMinutes(doneSlots.filter((slot) => slot.subjectId === subject.id)),
      color: subject.color,
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
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; margin: 36px; line-height: 1.55; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #4f46e5; margin: 20px 0 6px; }
  ul { margin: 0; padding-left: 20px; font-size: 13px; }
  li { margin-bottom: 5px; }
  .defs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
  .def { background: #f8fafc; border-radius: 8px; padding: 8px 10px; }
  .def b { display: block; margin-bottom: 2px; }
  @media print { body { margin: 18mm; } }
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
    <div className="space-y-5">
      <PageHeader
        eyebrow={longDate(new Date(), settings.language)}
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/quizzes">
              <LineChartIcon className="size-3.5" /> Take a quiz
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t('progress.studyHours'), value: formatDuration(totalMinutes), icon: Zap, tone: 'text-primary' },
          { label: t('progress.avgScore'), value: `${avgScore}%`, icon: Target, tone: 'text-info' },
          { label: t('progress.doneSlots'), value: doneSlots.length, icon: CheckCircle2, tone: 'text-success' },
          { label: t('progress.dayStreak'), value: streak.current, icon: Flame, tone: 'text-warning' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <stat.icon className={cn('mb-1 size-4', stat.tone)} />
              <p className="font-display text-2xl font-extrabold">{stat.value}</p>
              <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t('progress.studyTime')}</CardTitle>
                <CardDescription>{t('progress.studyTimeDesc')}</CardDescription>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-extrabold">{formatDuration(totalMinutes)}</p>
                <p className="text-[10px] text-muted-foreground">{trendDays} active days / 14</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={38} unit="m" />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(_, payload) => payload?.[0]?.payload?.iso ?? ''} />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    name="Minutes"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    fill="url(#studyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Best day this fortnight: <span className="font-semibold text-foreground">{formatDuration(bestDay)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('progress.completion')}</CardTitle>
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
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-extrabold">{completionRate}%</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Completed</span>
              </div>
            </div>
            <div className="mt-1 space-y-1.5">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} /> {entry.name}
                  </span>
                  <span className="font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{t('progress.quizTrend')}</CardTitle>
                <CardDescription>{t('progress.quizTrendDesc')}</CardDescription>
              </div>
              {attempts.length > 0 && (
                <Badge variant="secondary">
                  <Trophy className="size-3" /> Best {bestScore}%
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
                      <Sparkles className="size-3.5" /> {t('quizzes.generate')}
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quizTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} width={38} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke={CHART_COLORS.info}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: CHART_COLORS.info, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('progress.ratingVsActual')}</CardTitle>
            <CardDescription>{t('progress.ratingVsActualDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectConfidence subjects={subjects} topics={topics} performance={performance} />
            {(weakest || strongest) && (
              <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                {weakest && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-muted-foreground">{t('progress.weak')}</span>
                    <span className="truncate font-semibold text-destructive">{weakest.topicName} · {weakest.accuracy}%</span>
                  </div>
                )}
                {strongest && (
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-muted-foreground">{t('progress.strongest')}</span>
                    <span className="truncate font-semibold text-success">{strongest.topicName} · {strongest.accuracy}%</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('progress.subjectSplit')}</CardTitle>
            <CardDescription>{t('progress.subjectSplitDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {subjectMinutes.length === 0 ? (
              <p className="rounded-xl bg-muted/40 px-3 py-8 text-center text-xs text-muted-foreground">
                Finish a study slot to see how your hours split across subjects.
              </p>
            ) : (
              <div style={{ height: Math.max(150, subjectMinutes.length * 44) }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectMinutes} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} unit="m" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="minutes" name="Minutes" radius={[0, 6, 6, 0]} barSize={14}>
                      {subjectMinutes.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
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
                <CardTitle className="text-base">{t('progress.heatmap')}</CardTitle>
                <CardDescription>{t('progress.heatmapDesc')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="accent">
                  <Flame className="size-3" /> {streak.current} {t('progress.dayStreak')}
                </Badge>
                {streak.best > streak.current && (
                  <Badge variant="outline">Best {streak.best}</Badge>
                )}
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
                        ? 'bg-primary/25'
                        : day.minutes <= 60
                          ? 'bg-primary/45'
                          : day.minutes <= 90
                            ? 'bg-primary/70'
                            : 'bg-primary'
                  return (
                    <div
                      key={day.iso}
                      className={cn('size-3 rounded-[3px] sm:size-3.5', tone)}
                      title={`${prettyDate(day.iso)} — ${day.minutes} min`}
                    />
                  )
                })}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Last 12 weeks</span>
              <span className="flex items-center gap-1">
                Less
                {['bg-muted', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary'].map((tone) => (
                  <span key={tone} className={cn('size-2.5 rounded-[2px]', tone)} />
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
              <CardTitle className="text-base">{t('progress.coveredTopics')}</CardTitle>
              <CardDescription>{t('progress.coveredDesc')}</CardDescription>
            </div>
            <Badge variant="success">
              <CheckCircle2 className="size-3" /> {coveredTopics.length} / {topics.length}
            </Badge>
          </div>
          <Progress
            value={percent(coveredTopics.length, Math.max(1, topics.length))}
            className="mt-2 h-1.5"
            indicatorClassName="bg-success"
          />
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
                    <Target className="size-3.5" /> {t('nav.tasks')}
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {coveredGroups.map(({ subject, topics: groupTopics }) => {
                const open = openSubjects.includes(subject.id)
                return (
                  <div key={subject.id} className="overflow-hidden rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => toggleSubjectGroup(subject.id)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-2.5 bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                        style={{ backgroundColor: subject.color }}
                      >
                        {subject.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{subject.name}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {groupTopics.length} covered
                        </span>
                      </span>
                      <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <ul className="divide-y divide-border">
                        {groupTopics.map((topic) => {
                          const cached = revisionSheets.some(
                            (item) => item.topicId === topic.id && item.subjectId === topic.subjectId,
                          )
                          return (
                            <li key={topic.id} className="flex items-center gap-2 px-3 py-2">
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                                <CheckCircle2 className="size-3" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{topic.name}</p>
                                {topic.coveredAt && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Covered {prettyDate(topic.coveredAt.slice(0, 10))}
                                  </p>
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
              <Badge variant="violet">
                <Sparkles className="size-3" /> {t('progress.revisionSheet')}
              </Badge>
              {sheet && revisionSheets.some((item) => item.id === sheet.id) && (
                <Badge variant="outline">{t('progress.cached')}</Badge>
              )}
            </div>
            <DialogTitle>{sheetTopic?.name ?? t('progress.revisionSheet')}</DialogTitle>
            <DialogDescription>
              {subjects.find((subject) => subject.id === sheetTopic?.subjectId)?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {sheetLoading || !sheet ? (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
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
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="size-4 text-primary" />
              Complete a slot quiz and a custom quiz to unlock the full analytics view.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/tasks">{t('nav.tasks')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/quizzes">{t('nav.quizzes')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
