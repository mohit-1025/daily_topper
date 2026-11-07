import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Eye,
  History,
  ListChecks,
  Loader2,
  Play,
  RotateCcw,
  Target,
  Trophy,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, Progress } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizRunner, QuizResult } from '@/features/quizzes/QuizRunner'
import { useAppStore } from '@/store/useAppStore'
import { aiService } from '@/services/aiService'
import { clamp, cn, formatClock, prettyDate } from '@/lib/utils'
import { CalendarDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import type { AIReport, Difficulty, Question, QuizAttempt } from '@/types'

interface ActiveQuiz {
  title: string
  questions: Question[]
  subjectIds: string[]
  topicIds: string[]
  difficulty: Difficulty
  timerMode: 'none' | 'total' | 'per-question'
  timerSeconds: number
}

function scoreVariant(score: number) {
  return score >= 70 ? 'success' : score >= 40 ? 'warning' : 'destructive'
}

const choiceClass =
  'flex min-h-11 items-center justify-center gap-2 rounded-[5px_11px_6px_9px] border-2 px-3 text-base font-semibold transition-[background-color,box-shadow] duration-150'

export function QuizzesPage() {
  const { t } = useTranslation()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const attempts = useAppStore((state) => state.attempts)
  const settings = useAppStore((state) => state.settings)
  const submitAttempt = useAppStore((state) => state.submitAttempt)
  const prioritiseTopics = useAppStore((state) => state.prioritiseTopics)
  const pushToast = useAppStore((state) => state.pushToast)

  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('create')
  const [subjectIds, setSubjectIds] = useState<string[]>(() => subjects.map((subject) => subject.id))
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [countChoice, setCountChoice] = useState('10')
  const [customCount, setCustomCount] = useState('12')
  const [difficulty, setDifficulty] = useState<Difficulty>('adaptive')
  const [timerMode, setTimerMode] = useState<'none' | 'total' | 'per-question'>('none')
  const [timerMinutes, setTimerMinutes] = useState('10')
  const [perQuestionSeconds, setPerQuestionSeconds] = useState('45')
  const [generating, setGenerating] = useState(false)
  const [active, setActive] = useState<ActiveQuiz | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(() => {
    const id = searchParams.get('attempt')
    return id ? attempts.find((item) => item.id === id) ?? null : null
  })
  const [report, setReport] = useState<AIReport | undefined>(() => attempt?.report)
  const [reportLoading, setReportLoading] = useState(false)

  const availableTopics = useMemo(
    () => topics.filter((topic) => subjectIds.includes(topic.subjectId)),
    [topics, subjectIds],
  )
  const chosenTopics = selectedTopicIds.length
    ? availableTopics.filter((topic) => selectedTopicIds.includes(topic.id))
    : availableTopics
  const count = countChoice === 'custom' ? clamp(Number(customCount) || 10, 1, 50) : Number(countChoice)
  const timerSeconds =
    timerMode === 'total' ? Number(timerMinutes) * 60 : timerMode === 'per-question' ? Number(perQuestionSeconds) : 0

  useEffect(() => {
    const available = new Set(availableTopics.map((topic) => topic.id))
    setSelectedTopicIds((current) => current.filter((id) => available.has(id)))
  }, [availableTopics])

  useEffect(() => {
    if (!attempt) {
      setReport(undefined)
      setReportLoading(false)
      return undefined
    }
    if (attempt.report) {
      setReport(attempt.report)
      return undefined
    }
    let cancelled = false
    setReport(undefined)
    setReportLoading(true)
    aiService
      .generateImprovementReport({
        attempt,
        language: settings.language,
        subjectNames: attempt.subjectIds
          .map((id) => subjects.find((subject) => subject.id === id)?.name)
          .filter((name): name is string => Boolean(name)),
      })
      .then((result) => {
        if (!cancelled) setReport(result)
      })
      .catch(() => {
        if (!cancelled) {
          pushToast('Report unavailable', 'You can still review every answer below.', 'warning')
        }
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  const toggleSubject = (id: string) => {
    setSubjectIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const generate = async () => {
    if (!subjectIds.length) {
      pushToast(t('quizzes.needSubjects'), undefined, 'warning')
      return
    }
    if (!chosenTopics.length) {
      pushToast(t('quizzes.needTopics'), undefined, 'warning')
      return
    }
    setGenerating(true)
    try {
      const chosenSubjects = subjects.filter((subject) => subjectIds.includes(subject.id))
      const result = await aiService.generateQuiz({
        subjects: chosenSubjects,
        topics: chosenTopics,
        count,
        difficulty,
        language: settings.language,
      })
      if (!result.questions.length) throw new Error('No questions generated')
      setActive({
        title: `${chosenSubjects.map((subject) => subject.name).join(' + ')} — Quiz`,
        questions: result.questions,
        subjectIds,
        topicIds: chosenTopics.map((topic) => topic.id),
        difficulty,
        timerMode,
        timerSeconds,
      })
    } catch {
      pushToast('Could not generate the quiz', 'Please try again in a moment.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const openAttempt = (item: QuizAttempt) => {
    setSearchParams({ attempt: item.id }, { replace: true })
    setAttempt(item)
  }

  const closeAttempt = () => {
    setAttempt(null)
    setSearchParams({}, { replace: true })
  }

  const startRetry = (source: QuizAttempt) => {
    const wrong = source.questions.filter((question) => source.answers[question.id] !== question.answerIndex)
    if (!wrong.length) return
    setActive({
      title: `${source.title} — Retry`,
      questions: wrong,
      subjectIds: source.subjectIds,
      topicIds: [...new Set(wrong.map((question) => question.topicId))],
      difficulty: 'adaptive',
      timerMode: 'none',
      timerSeconds: 0,
    })
    setAttempt(null)
    setSearchParams({}, { replace: true })
  }

  const weakTopicIds = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>()
    attempts.forEach((item) =>
      item.perTopic.forEach((entry) => {
        const current = map.get(entry.topicId) ?? { correct: 0, total: 0 }
        current.correct += entry.correct
        current.total += entry.total
        map.set(entry.topicId, current)
      }),
    )
    return [...map.entries()]
      .filter(([, value]) => value.total > 0 && value.correct / value.total < 0.7)
      .map(([id]) => id)
  }, [attempts])

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + item.scorePercent, 0) / attempts.length)
    : 0
  const bestScore = attempts.reduce((best, item) => Math.max(best, item.scorePercent), 0)

  if (!subjects.length) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('quizzes.title')} subtitle={t('quizzes.subtitle')} />
        <div className="border-y-2 border-dashed border-border py-10">
          <EmptyState
            icon={CalendarDoodle}
            title="Add a subject first"
            description="Quizzes are built from the topics inside your subjects. Add one to get started."
            action={
              <Button asChild>
                <Link to="/subjects?add=1">
                  <BookOpen className="size-4" /> Add subject
                </Link>
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (active) {
    return (
      <div className="paper-card flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden">
        <QuizRunner
          questions={active.questions}
          title={active.title}
          subjectIds={active.subjectIds}
          topicIds={active.topicIds}
          difficulty={active.difficulty}
          timerMode={active.timerMode}
          timerSeconds={active.timerSeconds}
          onExit={() => setActive(null)}
          onSubmit={(submitted) => {
            submitAttempt(submitted)
            setActive(null)
            setAttempt(submitted)
          }}
        />
      </div>
    )
  }

  if (attempt) {
    return (
      <div className="paper-card flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden">
        <QuizResult
          attempt={attempt}
          report={report}
          reportLoading={reportLoading}
          onDone={closeAttempt}
          onRetryWrong={() => startRetry(attempt)}
          showAddWeak
          doneLabel={t('quizzes.tryAgain')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('quizzes.title')}
        subtitle={t('quizzes.subtitle')}
        eyebrow={attempts.length ? `${attempts.length} ${t('nav.quizzes').toLowerCase()} · avg ${avgScore}%` : undefined}
        actions={
          <>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <Trophy className="size-3.5" /> Avg. {avgScore}%
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to="/progress">
                <Target className="size-4" /> View progress
              </Link>
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="create">
            <PencilDoodle className="mr-1.5 size-4" /> {t('quizzes.setup')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1.5 size-4" /> {t('quizzes.history')}
            {attempts.length > 0 && (
              <span className="ml-1.5 border-2 border-foreground px-1.5 text-xs font-bold">{attempts.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="paper-card p-4 sm:p-6">
              <section>
                <h3 className="font-display text-2xl font-bold">
                  1. {t('quizzes.selectSubjects')}
                </h3>
                <p className="text-base text-muted-foreground">Pick one or more subjects for a mixed paper.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {subjects.map((subject) => {
                    const selected = subjectIds.includes(subject.id)
                    const countForSubject = topics.filter((topic) => topic.subjectId === subject.id).length
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleSubject(subject.id)}
                        aria-pressed={selected}
                        className={cn(
                          choiceClass,
                          'justify-start p-2.5 text-left',
                          selected
                            ? 'border-foreground bg-accent/55 shadow-[2px_2px_0_hsl(var(--foreground)/0.3)]'
                            : 'border-border bg-card hover:border-foreground/50',
                        )}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-[2px_6px_3px_5px] border-2 border-foreground text-xs font-bold">
                          {subject.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{subject.name}</span>
                          <span className="block text-sm text-muted-foreground">
                            {countForSubject} {t('common.topics').toLowerCase()}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-[1px_4px_2px_3px] border-2',
                            selected ? 'border-foreground bg-foreground text-primary-foreground' : 'border-border text-transparent',
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="mt-5 border-t-2 border-dashed border-border pt-4">
                <h3 className="font-display text-2xl font-bold">2. {t('quizzes.selectTopics')}</h3>
                <p className="text-base text-muted-foreground">Leave everything unselected to quiz across all topics.</p>
                <div className="mt-3">
                  {availableTopics.length === 0 ? (
                    <p className="border-y-2 border-dashed border-border py-4 text-center text-base text-muted-foreground">
                      {t('quizzes.noTopics')}
                    </p>
                  ) : (
                    <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTopicIds([])}
                        className={cn(
                          'flex min-h-9 items-center gap-1.5 rounded-[4px_9px_5px_8px] border-2 px-2.5 text-sm font-semibold transition-colors',
                          selectedTopicIds.length === 0
                            ? 'border-foreground bg-foreground text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-foreground/50',
                        )}
                      >
                        <ListChecks className="size-3.5" /> {t('quizzes.allTopics')}
                      </button>
                      {availableTopics.map((topic) => {
                        const selected = selectedTopicIds.includes(topic.id)
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => toggleTopic(topic.id)}
                            className={cn(
                              'flex min-h-9 items-center gap-1.5 rounded-[4px_9px_5px_8px] border-2 px-2.5 text-sm font-medium transition-colors',
                              selected
                                ? 'border-foreground bg-accent/55'
                                : 'border-border bg-card text-muted-foreground hover:border-foreground/50',
                            )}
                          >
                            <span
                              className={cn(
                                'size-2 rounded-[1px] border border-foreground',
                                selected ? 'bg-foreground' : 'bg-transparent',
                              )}
                            />
                            {topic.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {chosenTopics.length} of {availableTopics.length} topics selected
                  </p>
                </div>
              </section>

              <section className="mt-5 border-t-2 border-dashed border-border pt-4">
                <h3 className="font-display text-2xl font-bold">3. {t('quizzes.timerMode')}</h3>
                <p className="text-base text-muted-foreground">Answer freely, race a clock, or go question by question.</p>
                <div className="mt-3 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { value: 'none', label: t('quizzes.noTimer') },
                      { value: 'total', label: t('quizzes.totalTime') },
                      { value: 'per-question', label: t('quizzes.perQuestion') },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimerMode(option.value as typeof timerMode)}
                        aria-pressed={timerMode === option.value}
                        className={cn(
                          choiceClass,
                          timerMode === option.value
                            ? 'border-foreground bg-accent/55 shadow-[2px_2px_0_hsl(var(--foreground)/0.3)]'
                            : 'border-border bg-card text-muted-foreground hover:border-foreground/50',
                        )}
                      >
                        <Clock className="size-4" /> {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {timerMode === 'total' && (
                      <div>
                        <p className="mb-1.5 text-base font-semibold text-muted-foreground">Total minutes</p>
                        <Select value={timerMinutes} onValueChange={setTimerMinutes}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['5', '10', '15', '20', '30', '45'].map((value) => (
                              <SelectItem key={value} value={value}>
                                {value} min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {timerMode === 'per-question' && (
                      <div>
                        <p className="mb-1.5 text-base font-semibold text-muted-foreground">Seconds per question</p>
                        <Select value={perQuestionSeconds} onValueChange={setPerQuestionSeconds}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {['20', '30', '45', '60', '90'].map((value) => (
                              <SelectItem key={value} value={value}>
                                {value}s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <p className="mb-1.5 text-base font-semibold text-muted-foreground">{t('quizzes.difficulty')}</p>
                      <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adaptive">Adaptive — mixed level</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="paper-card tape h-fit p-5 lg:sticky lg:top-24">
              <h3 className="font-display text-2xl font-bold">Quiz summary</h3>
              <p className="text-base text-muted-foreground">{t('quizzes.setupDesc')}</p>
              <div className="mt-4">
                <p className="mb-1.5 text-base font-semibold text-muted-foreground">{t('quizzes.count')}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {['5', '10', '15', '20', 'custom'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCountChoice(value)}
                      className={cn(
                        'min-h-9 rounded-[3px_7px_4px_6px] border-2 text-sm font-bold transition-colors',
                        value === 'custom' && 'col-span-2',
                        countChoice === value
                          ? 'border-foreground bg-foreground text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-foreground/50',
                      )}
                    >
                      {value === 'custom' ? t('quizzes.customCount') : value}
                    </button>
                  ))}
                </div>
                {countChoice === 'custom' && (
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={customCount}
                    onChange={(event) => setCustomCount(event.target.value)}
                    className="mt-2"
                    aria-label={t('quizzes.customCount')}
                  />
                )}
              </div>

              <dl className="mt-4 border-t-2 border-dashed border-border text-base">
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('common.subjects')}</dt>
                  <dd className="font-bold">{subjectIds.length}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('common.topics')}</dt>
                  <dd className="font-bold">{chosenTopics.length}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('common.questions')}</dt>
                  <dd className="font-bold">{count}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('quizzes.timer')}</dt>
                  <dd className="font-bold">
                    {timerMode === 'none' ? t('quizzes.noTimer') : timerMode === 'total' ? `${timerMinutes} min` : `${perQuestionSeconds}s`}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-border py-1.5">
                  <dt className="text-muted-foreground">{t('quizzes.difficulty')}</dt>
                  <dd className="font-bold capitalize">{difficulty}</dd>
                </div>
              </dl>

              <Button className="mt-4 w-full" onClick={generate} disabled={generating || !subjectIds.length || !chosenTopics.length}>
                {generating ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                {generating ? t('quizzes.generating') : t('quizzes.generate')}
              </Button>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Every paper is built from these topics, and your score feeds back into the plan.
              </p>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {attempts.length === 0 ? (
            <div className="border-y-2 border-dashed border-border py-10">
              <EmptyState
                icon={History}
                title={t('quizzes.historyEmpty')}
                description={t('quizzes.historyEmptyDesc')}
                action={
                  <Button onClick={() => setTab('create')}>
                    <PencilDoodle className="size-5" /> {t('quizzes.generate')}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 border-y-2 border-dashed border-border sm:grid-cols-4 sm:divide-x-2 sm:divide-dashed sm:divide-border">
                {[
                  { label: t('quizzes.historyTitle'), value: String(attempts.length) },
                  { label: t('progress.avgScore'), value: `${avgScore}%` },
                  { label: 'Best score', value: `${bestScore}%` },
                  { label: 'Weak topics', value: String(weakTopicIds.length) },
                ].map((stat) => (
                  <div key={stat.label} className="px-1 py-3 sm:px-4">
                    <p className="font-display text-3xl font-bold leading-none">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              {weakTopicIds.length > 0 && (
                <div className="flex flex-col gap-3 border-l-4 border-[var(--margin-line)] bg-accent/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">Weak topics found in your attempts</p>
                    <p className="text-base text-muted-foreground">
                      Queue the {weakTopicIds.length} lowest-accuracy topics for your next slots.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => prioritiseTopics(weakTopicIds)}>
                    <PencilDoodle className="size-5" /> {t('quizzes.addWeak')}
                  </Button>
                </div>
              )}

              <div className="paper-card p-4">
                {attempts.map((item) => {
                  const wrong = item.questions.filter(
                    (question) => item.answers[question.id] !== question.answerIndex,
                  ).length
                  const names = item.subjectIds
                    .map((id) => subjects.find((subject) => subject.id === id)?.name)
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 border-b-2 border-dashed border-border py-4 last:border-b-0 sm:flex-row sm:items-center"
                    >
                      <span
                        className={cn(
                          'flex size-14 shrink-0 items-center justify-center border-2 border-foreground font-display text-xl font-bold',
                          item.scorePercent >= 70 ? 'bg-accent' : item.scorePercent >= 40 ? 'bg-secondary' : 'bg-destructive/10 text-destructive',
                        )}
                      >
                        {item.scorePercent}%
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{item.title}</p>
                          <Badge variant={scoreVariant(item.scorePercent)}>
                            {item.correctCount}/{item.total}
                          </Badge>
                          {item.slotId && <Badge variant="outline">Slot check-in</Badge>}
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
                          <span>{names || t('common.subject')}</span>
                          <span>·</span>
                          <span>{prettyDate(item.submittedAt.slice(0, 10))}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" /> {formatClock(item.timeTakenSec)}
                          </span>
                          <span>·</span>
                          <span className="capitalize">{item.difficulty}</span>
                        </p>
                        <Progress value={item.scorePercent} className="mt-2" />
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => openAttempt(item)}>
                          <Eye className="size-4" /> {t('quizzes.viewResult')}
                        </Button>
                        {wrong > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => startRetry(item)}>
                            <RotateCcw className="size-4" /> {t('common.retry')}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-3 border-2 border-dashed border-foreground/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-base text-muted-foreground">
          <TickDoodle className="size-5" />
          {t('quizzes.slotsQuizDesc')}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/tasks">
            {t('nav.tasks')} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
