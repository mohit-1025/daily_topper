import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, slotDot } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { slotsForDate } from '@/services/plannerService'
import { addMinutesToTime, cn, dateLocale, formatDuration, longDate, todayISO } from '@/lib/utils'
import type { Exam, StudySlot } from '@/types'

type View = 'month' | 'week' | 'day'

const legend = [
  { key: 'scheduled', tone: 'bg-info' },
  { key: 'completed', tone: 'bg-success' },
  { key: 'skipped', tone: 'bg-warning' },
  { key: 'missed', tone: 'bg-destructive' },
  { key: 'exam', tone: 'bg-violet-500' },
] as const

export function PlanPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const slots = useAppStore((state) => state.slots)
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const settings = useAppStore((state) => state.settings)
  const examMode = useAppStore((state) => state.examMode)
  const startSlot = useAppStore((state) => state.startSlot)
  const regeneratePlan = useAppStore((state) => state.regeneratePlan)

  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudySlot | null>(null)
  const locale = dateLocale(settings.language)
  const today = todayISO()
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))

  const range = useMemo(() => {
    if (view === 'month') {
      return {
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 }),
      }
    }
    if (view === 'week') {
      return {
        start: startOfWeek(cursor, { weekStartsOn: 0 }),
        end: endOfWeek(cursor, { weekStartsOn: 0 }),
      }
    }
    return { start: cursor, end: cursor }
  }, [view, cursor])

  const days = useMemo(() => eachDayOfInterval(range), [range])
  const examByDate = useMemo(() => {
    const map = new Map<string, Exam[]>()
    const list = examMode.active ? examMode.exams : []
    list.forEach((exam) => {
      map.set(exam.date, [...(map.get(exam.date) ?? []), exam])
    })
    return map
  }, [examMode])

  const rangeSlots = useMemo(
    () => slots.filter((slot) => slot.date >= format(range.start, 'yyyy-MM-dd') && slot.date <= format(range.end, 'yyyy-MM-dd')),
    [slots, range],
  )

  const move = (direction: number) => {
    if (view === 'month') setCursor((current) => (direction > 0 ? addMonths(current, 1) : subMonths(current, 1)))
    else if (view === 'week') setCursor((current) => (direction > 0 ? addWeeks(current, 1) : subWeeks(current, 1)))
    else setCursor((current) => addDays(current, direction))
  }

  const label =
    view === 'month'
      ? format(cursor, 'MMMM yyyy', { locale })
      : view === 'week'
        ? `${format(range.start, 'd MMM', { locale })} – ${format(range.end, 'd MMM yyyy', { locale })}`
        : longDate(cursor, settings.language)

  const agendaDays = days
    .map((day) => ({ day, iso: format(day, 'yyyy-MM-dd'), items: slotsForDate(slots, format(day, 'yyyy-MM-dd')) }))
    .filter((entry) => entry.items.length > 0 || examByDate.has(entry.iso) || entry.iso === today)

  const openSlot = (slot: StudySlot) => setDetail(slot)
  const activeDetail = detail ? slots.find((slot) => slot.id === detail.id) ?? detail : null
  const detailSubject = activeDetail ? subjectById.get(activeDetail.subjectId) : undefined
  const detailTopics = activeDetail ? topics.filter((topic) => activeDetail.topicIds.includes(topic.id)) : []

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('plan.title')}
        subtitle={t('plan.subtitle')}
        eyebrow={longDate(new Date(), settings.language)}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              <CalendarDays className="size-3.5" /> {t('plan.today')}
            </Button>
            <Button variant="outline" size="sm" onClick={regeneratePlan}>
              <RefreshCw className="size-3.5" /> {t('plan.regenerate')}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => move(-1)} aria-label="Previous period">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => move(1)} aria-label="Next period">
                <ChevronRight className="size-4" />
              </Button>
              <h2 className="ml-2 font-display text-lg font-bold">{label}</h2>
            </div>
            <Tabs value={view} onValueChange={(value) => setView(value as View)}>
              <TabsList>
                <TabsTrigger value="month">{t('plan.month')}</TabsTrigger>
                <TabsTrigger value="week">{t('plan.week')}</TabsTrigger>
                <TabsTrigger value="day">{t('plan.day')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t('plan.legend')}</span>
            {legend.map((item) => (
              <span key={item.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={cn('size-2 rounded-full', item.tone)} /> {t(`plan.${item.key}`)}
              </span>
            ))}
            {examMode.active && (
              <Badge variant="violet" className="ml-auto">
                <Trophy className="size-3" /> {examMode.exams.length} exams
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="hidden md:block">
        {view === 'month' && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                  <div key={day} className="pb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t(`days.${day}`).slice(0, 3)}
                  </div>
                ))}
                {days.map((day) => {
                  const iso = format(day, 'yyyy-MM-dd')
                  const daySlots = slotsForDate(slots, iso)
                  const isToday = iso === today
                  const isOff = !examMode.active && day.getDay() === settings.weeklyOffDay
                  const exams = examByDate.get(iso)
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setSelectedDate(iso)
                        setView('day')
                        setCursor(day)
                      }}
                      className={cn(
                        'flex min-h-[92px] flex-col rounded-xl border p-1.5 text-left transition-colors',
                        isSameMonth(day, cursor) ? 'bg-card' : 'bg-muted/20 opacity-60',
                        isToday ? 'border-primary/50 bg-primary-soft/30' : 'border-border hover:border-primary/30',
                      )}
                    >
                      <span className={cn('flex size-6 items-center justify-center rounded-full text-[11px] font-semibold', isToday && 'bg-primary text-primary-foreground')}>
                        {format(day, 'd')}
                      </span>
                      <span className="mt-0.5 flex-1 space-y-0.5 overflow-hidden">
                        {exams?.slice(0, 1).map((exam) => (
                          <span key={exam.id} className="block truncate rounded bg-violet-500/10 px-1 py-0.5 text-[9px] font-bold text-violet-500">
                            Exam · {subjectById.get(exam.subjectId)?.name}
                          </span>
                        ))}
                        {daySlots.slice(0, 2).map((slot) => (
                          <span key={slot.id} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <span className={cn('size-1.5 shrink-0 rounded-full', slotDot(slot.status, slot.source))} />
                            <span className="truncate">{slot.start} {subjectById.get(slot.subjectId)?.name}</span>
                          </span>
                        ))}
                        {daySlots.length > 2 && <span className="text-[9px] font-semibold text-primary">+{daySlots.length - 2} more</span>}
                        {!daySlots.length && isOff && <span className="text-[9px] text-muted-foreground/70">{t('plan.offDay')}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'week' && (
          <div className="grid gap-3 lg:grid-cols-7">
            {days.map((day) => {
              const iso = format(day, 'yyyy-MM-dd')
              const daySlots = slotsForDate(slots, iso)
              const isToday = iso === today
              return (
                <Card key={iso} className={cn(isToday && 'border-primary/50')}>
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {format(day, 'EEE', { locale })}
                        </p>
                        <p className={cn('font-display text-lg font-bold', isToday && 'text-primary')}>{format(day, 'd')}</p>
                      </div>
                      {isToday && <Badge variant="default">{t('plan.today')}</Badge>}
                    </div>
                    <div className="space-y-1.5">
                      {daySlots.length === 0 && (
                        <p className="rounded-lg bg-muted/40 px-2 py-3 text-center text-[10px] text-muted-foreground">
                          {examByDate.has(iso) ? t('plan.examDay') : t('plan.noSlots')}
                        </p>
                      )}
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => openSlot(slot)}
                          className="block w-full rounded-lg border border-border bg-background/70 p-2 text-left transition-colors hover:border-primary/30"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={cn('size-1.5 rounded-full', slotDot(slot.status, slot.source))} />
                            <span className="text-[9px] font-bold text-muted-foreground">{slot.start}</span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-semibold">{subjectById.get(slot.subjectId)?.name}</p>
                          <p className="text-[9px] text-muted-foreground">{slot.duration}m</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {view === 'day' && (
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold">{longDate(cursor, settings.language)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).length} slots ·{' '}
                    {formatDuration(slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).reduce((sum, slot) => sum + slot.duration, 0))}
                  </p>
                </div>
                {examByDate.has(format(cursor, 'yyyy-MM-dd')) && (
                  <Badge variant="violet">
                    <Trophy className="size-3" /> {t('plan.examDay')}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).length === 0 && (
                  <div className="rounded-xl border border-dashed border-border py-8 text-center">
                    <CalendarDays className="mx-auto size-7 text-muted-foreground/40" />
                    <p className="mt-2 text-sm font-semibold">{t('plan.noSlots')}</p>
                    <p className="text-xs text-muted-foreground">{t('plan.noSlotsDesc')}</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/tasks">{t('plan.openTasks')}</Link>
                    </Button>
                  </div>
                )}
                {slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).map((slot) => {
                  const subject = subjectById.get(slot.subjectId)
                  const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id))
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => openSlot(slot)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/60 p-3 text-left transition-colors hover:border-primary/30"
                    >
                      <span className="w-14 shrink-0 text-xs font-bold tabular-nums">{slot.start}</span>
                      <span className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: subject?.color ?? '#6366f1' }} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-semibold">{subject?.name}</span>
                          <StatusBadge status={slot.status} source={slot.source} />
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {slot.duration} min · {slotTopics.map((topic) => topic.name).join(', ') || 'General'}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
          <span className="text-xs font-semibold">{label}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => move(-1)} aria-label="Previous">
              <ArrowLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => move(1)} aria-label="Next">
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
        {agendaDays.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <CalendarDays className="mx-auto size-7 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-semibold">{t('plan.noSlots')}</p>
              <p className="text-xs text-muted-foreground">{t('plan.noSlotsDesc')}</p>
            </CardContent>
          </Card>
        )}
        {agendaDays.map((entry) => (
          <Card key={entry.iso}>
            <CardContent className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-9 flex-col items-center justify-center rounded-lg bg-muted text-[9px] font-bold leading-none',
                      entry.iso === today && 'bg-primary text-primary-foreground',
                    )}
                  >
                    <span className="uppercase">{format(entry.day, 'MMM', { locale })}</span>
                    <span className="text-xs">{format(entry.day, 'd')}</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{format(entry.day, 'EEEE', { locale })}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.items.length} slots
                      {examByDate.has(entry.iso) ? ' · Exam day' : ''}
                    </p>
                  </div>
                </div>
                {entry.iso === today && <Badge variant="default">{t('plan.today')}</Badge>}
              </div>
              <div className="space-y-1.5">
                {entry.items.length === 0 && (
                  <p className="rounded-lg bg-muted/40 px-2 py-2 text-center text-[11px] text-muted-foreground">
                    {examByDate.has(entry.iso) ? t('plan.examDay') : t('plan.offDay')}
                  </p>
                )}
                {entry.items.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => openSlot(slot)}
                    className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2 text-left"
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', slotDot(slot.status, slot.source))} />
                    <span className="w-10 text-[10px] font-bold tabular-nums">{slot.start}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {subjectById.get(slot.subjectId)?.name}
                    </span>
                    <StatusBadge status={slot.status} source={slot.source} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(activeDetail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent size="sm" className="sm:max-w-md">
          {activeDetail && (
            <>
              <DialogHeader>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={activeDetail.status} source={activeDetail.source} />
                  <Badge variant="outline">{activeDetail.date}</Badge>
                </div>
                <DialogTitle>{detailSubject?.name ?? t('plan.slotDetails')}</DialogTitle>
                <DialogDescription>
                  {activeDetail.start} – {addMinutesToTime(activeDetail.start, activeDetail.duration)} ·{' '}
                  {activeDetail.duration} {t('common.minutes')}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('plan.topicsToCover')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailTopics.length === 0 && <span className="text-xs text-muted-foreground">{t('common.none')}</span>}
                    {detailTopics.map((topic) => (
                      <span key={topic.id} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium">
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </div>
                {activeDetail.skipReason && (
                  <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">{activeDetail.skipReason}</p>
                )}
                {activeDetail.completedAt && (
                  <p className="flex items-center gap-1.5 text-xs text-success">
                    <Clock className="size-3.5" /> Completed {format(new Date(activeDetail.completedAt), 'd MMM, HH:mm')}
                  </p>
                )}
                <p className="rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                  {t('plan.rescheduleHint')}
                </p>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  {t('common.close')}
                </Button>
                {['scheduled', 'running'].includes(activeDetail.status) && (
                  <Button
                    onClick={() => {
                      if (activeDetail.status === 'scheduled') startSlot(activeDetail.id)
                      navigate('/tasks')
                    }}
                  >
                    <Play className="size-4" /> {t('plan.openTasks')}
                  </Button>
                )}
                {!['scheduled', 'running'].includes(activeDetail.status) && (
                  <Button variant="soft" asChild>
                    <Link to="/tasks">{t('plan.openTasks')}</Link>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {selectedDate && (
        <p className="text-center text-[10px] text-muted-foreground">
          <Sparkles className="mr-1 inline size-3" /> Showing {selectedDate} · changes sync instantly with Daily Tasks.
        </p>
      )}
      {!selectedDate && rangeSlots.length > 0 && (
        <p className="text-center text-[10px] text-muted-foreground">
          {rangeSlots.length} slots in this {view} · {isSameDay(cursor, new Date()) ? 'Today' : format(cursor, 'd MMM')}
        </p>
      )}
    </div>
  )
}
