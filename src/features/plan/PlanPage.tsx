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
  Trophy,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, slotDot } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { slotsForDate } from '@/services/plannerService'
import { addMinutesToTime, cn, dateLocale, formatDuration, longDate, todayISO } from '@/lib/utils'
import { CalendarDoodle, CircleCrossDoodle, PencilDoodle } from '@/components/shared/doodles'
import type { Exam, StudySlot } from '@/types'

type View = 'month' | 'week' | 'day'

const legend = [
  { key: 'scheduled', tone: 'bg-[hsl(var(--rule-hsl))]' },
  { key: 'completed', tone: 'bg-foreground' },
  { key: 'skipped', tone: 'bg-secondary' },
  { key: 'missed', tone: 'bg-[var(--margin-line)]' },
  { key: 'exam', tone: 'bg-accent' },
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
  const skipDay = useAppStore((state) => state.skipDay)

  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [detail, setDetail] = useState<StudySlot | null>(null)
  const [skipOpen, setSkipOpen] = useState(false)
  const [skippedDay, setSkippedDay] = useState<string | null>(null)
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

  const movedSlotIds = useMemo(() => {
    if (!skippedDay) return new Set<string>()
    const movedTopicIds = new Set(
      slots
        .filter((slot) => slot.date === skippedDay && slot.status === 'missed')
        .flatMap((slot) => slot.topicIds),
    )
    if (!movedTopicIds.size) return new Set<string>()
    const firstSlotByTopic = new Map<string, StudySlot>()
    const upcoming = slots
      .filter((slot) => slot.status === 'scheduled' && slot.date > skippedDay)
      .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
    for (const slot of upcoming) {
      for (const topicId of slot.topicIds) {
        if (movedTopicIds.has(topicId) && !firstSlotByTopic.has(topicId)) firstSlotByTopic.set(topicId, slot)
      }
    }
    return new Set([...firstSlotByTopic.values()].map((slot) => slot.id))
  }, [slots, skippedDay])
  const isMoved = (slot: StudySlot) => movedSlotIds.has(slot.id)

  const skippableDays = Array.from({ length: 8 }, (_, index) => addDays(new Date(), -index))
    .map((day) => format(day, 'yyyy-MM-dd'))
    .filter((iso) => slots.some((slot) => slot.date === iso && slot.status === 'scheduled'))

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

  const confirmSkipDay = (iso: string) => {
    skipDay(iso)
    setSkipOpen(false)
    setSkippedDay(iso)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('plan.title')}
        subtitle={t('plan.subtitle')}
        eyebrow={longDate(new Date(), settings.language)}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setSkipOpen(true)}>
              <CircleCrossDoodle className="size-5" /> {t('plan.skipDay')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              <CalendarDays className="size-4" /> {t('plan.today')}
            </Button>
            <Button variant="outline" size="sm" onClick={regeneratePlan}>
              <RefreshCw className="size-4" /> {t('plan.regenerate')}
            </Button>
          </>
        }
      />

      {skippedDay && (
        <div className="flex items-start gap-3 border-2 border-foreground bg-accent/60 px-4 py-3">
          <PencilDoodle className="mt-1 size-5 shrink-0" />
          <div className="flex-1">
            <p className="font-display text-xl font-bold">{t('plan.skippedNote')}</p>
            <p className="text-base text-muted-foreground">
              {format(new Date(`${skippedDay}T12:00:00`), 'd MMM', { locale })} · {t('plan.skipDayDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSkippedDay(null)}
            className="text-sm font-semibold underline underline-offset-4"
          >
            {t('common.close')}
          </button>
        </div>
      )}

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
              <h2 className="ml-2 font-display text-2xl font-bold">{label}</h2>
            </div>
            <Tabs value={view} onValueChange={(value) => setView(value as View)}>
              <TabsList>
                <TabsTrigger value="month">{t('plan.month')}</TabsTrigger>
                <TabsTrigger value="week">{t('plan.week')}</TabsTrigger>
                <TabsTrigger value="day">{t('plan.day')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t-2 border-dashed border-border pt-2">
            <span className="text-base text-muted-foreground">{t('plan.legend')}</span>
            {legend.map((item) => (
              <span key={item.key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className={cn('size-2.5 rounded-[1px] border border-foreground', item.tone)} /> {t(`plan.${item.key}`)}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="size-2.5 rounded-[1px] border border-foreground bg-accent" /> {t('plan.movedHint')}
            </span>
            {examMode.active && (
              <Badge variant="accent" className="ml-auto">
                <Trophy className="size-3.5" /> {examMode.exams.length} exams
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="hidden md:block">
        {view === 'month' && (
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-7">
                {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map((day) => (
                  <div key={day} className="border-b-2 border-foreground pb-1.5 text-center text-sm font-bold">
                    {t(`days.${day}`).slice(0, 3)}
                  </div>
                ))}
                {days.map((day) => {
                  const iso = format(day, 'yyyy-MM-dd')
                  const daySlots = slotsForDate(slots, iso)
                  const isToday = iso === today
                  const isOff = !examMode.active && day.getDay() === settings.weeklyOffDay
                  const exams = examByDate.get(iso)
                  const movedCount = daySlots.filter(isMoved).length
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
                        'flex min-h-[104px] flex-col border-b border-r border-dashed border-[hsl(var(--rule-hsl))] p-1.5 text-left',
                        !isSameMonth(day, cursor) && 'opacity-45',
                        isToday && 'bg-accent/25',
                        day.getDay() === 0 && 'border-l border-l-dashed',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full font-display text-lg font-bold',
                          isToday && 'border-2 border-foreground bg-accent',
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      <span className="mt-0.5 flex-1 space-y-0.5 overflow-hidden">
                        {exams?.slice(0, 1).map((exam) => (
                          <span
                            key={exam.id}
                            className="block truncate border-l-2 border-[var(--margin-line)] pl-1 text-xs font-bold text-destructive"
                          >
                            Exam · {subjectById.get(exam.subjectId)?.name}
                          </span>
                        ))}
                        {daySlots.slice(0, 2).map((slot) => (
                          <span
                            key={slot.id}
                            className={cn(
                              'flex items-center gap-1 text-xs',
                              isMoved(slot) && 'bg-accent/70 px-0.5',
                              slot.status === 'missed' && 'missed-strike text-destructive',
                            )}
                          >
                            <span className={cn('size-1.5 shrink-0 rounded-full border border-foreground', slotDot(slot.status, slot.source))} />
                            <span className="truncate">
                              {slot.start} {subjectById.get(slot.subjectId)?.name}
                            </span>
                          </span>
                        ))}
                        {daySlots.length > 2 && (
                          <span className="text-xs font-semibold">+{daySlots.length - 2} more</span>
                        )}
                        {movedCount > 0 && <span className="block text-xs font-bold">→ {t('plan.movedHint')}</span>}
                        {!daySlots.length && isOff && <span className="text-xs text-muted-foreground">{t('plan.offDay')}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'week' && (
          <Card>
            <CardContent className="grid grid-cols-7 divide-x divide-dashed divide-border p-0">
              {days.map((day) => {
                const iso = format(day, 'yyyy-MM-dd')
                const daySlots = slotsForDate(slots, iso)
                const isToday = iso === today
                return (
                  <div key={iso} className={cn('min-h-[220px] p-2.5', isToday && 'bg-accent/20')}>
                    <div className="mb-2 border-b-2 border-dashed border-border pb-1.5">
                      <p className="text-sm text-muted-foreground">{format(day, 'EEE', { locale })}</p>
                      <p className="font-display text-2xl font-bold leading-none">{format(day, 'd')}</p>
                    </div>
                    <div className="space-y-1.5">
                      {daySlots.length === 0 && (
                        <p className="py-3 text-center text-xs text-muted-foreground">
                          {examByDate.has(iso) ? t('plan.examDay') : t('plan.noSlots')}
                        </p>
                      )}
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => openSlot(slot)}
                          className={cn(
                            'block w-full border-l-2 border-foreground pl-1.5 text-left',
                            isMoved(slot) && 'slot-moved',
                            skippedDay && isMoved(slot) && 'animate-[slot-in_0.35s_ease-out]',
                            slot.status === 'missed' && 'missed-strike text-destructive',
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <span className={cn('size-1.5 rounded-full border border-foreground', slotDot(slot.status, slot.source))} />
                            <span className="text-xs font-bold">{slot.start}</span>
                          </span>
                          <p className="truncate text-sm font-semibold">{subjectById.get(slot.subjectId)?.name}</p>
                          <p className="text-xs text-muted-foreground">{slot.duration}m</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {view === 'day' && (
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-border pb-3">
                <div>
                  <h3 className="font-display text-2xl font-bold">{longDate(cursor, settings.language)}</h3>
                  <p className="text-base text-muted-foreground">
                    {slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).length} slots ·{' '}
                    {formatDuration(
                      slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).reduce((sum, slot) => sum + slot.duration, 0),
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {examByDate.has(format(cursor, 'yyyy-MM-dd')) && (
                    <Badge variant="accent">
                      <Trophy className="size-3.5" /> {t('plan.examDay')}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setSkipOpen(true)}>
                    <CircleCrossDoodle className="size-5" /> {t('plan.skipDay')}
                  </Button>
                </div>
              </div>
              <div>
                {slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).length === 0 && (
                  <div className="py-8 text-center">
                    <CalendarDoodle className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 font-semibold">{t('plan.noSlots')}</p>
                    <p className="text-sm text-muted-foreground">{t('plan.noSlotsDesc')}</p>
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <Link to="/tasks">{t('plan.openTasks')}</Link>
                    </Button>
                  </div>
                )}
                {slotsForDate(slots, format(cursor, 'yyyy-MM-dd')).map((slot) => {
                  const subject = subjectById.get(slot.subjectId)
                  const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id))
                  const moved = isMoved(slot)
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => openSlot(slot)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b-2 border-dashed border-border py-3 text-left last:border-b-0',
                        moved && 'slot-moved px-2',
                        skippedDay && moved && 'animate-[slot-in_0.35s_ease-out]',
                        slot.status === 'missed' && 'slot-missed',
                      )}
                    >
                      <span className="w-14 shrink-0 font-display text-lg font-bold tabular-nums">{slot.start}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-semibold">{subject?.name}</span>
                          <StatusBadge status={slot.status} source={slot.source} />
                          {moved && (
                            <span className="border-b-2 border-foreground text-xs font-semibold">{t('plan.movedHint')}</span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
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
        <div className="flex items-center justify-between border-y-2 border-dashed border-border py-2">
          <span className="font-display text-lg font-bold">{label}</span>
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
          <div className="py-10 text-center">
            <CalendarDoodle className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 font-semibold">{t('plan.noSlots')}</p>
            <p className="text-sm text-muted-foreground">{t('plan.noSlotsDesc')}</p>
          </div>
        )}
        {agendaDays.map((entry) => (
          <div key={entry.iso} className="pb-2">
            <div className="mb-1 flex items-center justify-between border-b-2 border-foreground pb-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-10 flex-col items-center justify-center border-2 border-foreground text-xs font-bold leading-none',
                    entry.iso === today && 'bg-accent',
                  )}
                >
                  <span>{format(entry.day, 'MMM', { locale })}</span>
                  <span className="text-sm">{format(entry.day, 'd')}</span>
                </span>
                <div>
                  <p className="font-semibold">{format(entry.day, 'EEEE', { locale })}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.items.length} slots
                    {examByDate.has(entry.iso) ? ' · Exam day' : ''}
                  </p>
                </div>
              </div>
              {entry.iso === today && <Badge variant="accent">{t('plan.today')}</Badge>}
            </div>
            <div>
              {entry.items.length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  {examByDate.has(entry.iso) ? t('plan.examDay') : t('plan.offDay')}
                </p>
              )}
              {entry.items.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => openSlot(slot)}
                  className={cn(
                    'flex w-full items-center gap-2 border-b border-dashed border-border py-2 text-left',
                    isMoved(slot) && 'slot-moved px-1',
                    slot.status === 'missed' && 'slot-missed',
                  )}
                >
                  <span className={cn('size-2 shrink-0 rounded-full border border-foreground', slotDot(slot.status, slot.source))} />
                  <span className="w-11 text-sm font-bold tabular-nums">{slot.start}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{subjectById.get(slot.subjectId)?.name}</span>
                  <StatusBadge status={slot.status} source={slot.source} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={skipOpen} onOpenChange={setSkipOpen}>
        <DialogContent size="sm" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('plan.skipDayTitle')}</DialogTitle>
            <DialogDescription>{t('plan.skipDayDesc')}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            {skippableDays.length === 0 && <p className="py-4 text-center text-muted-foreground">{t('plan.skipDayEmpty')}</p>}
            <div className="space-y-1">
              {skippableDays.map((iso) => {
                const count = slots.filter((slot) => slot.date === iso && slot.status === 'scheduled').length
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => confirmSkipDay(iso)}
                    className="flex w-full items-center justify-between border-b-2 border-dashed border-border py-2.5 text-left"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <CircleCrossDoodle className="size-5 text-[var(--margin-line)]" />
                      {format(new Date(`${iso}T12:00:00`), 'EEEE, d MMM', { locale })}
                    </span>
                    <span className="text-sm text-muted-foreground">{count} slots</span>
                  </button>
                )
              })}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <p className="mb-1.5 text-base text-muted-foreground">{t('plan.topicsToCover')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailTopics.length === 0 && <span className="text-sm text-muted-foreground">{t('common.none')}</span>}
                    {detailTopics.map((topic) => (
                      <span key={topic.id} className="border-b-2 border-foreground px-1 py-0.5 text-sm font-medium">
                        {topic.name}
                      </span>
                    ))}
                  </div>
                </div>
                {activeDetail.skipReason && (
                  <p className="border-l-2 border-[var(--margin-line)] pl-2 text-sm text-destructive">{activeDetail.skipReason}</p>
                )}
                {activeDetail.completedAt && (
                  <p className="flex items-center gap-1.5 text-sm text-success">
                    <Clock className="size-4" /> Completed {format(new Date(activeDetail.completedAt), 'd MMM, HH:mm')}
                  </p>
                )}
                <p className="border-t-2 border-dashed border-border pt-2 text-sm text-muted-foreground">
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
        <p className="text-center text-sm text-muted-foreground">
          Showing {selectedDate} · changes sync instantly with Daily Tasks.
        </p>
      )}
      {!selectedDate && rangeSlots.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {rangeSlots.length} slots in this {view} · {isSameDay(cursor, new Date()) ? 'Today' : format(cursor, 'd MMM')}
        </p>
      )}
    </div>
  )
}
