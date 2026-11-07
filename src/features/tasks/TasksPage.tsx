import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  SkipForward,
  Timer,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge, slotAccent } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/misc'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/misc'
import { QuizRunner, QuizResult } from '@/features/quizzes/QuizRunner'
import { useAppStore } from '@/store/useAppStore'
import { useTimerRemaining } from '@/hooks/useTimerRemaining'
import { aiService } from '@/services/aiService'
import { slotsForDate, studyMinutes } from '@/services/plannerService'
import { ensureNotificationPermission, playChime, showNotification } from '@/lib/feedback'
import { addMinutesToTime, cn, formatClock, formatDuration, longDate, todayISO } from '@/lib/utils'
import { CalendarDoodle, CircleCrossDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import type { Question, QuizAttempt, SlotStatus, StudySlot } from '@/types'

function TimerRing({ remaining, total, paused }: { remaining: number; total: number; paused: boolean }) {
  const progress = total ? Math.max(0, Math.min(1, remaining / total)) : 0
  const circumference = 2 * Math.PI * 42
  return (
    <div className="relative flex size-28 shrink-0 items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--rule-hsl))" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress * circumference} ${circumference}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="text-center">
        <p className="font-display text-2xl font-bold tabular-nums">{formatClock(remaining)}</p>
        <p className="text-sm text-muted-foreground">{paused ? 'Paused' : remaining === 0 ? 'Done' : 'Focus'}</p>
      </div>
    </div>
  )
}

function statusCopy(status: SlotStatus) {
  if (status === 'done') return 'Completed'
  if (status === 'skipped') return 'Skipped'
  if (status === 'missed') return 'Missed'
  if (status === 'running') return 'In focus'
  return 'Up next'
}

