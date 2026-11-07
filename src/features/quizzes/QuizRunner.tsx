import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Flag,
  Lightbulb,
  ListChecks,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/misc'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CircleCrossDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import { useAppStore } from '@/store/useAppStore'
import { cn, formatClock, percent, uid } from '@/lib/utils'
import type { AIReport, Difficulty, Question, QuizAttempt } from '@/types'

interface QuizRunnerProps {
  questions: Question[]
  title: string
  subjectIds: string[]
  topicIds: string[]
  difficulty: Difficulty
  timerMode: 'none' | 'total' | 'per-question'
  timerSeconds: number
  onExit: () => void
  onSubmit: (attempt: QuizAttempt) => void
  slotId?: string
}

export function buildAttempt(options: {
  questions: Question[]
  answers: Record<string, number>
  marked: string[]
  title: string
  subjectIds: string[]
  topicIds: string[]
  difficulty: Difficulty
  timerMode: 'none' | 'total' | 'per-question'
  timeTakenSec: number
  startedAt: number
  slotId?: string
}): QuizAttempt {
  const perTopicMap = new Map<string, { topicId: string; topicName: string; correct: number; total: number }>()
  let correctCount = 0
  options.questions.forEach((question) => {
    const entry = perTopicMap.get(question.topicId) ?? {
      topicId: question.topicId,
      topicName: question.topicName,
      correct: 0,
      total: 0,
    }
    entry.total += 1
    if (options.answers[question.id] === question.answerIndex) {
      entry.correct += 1
      correctCount += 1
    }
    perTopicMap.set(question.topicId, entry)
  })
  return {
    id: uid('attempt'),
    title: options.title,
    subjectIds: options.subjectIds,
    topicIds: options.topicIds,
    questions: options.questions,
    answers: options.answers,
    marked: options.marked,
    correctCount,
    total: options.questions.length,
    scorePercent: percent(correctCount, options.questions.length),
    startedAt: new Date(options.startedAt).toISOString(),
    submittedAt: new Date().toISOString(),
    timeTakenSec: options.timeTakenSec,
    difficulty: options.difficulty,
    timerMode: options.timerMode,
    perTopic: [...perTopicMap.values()],
    slotId: options.slotId,
  }
}

