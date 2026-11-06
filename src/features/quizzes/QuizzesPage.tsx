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
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState, Progress } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizRunner, QuizResult } from '@/features/quizzes/QuizRunner'
import { useAppStore } from '@/store/useAppStore'
import { aiService } from '@/services/aiService'
import { clamp, cn, formatClock, prettyDate } from '@/lib/utils'
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
      <div className="space-y-5">
        <PageHeader title={t('quizzes.title')} subtitle={t('quizzes.subtitle')} />
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Add a subject first"
            description="Quizzes are generated from the topics inside your subjects. Add one to get started."
            action={
              <Button asChild>
                <Link to="/subjects?add=1">
                  <BookOpen className="size-4" /> Add subject
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  if (active) {
    return (
      <div className="flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
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
      <div className="flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
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
    <div className="space-y-5">
      <PageHeader
        title={t('quizzes.title')}
        subtitle={t('quizzes.subtitle')}
        eyebrow={attempts.length ? `${attempts.length} ${t('nav.quizzes').toLowerCase()} · avg ${avgScore}%` : undefined}
        actions={
          <>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <Trophy className="size-3" /> Avg. {avgScore}%
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to="/progress">
                <Target className="size-3.5" /> View analytics
              </Link>
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
          <TabsTrigger value="create">
            <Sparkles className="mr-1.5 size-4" /> {t('quizzes.setup')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1.5 size-4" /> {t('quizzes.history')}
            {attempts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                {attempts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      1
                    </span>
                    {t('quizzes.selectSubjects')}
                  </CardTitle>
                  <CardDescription>Pick one or more subjects for a mixed paper.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
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
                            'flex min-h-11 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                            selected
                              ? 'border-primary bg-primary-soft/70 shadow-sm'
                              : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40',
                          )}
                        >
                          <span
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                            style={{ backgroundColor: subject.color }}
                          >
                            {subject.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{subject.name}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {countForSubject} {t('common.topics').toLowerCase()}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'flex size-5 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-transparent',
                            )}
                          >
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      2
                    </span>
                    {t('quizzes.selectTopics')}
                  </CardTitle>
                  <CardDescription>Leave everything unselected to quiz across all topics.</CardDescription>
                </CardHeader>
                <CardContent>
                  {availableTopics.length === 0 ? (
                    <p className="rounded-xl bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                      {t('quizzes.noTopics')}
                    </p>
                  ) : (
                    <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTopicIds([])}
                        className={cn(
                          'flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors',
                          selectedTopicIds.length === 0
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted',
                        )}
                      >
                        <ListChecks className="size-3" /> {t('quizzes.allTopics')}
                      </button>
                      {availableTopics.map((topic) => {
                        const selected = selectedTopicIds.includes(topic.id)
                        const subject = subjects.find((item) => item.id === topic.subjectId)
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => toggleTopic(topic.id)}
                            className={cn(
                              'flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors',
                              selected
                                ? 'border-primary bg-primary-soft text-primary'
                                : 'border-border bg-card text-muted-foreground hover:bg-muted',
                            )}
                          >
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: subject?.color ?? '#6366f1' }}
                            />
                            {topic.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {chosenTopics.length} of {availableTopics.length} topics selected
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      3
                    </span>
                    {t('quizzes.timerMode')}
                  </CardTitle>
                  <CardDescription>Answer freely, race a clock, or go question-by-question.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                        className={cn(
                          'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors',
                          timerMode === option.value
                            ? 'border-primary bg-primary-soft text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                        )}
                      >
                        <Clock className="size-4" /> {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {timerMode === 'total' && (
                      <div>
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Total minutes</p>
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
                        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Seconds per question</p>
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
                      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('quizzes.difficulty')}</p>
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
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit lg:sticky lg:top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quiz summary</CardTitle>
                <CardDescription>{t('quizzes.setupDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('quizzes.count')}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['5', '10', '15', '20', 'custom'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCountChoice(value)}
                        className={cn(
                          'min-h-9 rounded-lg border text-xs font-bold transition-colors',
                          value === 'custom' && 'col-span-2',
                          countChoice === value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted',
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

                <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('common.subjects')}</span>
                    <span className="font-bold">{subjectIds.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('common.topics')}</span>
                    <span className="font-bold">{chosenTopics.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('common.questions')}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('quizzes.timer')}</span>
                    <span className="font-bold">
                      {timerMode === 'none'
                        ? t('quizzes.noTimer')
                        : timerMode === 'total'
                          ? `${timerMinutes} min`
                          : `${perQuestionSeconds}s`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('quizzes.difficulty')}</span>
                    <span className="font-bold capitalize">{difficulty}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={generate} disabled={generating || !subjectIds.length || !chosenTopics.length}>
                  {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {generating ? t('quizzes.generating') : t('quizzes.generate')}
                </Button>
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <Zap className="mt-0.5 size-3 shrink-0 text-violet-500" />
                  AI writes fresh questions from these topics, then uses your score to rebalance the plan.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {attempts.length === 0 ? (
            <Card>
              <EmptyState
                icon={History}
                title={t('quizzes.historyEmpty')}
                description={t('quizzes.historyEmptyDesc')}
                action={
                  <Button onClick={() => setTab('create')}>
                    <Sparkles className="size-4" /> {t('quizzes.generate')}
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: t('quizzes.historyTitle'), value: attempts.length, icon: ListChecks },
                  { label: t('progress.avgScore'), value: `${avgScore}%`, icon: Target },
                  { label: 'Best score', value: `${bestScore}%`, icon: Trophy },
                  { label: 'Weak topics', value: weakTopicIds.length, icon: Sparkles },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-3.5">
                      <stat.icon className="mb-1 size-4 text-primary" />
                      <p className="font-display text-xl font-extrabold">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {weakTopicIds.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Sparkles className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Weak topics found in your attempts</p>
                      <p className="text-xs text-muted-foreground">
                        Queue the {weakTopicIds.length} lowest-accuracy topics for your next slots.
                      </p>
                    </div>
                  </div>
                  <Button variant="soft" size="sm" onClick={() => prioritiseTopics(weakTopicIds)}>
                    <Sparkles className="size-3.5" /> {t('quizzes.addWeak')}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {attempts.map((item) => {
                  const wrong = item.questions.filter(
                    (question) => item.answers[question.id] !== question.answerIndex,
                  ).length
                  const names = item.subjectIds
                    .map((id) => subjects.find((subject) => subject.id === id)?.name)
                    .filter(Boolean)
                    .join(' · ')
                  return (
                    <Card key={item.id}>
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <span
                          className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white',
                            item.scorePercent >= 70
                              ? 'bg-success'
                              : item.scorePercent >= 40
                                ? 'bg-warning'
                                : 'bg-destructive',
                          )}
                        >
                          {item.scorePercent}%
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold">{item.title}</p>
                            <Badge variant={scoreVariant(item.scorePercent)}>
                              {item.correctCount}/{item.total}
                            </Badge>
                            {item.slotId && <Badge variant="outline">Slot check-in</Badge>}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span>{names || t('common.subject')}</span>
                            <span>·</span>
                            <span>{prettyDate(item.submittedAt.slice(0, 10))}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" /> {formatClock(item.timeTakenSec)}
                            </span>
                            <span>·</span>
                            <span className="capitalize">{item.difficulty}</span>
                          </p>
                          <Progress
                            value={item.scorePercent}
                            className="mt-2 h-1"
                            indicatorClassName={
                              item.scorePercent >= 70 ? 'bg-success' : item.scorePercent >= 40 ? 'bg-warning' : 'bg-destructive'
                            }
                          />
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          <Button variant="outline" size="sm" onClick={() => openAttempt(item)}>
                            <Eye className="size-3.5" /> {t('quizzes.viewResult')}
                          </Button>
                          {wrong > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => startRetry(item)}>
                              <RotateCcw className="size-3.5" /> {t('common.retry')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="border-dashed bg-transparent">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Play className="size-4 text-primary" />
            {t('quizzes.slotsQuizDesc')}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tasks">
              {t('nav.tasks')} <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