export function TasksPage() {
  const { t } = useTranslation()
  const slots = useAppStore((state) => state.slots)
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const uploads = useAppStore((state) => state.uploads)
  const generated = useAppStore((state) => state.generated)
  const settings = useAppStore((state) => state.settings)
  const timer = useAppStore((state) => state.timer)
  const attempts = useAppStore((state) => state.attempts)
  const startSlot = useAppStore((state) => state.startSlot)
  const pauseTimer = useAppStore((state) => state.pauseTimer)
  const resumeTimer = useAppStore((state) => state.resumeTimer)
  const finishTimer = useAppStore((state) => state.finishTimer)
  const stopTimer = useAppStore((state) => state.stopTimer)
  const skipSlot = useAppStore((state) => state.skipSlot)
  const submitAttempt = useAppStore((state) => state.submitAttempt)
  const regeneratePlan = useAppStore((state) => state.regeneratePlan)
  const processMissedSlots = useAppStore((state) => state.processMissedSlots)
  const pushToast = useAppStore((state) => state.pushToast)

  const today = todayISO()
  const todaySlots = slotsForDate(slots, today)
  const doneSlots = todaySlots.filter((slot) => slot.status === 'done')
  const remaining = useTimerRemaining(timer)
  const timedOutRef = useRef<string | null>(null)

  const [contentSlot, setContentSlot] = useState<StudySlot | null>(null)
  const [skipTarget, setSkipTarget] = useState<StudySlot | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [quizSlotId, setQuizSlotId] = useState<string | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<Question[] | null>(null)
  const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const [content, setContent] = useState<{ title: string; explainer: string; keyPoints: string[]; practice: string } | null>(null)

  useEffect(() => {
    processMissedSlots()
    const interval = window.setInterval(() => processMissedSlots(true), 60_000)
    return () => window.clearInterval(interval)
  }, [processMissedSlots])

  useEffect(() => {
    if (!timer || timer.paused || remaining > 0) return
    if (timer.remainingSec === 0) return
    if (timedOutRef.current === timer.slotId) return
    timedOutRef.current = timer.slotId
    finishTimer()
    if (settings.sound) playChime()
    if (settings.reminders) {
      showNotification(t('tasks.timeUp'), t('tasks.timeUpDesc'))
    }
    pushToast(t('tasks.timeUp'), t('tasks.timeUpDesc'), 'success')
    const slotId = timer.slotId
    window.setTimeout(() => setQuizSlotId(slotId), 600)
  }, [remaining, timer, finishTimer, settings.sound, settings.reminders, pushToast, t])

  const startFocus = (slot: StudySlot) => {
    if (timer && timer.slotId !== slot.id) stopTimer()
    timedOutRef.current = null
    startSlot(slot.id)
    void ensureNotificationPermission()
    pushToast('Focus started', `${slot.duration} minutes on ${subjects.find((s) => s.id === slot.subjectId)?.name ?? 'this topic'}.`, 'info')
  }

  useEffect(() => {
    if (!quizSlotId) {
      setQuizQuestions(null)
      setQuizAttempt(null)
      return
    }
    // Submitting finishes the slot, which changes `slots`; keep the result
    // on screen instead of regenerating a fresh quiz underneath it.
    if (quizAttempt) return
    const slot = slots.find((item) => item.id === quizSlotId)
    if (!slot) return
    const subject = subjects.find((item) => item.id === slot.subjectId)
    const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id))
    if (!subject || !slotTopics.length) {
      pushToast('No quiz topics', 'Add topics to this subject to take the check-in quiz.', 'warning')
      setQuizSlotId(null)
      return
    }
    setQuizLoading(true)
    setQuizAttempt(null)
    aiService
      .generateQuiz({
        subjects: [subject],
        topics: slotTopics,
        count: 5,
        difficulty: 'adaptive',
        language: settings.language,
      })
      .then((result) => setQuizQuestions(result.questions))
      .catch(() => pushToast('Could not build the quiz', 'Please try again in a moment.', 'error'))
      .finally(() => setQuizLoading(false))
  }, [quizSlotId, quizAttempt, slots, subjects, topics, settings.language, pushToast])

  const openContent = (slot: StudySlot) => {
    const subject = subjects.find((item) => item.id === slot.subjectId)
    if (!subject) return
    const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id)).map((topic) => topic.name)
    setContentSlot(slot)
    setContent(null)
    setContentLoading(true)
    aiService
      .generateSlotContent({
        subjectName: subject.name,
        topics: slotTopics,
        language: settings.language,
      })
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setContentLoading(false))
  }

  const doneCount = doneSlots.length
  const totalCount = todaySlots.length
  const focusMinutes = studyMinutes(todaySlots)
  const allDone = totalCount > 0 && todaySlots.every((slot) => ['done', 'skipped'].includes(slot.status))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={longDate(new Date(), settings.language)}
        title={t('tasks.title')}
        subtitle={t('tasks.subtitle')}
        actions={
          <>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <CalendarClock className="size-3.5" /> {t('tasks.progress', { done: doneCount, total: totalCount })}
            </Badge>
            <Button variant="outline" size="sm" onClick={regeneratePlan}>
              <RefreshCw className="size-4" /> {t('tasks.regenerate')}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 border-y-2 border-dashed border-border sm:grid-cols-4 sm:divide-x-2 sm:divide-dashed sm:divide-border">
        {[
          { label: t('tasks.progress', { done: doneCount, total: totalCount }), value: `${doneCount}/${totalCount}` },
          { label: t('dashboard.studyTime'), value: formatDuration(focusMinutes) },
          { label: t('plan.scheduled'), value: String(todaySlots.filter((slot) => slot.status === 'scheduled').length) },
          { label: t('slotStatus.missed'), value: String(todaySlots.filter((slot) => slot.status === 'missed').length) },
        ].map((stat, index) => (
          <div key={stat.label} className="px-1 py-3 sm:px-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn('font-display text-3xl font-bold leading-none', index === 3 && 'text-destructive')}>{stat.value}</p>
          </div>
        ))}
      </div>

      {allDone && (
        <div className="flex items-center gap-3 border-2 border-foreground bg-accent/55 px-4 py-3">
          <TickDoodle className="size-7 shrink-0" />
          <div>
            <p className="font-display text-xl font-bold">{t('tasks.allDoneTitle')}</p>
            <p className="text-base text-muted-foreground">{t('tasks.allDoneDesc')}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {todaySlots.length === 0 && (
          <div className="border-y-2 border-dashed border-border py-8">
            <EmptyState
              icon={CalendarDoodle}
              title={t('tasks.noSlotsTitle')}
              description={t('tasks.noSlotsDesc')}
              action={
                <Button onClick={regeneratePlan}>
                  <PencilDoodle className="size-5" /> {t('tasks.regenerate')}
                </Button>
              }
            />
          </div>
        )}

        {todaySlots.map((slot) => {
          const subject = subjects.find((item) => item.id === slot.subjectId)
          const slotTopics = topics.filter((topic) => slot.topicIds.includes(topic.id))
          const isTimerSlot = timer?.slotId === slot.id
          const isRunning = isTimerSlot && slot.status === 'running'
          const linkedAttempt = slot.quizAttemptId ? attempts.find((attempt) => attempt.id === slot.quizAttemptId) : undefined
          const actionable = ['scheduled', 'running'].includes(slot.status)
          return (
            <article
              key={slot.id}
              className={cn('paper-card border-l-4 p-4 sm:p-5', slotAccent(slot.status, slot.source), slot.status === 'missed' && 'slot-missed')}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[3px_8px_4px_7px] border-2 border-foreground font-display text-base font-bold">
                    {subject?.name.slice(0, 2).toUpperCase() ?? 'ST'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="slot-title truncate font-display text-xl font-bold">{subject?.name ?? 'Study'}</h2>
                      <StatusBadge status={slot.status} source={slot.source} />
                      {isRunning && (
                        <Badge variant="accent">
                          <PencilDoodle className="size-3.5" /> In focus
                        </Badge>
                      )}
                    </div>
                    <p className="slot-meta mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> {slot.start}–{addMinutesToTime(slot.start, slot.duration)}
                      </span>
                      <span>·</span>
                      <span>
                        {slot.duration} {t('common.minutes')}
                      </span>
                      <span>·</span>
                      <span>{statusCopy(slot.status)}</span>
                    </p>
                    {slotTopics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {slotTopics.map((topic) => (
                          <span key={topic.id} className="border-b-2 border-dashed border-border text-sm">
                            {topic.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {slot.status === 'skipped' && slot.skipReason && (
                      <p className="mt-2 border-l-2 border-[var(--margin-line)] pl-2 text-sm text-muted-foreground">
                        {slot.skipReason}
                      </p>
                    )}
                    {slot.status === 'done' && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-success">
                        <Check className="size-4" />
                        {linkedAttempt
                          ? `Check-in quiz: ${linkedAttempt.scorePercent}% (${linkedAttempt.correctCount}/${linkedAttempt.total})`
                          : 'Completed — topics marked covered.'}
                      </p>
                    )}
                    {slot.status === 'missed' && (
                      <p className="mt-2 text-sm text-destructive">Topics moved into upcoming slots.</p>
                    )}
                  </div>
                </div>

                {isRunning && timer && (
                  <div className="flex items-center gap-3 border-2 border-foreground bg-card p-2 sm:mr-2">
                    <TimerRing remaining={remaining} total={timer.totalSec} paused={timer.paused} />
                    <div className="space-y-1.5">
                      <Button
                        size="sm"
                        variant={timer.paused ? 'default' : 'outline'}
                        onClick={() => (timer.paused ? resumeTimer() : pauseTimer())}
                      >
                        {timer.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                        {timer.paused ? t('common.resume') : t('common.pause')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setQuizSlotId(slot.id)}>
                        <Check className="size-3.5" /> Quiz & finish
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                  {actionable && !isRunning && (
                    <Button size="sm" onClick={() => startFocus(slot)}>
                      <Play className="size-3.5" /> {t('tasks.start')}
                    </Button>
                  )}
                  {actionable && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openContent(slot)}>
                        <FileText className="size-3.5" /> {t('tasks.content')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSkipTarget(slot)}>
                        <SkipForward className="size-3.5" /> {t('tasks.skip')}
                      </Button>
                      <Button size="sm" variant="success" onClick={() => setQuizSlotId(slot.id)}>
                        <Check className="size-3.5" /> {t('tasks.done')}
                      </Button>
                    </>
                  )}
                  {!actionable && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/subjects/${slot.subjectId}`}>
                        <BookOpen className="size-4" /> {t('common.open')}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="flex flex-col gap-1 border-y-2 border-dashed border-border py-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <Timer className="size-4" /> {t('tasks.startHint')}
        </span>
        <span>{t('tasks.autoMissed')}</span>
      </div>

      <Dialog open={Boolean(contentSlot)} onOpenChange={(open) => !open && setContentSlot(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="default">
                <BookOpen className="size-3.5" /> {t('tasks.slotContent')}
              </Badge>
              {contentSlot && (
                <Badge variant="outline">
                  {contentSlot.start} · {contentSlot.duration} min
                </Badge>
              )}
            </div>
            <DialogTitle>
              {subjects.find((subject) => subject.id === contentSlot?.subjectId)?.name ?? t('common.subject')}
            </DialogTitle>
            <DialogDescription>
              {topics.filter((topic) => contentSlot?.topicIds.includes(topic.id)).map((topic) => topic.name).join(' · ')}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {contentLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : content ? (
              <>
                <div className="border-l-4 border-accent pl-3">
                  <p className="flex items-center gap-1.5 font-display text-lg font-bold">
                    <PencilDoodle className="size-5" /> {t('tasks.aiExplainer')}
                  </p>
                  <p className="mt-2 leading-8">{content.explainer}</p>
                  <ul className="mt-3 space-y-1.5">
                    {content.keyPoints.map((point) => (
                      <li key={point} className="flex gap-2 text-base leading-8 text-muted-foreground">
                        <Check className="mt-2 size-4 shrink-0" /> {point}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t-2 border-dashed border-border pt-2 text-base">
                    <Lightbulb className="mr-1 inline size-4" /> {content.practice}
                  </p>
                </div>
              </>
            ) : (
              <p className="border-y-2 border-dashed border-border py-3 text-base text-muted-foreground">
                The explainer is unavailable right now, but your uploads and notes are below.
              </p>
            )}

            {contentSlot && (
              <>
                <div>
                  <p className="mb-2 font-display text-lg font-bold">{t('tasks.yourUploads')}</p>
                  {uploads.filter((upload) => upload.subjectId === contentSlot.subjectId).length === 0 ? (
                    <div className="border-2 border-dashed border-border p-4 text-center">
                      <p className="text-base font-medium">{t('tasks.noContent')}</p>
                      <Button variant="soft" size="sm" className="mt-2" asChild>
                        <Link to={`/subjects/${contentSlot.subjectId}`}>{t('subjects.uploadCta')}</Link>
                      </Button>
                    </div>
                  ) : (
                    <ul>
                      {uploads
                        .filter((upload) => upload.subjectId === contentSlot.subjectId)
                        .map((upload) => (
                          <li key={upload.id} className="border-b-2 border-dashed border-border py-2">
                            <p className="text-base font-semibold">{upload.name}</p>
                            {upload.noteText && (
                              <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{upload.noteText}</p>
                            )}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 font-display text-lg font-bold">{t('tasks.aiNotes')}</p>
                  {generated.filter((item) => item.subjectId === contentSlot.subjectId).length === 0 ? (
                    <p className="border-y-2 border-dashed border-border py-3 text-base text-muted-foreground">
                      Generate notes from this subject to see them here.
                    </p>
                  ) : (
                    generated
                      .filter((item) => item.subjectId === contentSlot.subjectId)
                      .slice(0, 3)
                      .map((item) => (
                        <div key={item.id} className="mb-2 border-b-2 border-dashed border-border pb-2">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.body.replace(/[#*]/g, '')}</p>
                        </div>
                      ))
                  )}
                </div>
              </>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentSlot(null)}>
              {t('common.close')}
            </Button>
            {contentSlot && (
              <Button variant="soft" asChild>
                <Link to={`/subjects/${contentSlot.subjectId}`}>
                  {t('subjects.open')} <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(skipTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setSkipTarget(null)
            setSkipReason('')
          }
        }}
      >
        <DialogContent size="sm" className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-11 items-center justify-center border-2 border-foreground">
              <CircleCrossDoodle className="size-6 text-[var(--margin-line)]" />
            </div>
            <DialogTitle>{t('tasks.skipTitle')}</DialogTitle>
            <DialogDescription>{t('tasks.skipDesc')}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <label className="text-base font-semibold" htmlFor="skip-reason">
              {t('tasks.skipReason')}
            </label>
            <Textarea
              id="skip-reason"
              className="mt-1.5"
              value={skipReason}
              onChange={(event) => setSkipReason(event.target.value)}
              placeholder={t('tasks.skipReasonPlaceholder')}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (skipTarget) {
                  skipSlot(skipTarget.id, skipReason)
                  if (timer?.slotId === skipTarget.id) stopTimer()
                }
                setSkipTarget(null)
                setSkipReason('')
              }}
            >
              {t('tasks.confirmSkip')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(quizSlotId)}
        onOpenChange={(open) => {
          if (!open && !quizAttempt) {
            setQuizSlotId(null)
          }
        }}
      >
        <DialogContent hideClose className="h-[94dvh] gap-0 overflow-hidden p-0 sm:h-[88dvh] sm:max-w-3xl">
          <DialogTitle className="sr-only">{t('quizzes.slotsQuizTitle')}</DialogTitle>
          {quizLoading || !quizQuestions ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="font-semibold">{t('quizzes.generating')}</p>
              <p className="text-sm text-muted-foreground">{t('quizzes.slotsQuizDesc')}</p>
            </div>
          ) : quizAttempt ? (
            <QuizResult
              attempt={quizAttempt}
              showReport={false}
              doneLabel={t('common.back')}
              onDone={() => {
                setQuizSlotId(null)
                setQuizAttempt(null)
              }}
            />
          ) : (
            <QuizRunner
              questions={quizQuestions}
              title={`${subjects.find((subject) => subject.id === slots.find((slot) => slot.id === quizSlotId)?.subjectId)?.name ?? 'Slot'} — ${t('quizzes.slotsQuizTitle')}`}
              subjectIds={[slots.find((slot) => slot.id === quizSlotId)?.subjectId ?? '']}
              topicIds={slots.find((slot) => slot.id === quizSlotId)?.topicIds ?? []}
              difficulty="adaptive"
              timerMode="none"
              timerSeconds={0}
              slotId={quizSlotId ?? undefined}
              onExit={() => setQuizSlotId(null)}
              onSubmit={(attempt) => {
                submitAttempt(attempt, quizSlotId ?? undefined)
                setQuizAttempt(attempt)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 border-2 border-dashed border-foreground/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <PencilDoodle className="size-5" />
          {t('quizzes.slotsQuizDesc')}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/quizzes">
            <BookOpen className="size-4" /> {t('dashboard.takeQuiz')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