export function QuizRunner({
  questions,
  title,
  subjectIds,
  topicIds,
  difficulty,
  timerMode,
  timerSeconds,
  onExit,
  onSubmit,
  slotId,
}: QuizRunnerProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [marked, setMarked] = useState<string[]>([])
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [totalRemaining, setTotalRemaining] = useState(timerMode === 'total' ? timerSeconds : null)
  const [questionRemaining, setQuestionRemaining] = useState(timerMode === 'per-question' ? timerSeconds : null)
  const startedAt = useRef(Date.now())
  const submitted = useRef(false)

  const question = questions[index]
  const answeredCount = Object.keys(answers).length
  const progress = percent(answeredCount, questions.length)

  const submit = (auto = false) => {
    if (submitted.current) return
    submitted.current = true
    setAutoSubmitted(auto)
    const attempt = buildAttempt({
      questions,
      answers,
      marked,
      title,
      subjectIds,
      topicIds,
      difficulty,
      timerMode,
      timeTakenSec: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
      startedAt: startedAt.current,
      slotId,
    })
    onSubmit(attempt)
  }

  const submitRef = useRef(submit)
  submitRef.current = submit

  useEffect(() => {
    if (timerMode === 'none') return
    const interval = window.setInterval(() => {
      if (timerMode === 'total') {
        setTotalRemaining((value) => {
          if (value === null) return value
          if (value <= 1) {
            window.clearInterval(interval)
            submitRef.current(true)
            return 0
          }
          return value - 1
        })
      } else {
        setQuestionRemaining((value) => {
          if (value === null) return value
          if (value <= 1) {
            setIndex((current) => {
              if (current >= questions.length - 1) {
                window.clearInterval(interval)
                submitRef.current(true)
                return current
              }
              return current + 1
            })
            return timerSeconds
          }
          return value - 1
        })
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerMode, timerSeconds, questions.length])

  useEffect(() => {
    if (timerMode === 'per-question') setQuestionRemaining(timerSeconds)
  }, [index, timerMode, timerSeconds])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (confirmSubmit || confirmExit) return
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key >= '1' && event.key <= '4') {
        const optionIndex = Number(event.key) - 1
        if (optionIndex < question.options.length) {
          setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
        }
      }
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1))
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(questions.length - 1, current + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [question, questions.length, confirmSubmit, confirmExit])

  const timerValue = timerMode === 'total' ? totalRemaining : timerMode === 'per-question' ? questionRemaining : null
  const timerCritical = timerValue !== null && timerValue <= 30

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b-2 border-foreground px-4 pb-3 pt-2 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{title}</p>
            <p className="font-display text-xl font-bold">
              {t('quizzes.questionOf', { current: index + 1, total: questions.length })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {timerValue !== null && (
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-[3px_7px_4px_6px] border-2 px-2.5 py-1 text-base font-bold tabular-nums',
                  timerCritical ? 'border-destructive bg-destructive/10 text-destructive' : 'border-foreground',
                )}
                aria-live="polite"
              >
                <Clock className="size-4" /> {formatClock(timerValue)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setConfirmExit(true)}
              className="flex size-10 items-center justify-center rounded-[3px_7px_4px_6px] border-2 border-foreground text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t('quizzes.leave')}
            >
              <XCircle className="size-5" />
            </button>
          </div>
        </div>
        <Progress value={progress} className="mt-3" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
        <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_180px]">
          <div className="min-w-0 border-l-2 border-[var(--margin-line)] pl-4 sm:pl-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {question.difficulty}
              </Badge>
              <Badge variant="outline">{question.topicName}</Badge>
              {marked.includes(question.id) && (
                <Badge variant="warning">
                  <Flag className="size-3.5" /> Review
                </Badge>
              )}
            </div>
            <h3 className="mt-2 max-w-[60ch] font-display text-2xl font-bold leading-8">{question.question}</h3>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label={question.question}>
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[4px_10px_6px_9px] border-2 px-3 py-2.5 text-left text-base transition-[background-color,box-shadow] duration-150',
                      selected
                        ? 'border-foreground bg-accent/55 shadow-[2px_2px_0_hsl(var(--foreground)/0.3)]'
                        : 'border-border bg-card hover:border-foreground/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                        selected ? 'border-foreground bg-foreground text-primary-foreground' : 'border-border text-muted-foreground',
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className={cn('flex-1', selected && 'font-semibold')}>{option}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMarked((current) =>
                    current.includes(question.id)
                      ? current.filter((id) => id !== question.id)
                      : [...current, question.id],
                  )
                }
              >
                <Flag className={cn('size-4', marked.includes(question.id) && 'fill-accent text-foreground')} />
                {marked.includes(question.id) ? t('quizzes.unmarkReview') : t('quizzes.markReview')}
              </Button>
              {answers[question.id] !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setAnswers((current) => {
                      const next = { ...current }
                      delete next[question.id]
                      return next
                    })
                  }
                >
                  {t('quizzes.clearAnswer')}
                </Button>
              )}
              <span className="ml-auto hidden text-sm text-muted-foreground sm:block">{t('quizzes.keyboardHint')}</span>
            </div>
          </div>

          <aside className="border-t-2 border-dashed border-border pt-3 lg:border-l-2 lg:border-t-0 lg:pl-4 lg:pt-0">
            <p className="mb-2 font-display text-lg font-bold">{t('quizzes.navigator')}</p>
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-4">
              {questions.map((item, itemIndex) => {
                const answered = answers[item.id] !== undefined
                const isMarked = marked.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    className={cn(
                      'relative flex h-9 items-center justify-center rounded-[3px_7px_4px_6px] border-2 text-sm font-bold transition-colors',
                      itemIndex === index && 'ring-2 ring-[hsl(var(--ring))] ring-offset-1',
                      answered
                        ? 'border-foreground bg-foreground text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                    aria-label={`Question ${itemIndex + 1}${answered ? ' answered' : ''}`}
                  >
                    {itemIndex + 1}
                    {isMarked && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[var(--margin-line)]" />}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[1px] border border-foreground bg-foreground" /> Answered
              </p>
              <p className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[1px] border border-foreground bg-[var(--margin-line)]" /> Marked for review
              </p>
            </div>
            <Button className="mt-4 hidden w-full lg:flex" onClick={() => setConfirmSubmit(true)}>
              <ClipboardCheck className="size-4" /> {t('quizzes.submit')}
            </Button>
          </aside>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t-2 border-foreground px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button variant="outline" size="sm" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
          <ChevronLeft className="size-4" /> {t('quizzes.previous')}
        </Button>
        <p className="text-sm font-medium text-muted-foreground">
          {answeredCount}/{questions.length} answered
        </p>
        {index < questions.length - 1 ? (
          <Button size="sm" onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}>
            {t('quizzes.nextQuestion')} <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setConfirmSubmit(true)}>
            <ClipboardCheck className="size-4" /> {t('quizzes.submit')}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title={t('quizzes.submitTitle')}
        description={t('quizzes.submitDesc', { answered: answeredCount, total: questions.length })}
        confirmLabel={t('quizzes.submit')}
        onConfirm={() => {
          setConfirmSubmit(false)
          submit(false)
        }}
      />

      <ConfirmDialog
        open={confirmExit}
        onOpenChange={setConfirmExit}
        title={t('quizzes.exitTitle')}
        description={autoSubmitted ? t('quizzes.autoSubmitted') : t('quizzes.exitDesc')}
        confirmLabel={t('quizzes.leave')}
        destructive
        onConfirm={() => {
          setConfirmExit(false)
          onExit()
        }}
      />
    </div>
  )
}

export function QuizResult({
  attempt,
  report,
  reportLoading,
  onDone,
  onRetryWrong,
  showAddWeak = false,
  showReport = true,
  doneLabel,
}: {
  attempt: QuizAttempt
  report?: AIReport
  reportLoading?: boolean
  onDone: () => void
  onRetryWrong?: () => void
  showAddWeak?: boolean
  showReport?: boolean
  doneLabel?: string
}) {
  const { t } = useTranslation()
  const prioritiseTopics = useAppStore((state) => state.prioritiseTopics)
  const [reviewAll, setReviewAll] = useState(false)
  const wrongQuestions = attempt.questions.filter((question) => attempt.answers[question.id] !== question.answerIndex)
  const weakTopics = [...attempt.perTopic]
    .map((topic) => ({ ...topic, accuracy: percent(topic.correct, topic.total) }))
    .sort((a, b) => a.accuracy - b.accuracy)
  const scoreTone =
    attempt.scorePercent >= 70 ? 'text-success' : attempt.scorePercent >= 40 ? 'text-warning' : 'text-destructive'

  const reviewItems = useMemo(
    () => (reviewAll ? attempt.questions : wrongQuestions),
    [reviewAll, attempt.questions, wrongQuestions],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col items-start gap-5 border-b-2 border-foreground pb-5 sm:flex-row sm:items-end">
            <div className="shrink-0">
              <p className={cn('font-display text-6xl font-bold leading-none', scoreTone)}>{attempt.scorePercent}%</p>
              <p className="mt-1 text-base text-muted-foreground">
                {attempt.correctCount}/{attempt.total} {t('quizzes.correct')}
              </p>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={attempt.scorePercent >= 70 ? 'success' : attempt.scorePercent >= 40 ? 'warning' : 'destructive'}>
                  {t('quizzes.result')}
                </Badge>
                <Badge variant="outline">
                  <Clock className="size-3.5" /> {formatClock(attempt.timeTakenSec)}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {attempt.difficulty}
                </Badge>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold leading-8">
                {attempt.scorePercent >= 80
                  ? 'Excellent recall!'
                  : attempt.scorePercent >= 50
                    ? 'Solid effort — refine the gaps.'
                    : 'Diagnostic done. Let’s rebuild.'}
              </h2>
              <p className="mt-1 text-base text-muted-foreground">
                {attempt.title} · {t('quizzes.correct')} {attempt.correctCount} / {attempt.total}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={onDone}>
                  {doneLabel ?? t('common.done')} <ArrowRight className="size-3.5" />
                </Button>
                {onRetryWrong && wrongQuestions.length > 0 && (
                  <Button variant="outline" size="sm" onClick={onRetryWrong}>
                    <RotateCcw className="size-3.5" /> {t('quizzes.retryWrong')}
                  </Button>
                )}
                {onRetryWrong && wrongQuestions.length === 0 && (
                  <Badge variant="success">
                    <Trophy className="size-3.5" /> {t('quizzes.noWrong')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 font-display text-xl font-bold">
                <Target className="size-5" /> {t('quizzes.topicAccuracy')}
              </p>
              <div className="mt-3 space-y-3">
                {weakTopics.map((topic) => (
                  <div key={topic.topicId}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-base font-medium">{topic.topicName}</span>
                      <span className={cn('font-display text-2xl font-bold', topic.accuracy >= 70 ? 'text-success' : topic.accuracy >= 40 ? 'text-warning' : 'text-destructive')}>
                        {topic.accuracy}%
                      </span>
                    </div>
                    <Progress value={topic.accuracy} className="mt-1" />
                  </div>
                ))}
              </div>
              {showAddWeak && weakTopics.some((topic) => topic.accuracy < 70) && (
                <Button
                  variant="soft"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() =>
                    prioritiseTopics(
                      weakTopics.filter((topic) => topic.accuracy < 70).map((topic) => topic.topicId),
                    )
                  }
                >
                  <PencilDoodle className="size-5" /> {t('quizzes.addWeak')}
                </Button>
              )}
            </div>

            <div>
              <p className="flex items-center gap-2 font-display text-xl font-bold">
                <ListChecks className="size-5" /> Snapshot
              </p>
              <dl className="mt-2 border-t-2 border-dashed border-border text-base">
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('quizzes.correct')}</dt>
                  <dd className="font-bold text-success">{attempt.correctCount}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('quizzes.review')}</dt>
                  <dd className="font-bold text-destructive">{wrongQuestions.length}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('quizzes.timeTaken')}</dt>
                  <dd className="font-bold">{formatClock(attempt.timeTakenSec)}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">Marked</dt>
                  <dd className="font-bold">{attempt.marked.length}</dd>
                </div>
              </dl>
              <p className="mt-3 border-l-4 border-accent pl-2 text-base leading-8">
                {attempt.scorePercent >= 70
                  ? 'Keep this momentum — revise in 2 days.'
                  : attempt.scorePercent >= 40
                    ? 'Revisit the margin notes, then retry tomorrow.'
                    : 'Start with definitions, then retry the wrong set.'}
              </p>
            </div>
          </div>

          {showReport && (
            <div className="mt-6 border-t-2 border-foreground pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-xl font-bold">
                  <PencilDoodle className="size-5" /> {t('quizzes.aiReport')}
                </p>
                {reportLoading && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> {t('quizzes.generatingReport')}
                  </span>
                )}
              </div>
              {reportLoading && !report ? (
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse bg-muted" />
                  <div className="h-3 w-full animate-pulse bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse bg-muted" />
                </div>
              ) : report ? (
                <div className="mt-3 space-y-4">
                  <p className="max-w-[65ch] leading-8 text-muted-foreground">{report.summary}</p>
                  {report.solutions.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 font-bold">
                        <Lightbulb className="size-4" /> {t('quizzes.steps')}
                      </p>
                      <div className="space-y-3">
                        {report.solutions.slice(0, 3).map((solution) => (
                          <div key={solution.questionId} className="border-l-2 border-[var(--margin-line)] pl-3">
                            <p className="font-semibold">{solution.title}</p>
                            <ol className="mt-1 ml-4 list-decimal space-y-1 text-base leading-8 text-muted-foreground">
                              {solution.steps.map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 font-bold">{t('quizzes.tips')}</p>
                      <ul className="space-y-1 text-base leading-8 text-muted-foreground">
                        {report.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex gap-1.5">
                            <TickDoodle className="mt-2 size-4 shrink-0" /> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1.5 font-bold">{t('quizzes.nextSteps')}</p>
                      <ul className="space-y-1 text-base leading-8 text-muted-foreground">
                        {report.nextSteps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex gap-1.5">
                            <ArrowRight className="mt-2 size-4 shrink-0" /> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="border-l-4 border-accent pl-3 leading-8">{report.encouragement}</p>
                </div>
              ) : (
                <p className="mt-2 text-base text-muted-foreground">{t('quizzes.generatingReport')}</p>
              )}
            </div>
          )}

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-2 border-b-2 border-foreground pb-2">
              <p className="font-display text-xl font-bold">{t('quizzes.review')}</p>
              {wrongQuestions.length > 0 && wrongQuestions.length < attempt.questions.length && (
                <Button variant="ghost" size="sm" onClick={() => setReviewAll((value) => !value)}>
                  {reviewAll ? 'Show mistakes only' : 'Show all questions'}
                </Button>
              )}
            </div>
            <div>
              {reviewItems.map((question, questionIndex) => {
                const given = attempt.answers[question.id]
                const isCorrect = given === question.answerIndex
                return (
                  <div
                    key={question.id}
                    className={cn(
                      'flex gap-3 border-b-2 border-dashed border-border py-4',
                      !isCorrect && 'border-l-2 border-l-[var(--margin-line)] pl-3',
                    )}
                  >
                    <div className="flex w-10 shrink-0 flex-col items-center gap-1">
                      {isCorrect ? (
                        <TickDoodle className="size-7 text-success" />
                      ) : (
                        <CircleCrossDoodle className="size-7 text-destructive" />
                      )}
                      <span className="text-sm text-muted-foreground">{questionIndex + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="max-w-[65ch] font-semibold leading-8">{question.question}</p>
                      <div className="mt-1.5 space-y-1 text-base">
                        <p className={cn(isCorrect ? 'text-success' : 'text-destructive')}>
                          {t('quizzes.yourAnswer')}:{' '}
                          <span className={cn('font-semibold', !isCorrect && 'missed-strike')}>
                            {given !== undefined ? question.options[given] : '—'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-success">
                            {t('quizzes.correctAnswer')}:{' '}
                            <span className="font-semibold underline decoration-2 underline-offset-4">
                              {question.options[question.answerIndex]}
                            </span>
                          </p>
                        )}
                      </div>
                      <p className="mt-2 border-l-2 border-[var(--margin-line)] pl-2 text-base leading-8 text-muted-foreground">
                        <span className="font-semibold text-foreground">{t('quizzes.explanation')}: </span>
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t-2 border-foreground px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <Button variant="ghost" onClick={onDone}>
          <ArrowLeft className="size-4" /> {t('common.back')}
        </Button>
        <Button onClick={onDone}>{doneLabel ?? t('common.done')}</Button>
      </div>
    </div>
  )
}
