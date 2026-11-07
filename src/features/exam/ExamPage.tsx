import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import {
  AlarmClock,
  Archive,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { CalendarDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Progress } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import { aiService } from '@/services/aiService'
import { extractUploadText } from '@/lib/extract'
import { examDaysLeft } from '@/services/plannerService'
import { cn, isoDaysAhead, longDate, percent, uid } from '@/lib/utils'
import type { Exam, Topic, Upload } from '@/types'

interface DraftExam {
  key: string
  subjectId: string
  date: string
  time: string
  syllabusText: string
}

function draftFromSubject(subjectId: string, topics: Topic[], offsetDays: number): DraftExam {
  return {
    key: uid('draft'),
    subjectId,
    date: isoDaysAhead(offsetDays),
    time: '10:00',
    syllabusText: topics
      .filter((topic) => topic.subjectId === subjectId)
      .slice(0, 5)
      .map((topic) => topic.name)
      .join(', '),
  }
}

export function ExamPage() {
  const { t } = useTranslation()
  const subjects = useAppStore((state) => state.subjects)
  const topics = useAppStore((state) => state.topics)
  const settings = useAppStore((state) => state.settings)
  const examMode = useAppStore((state) => state.examMode)
  const enterExamMode = useAppStore((state) => state.enterExamMode)
  const exitExamMode = useAppStore((state) => state.exitExamMode)
  const pushToast = useAppStore((state) => state.pushToast)

  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<DraftExam[]>(() =>
    subjects[0] ? [draftFromSubject(subjects[0].id, topics, 7)] : [],
  )
  const [scheduleText, setScheduleText] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [parsing, setParsing] = useState(false)
  const [syllabusRow, setSyllabusRow] = useState<string | null>(null)
  const [confirmEnter, setConfirmEnter] = useState(false)
  const [confirmExit, setConfirmExit] = useState(false)

  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const sortedExams = useMemo(
    () => [...examMode.exams].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [examMode.exams],
  )
  const today = format(new Date(), 'yyyy-MM-dd')
  const nextExam: Exam | undefined = sortedExams.find((exam) => exam.date >= today) ?? sortedExams[0]
  const nextSubject = nextExam ? subjectById.get(nextExam.subjectId) : undefined
  const daysLeft = nextExam ? Math.max(0, examDaysLeft(nextExam.date)) : 0

  const nextSyllabus = useMemo(() => {
    if (!nextExam) return { total: 0, covered: 0 }
    if (nextExam.syllabusTopics.length) {
      const names = new Set(nextExam.syllabusTopics.map((name) => name.toLowerCase()))
      const matched = topics.filter(
        (topic) => topic.subjectId === nextExam.subjectId && names.has(topic.name.toLowerCase()),
      )
      return {
        total: Math.max(matched.length, nextExam.syllabusTopics.length),
        covered: matched.filter((topic) => topic.status === 'covered').length,
      }
    }
    const subjectTopics = topics.filter((topic) => topic.subjectId === nextExam.subjectId)
    return {
      total: subjectTopics.length,
      covered: subjectTopics.filter((topic) => topic.status === 'covered').length,
    }
  }, [nextExam, topics])

  const validRows = rows.length > 0 && rows.every((row) => row.subjectId && row.date)

  const updateRow = (key: string, patch: Partial<DraftExam>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    const fallback = subjects[0]
    if (!fallback) return
    setRows((current) => [
      ...current,
      {
        key: uid('draft'),
        subjectId: fallback.id,
        date: isoDaysAhead(14 + current.length * 3),
        time: '10:00',
        syllabusText: topics
          .filter((topic) => topic.subjectId === fallback.id)
          .slice(0, 5)
          .map((topic) => topic.name)
          .join(', '),
      },
    ])
  }

  const removeRow = (key: string) => {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  const loadSample = () => {
    const picks = subjects.slice(0, 4)
    if (!picks.length) return
    setRows(picks.map((subject, index) => draftFromSubject(subject.id, topics, 12 + index * 4)))
    pushToast('Sample schedule loaded', 'Edit any row, then confirm to enter Exam Mode.', 'info')
  }

  const handleFile = async (file: File) => {
    setUploadName(file.name)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const kind: Upload['kind'] =
      file.type.includes('pdf') || ext === 'pdf'
        ? 'pdf'
        : file.type.startsWith('image/')
          ? 'image'
          : 'note'
    if (kind === 'image') {
      pushToast(
        'Image received',
        'Offline OCR is unavailable — paste the schedule text below and press Read the schedule.',
        'info',
      )
      return
    }
    setParsing(true)
    try {
      const text = await extractUploadText(file, kind, settings.language)
      if (!text?.trim()) throw new Error('empty')
      setScheduleText(text.slice(0, 4000))
      pushToast('Schedule text extracted', 'Review it, then press Read the schedule.', 'success')
    } catch {
      pushToast('Could not read this file', 'Paste the schedule text below instead.', 'warning')
    } finally {
      setParsing(false)
    }
  }

  const parseSchedule = async () => {
    if (scheduleText.trim().length < 8) {
      pushToast('Add schedule text first', 'Paste dates and subject names to parse.', 'warning')
      return
    }
    setParsing(true)
    try {
      const result = await aiService.parseExamSchedule({ text: scheduleText, language: settings.language })
      if (!result.exams.length) throw new Error('no exams')
      setRows(
        result.exams.map((exam) => {
          const name = exam.subjectName.toLowerCase()
          const subject =
            subjects.find((item) => item.name.toLowerCase() === name) ??
            subjects.find(
              (item) => item.name.toLowerCase().includes(name) || name.includes(item.name.toLowerCase()),
            ) ??
            subjects[0]
          return {
            key: uid('draft'),
            subjectId: subject?.id ?? '',
            date: exam.date,
            time: exam.time,
            syllabusText: subject
              ? topics
                  .filter((topic) => topic.subjectId === subject.id)
                  .slice(0, 5)
                  .map((topic) => topic.name)
                  .join(', ')
              : '',
          }
        }),
      )
      pushToast('Schedule read', 'Check every row before entering Exam Mode.', 'success')
    } catch {
      pushToast('Could not read the schedule', 'Add the rows manually below.', 'error')
    } finally {
      setParsing(false)
    }
  }

  const suggestSyllabus = async (row: DraftExam) => {
    const subject = subjectById.get(row.subjectId)
    setSyllabusRow(row.key)
    try {
      const result = await aiService.parseSyllabus({
        subjectName: subject?.name ?? 'Subject',
        text: row.syllabusText,
        language: settings.language,
      })
      updateRow(row.key, { syllabusText: result.topics.map((topic) => topic.name).join(', ') })
      pushToast('Syllabus organised', `${result.topics.length} topics ready for planning.`, 'success')
    } catch {
      pushToast('Could not organise the syllabus', 'Keep the comma-separated list as it is.', 'warning')
    } finally {
      setSyllabusRow(null)
    }
  }

  const doEnter = () => {
    const exams: Exam[] = rows.map((row) => ({
      id: uid('exam'),
      subjectId: row.subjectId,
      date: row.date,
      time: row.time || '10:00',
      syllabusTopics: row.syllabusText
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
    }))
    try {
      enterExamMode(exams)
      setConfirmEnter(false)
    } catch (error) {
      pushToast(
        'Cannot enter Exam Mode',
        error instanceof Error ? error.message : 'Check every row and try again.',
        'error',
      )
    }
  }

  const archive = [...examMode.archive].reverse()

  const rules = [t('exam.rule1'), t('exam.rule2'), t('exam.rule3'), t('exam.rule4'), t('exam.rule5')]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={longDate(new Date(), settings.language)}
        title={t('exam.title')}
        subtitle={t('exam.subtitle')}
        actions={
          examMode.active ? (
            <>
              <Badge variant="success">
                <ShieldCheck className="size-3" /> {t('exam.activeTitle')}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to="/plan">
                  <CalendarDays className="size-3.5" /> {t('nav.plan')}
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmExit(true)}>
                <X className="size-3.5" /> {t('exam.exit')}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={loadSample} disabled={!subjects.length}>
              <Sparkles className="size-3.5" /> {t('exam.loadSample')}
            </Button>
          )
        }
      />

      {examMode.active ? (
        <>
          <section className="border-2 border-foreground bg-[hsl(var(--highlighter-hsl)/0.42)] px-4 py-5 shadow-[4px_4px_0_hsl(var(--foreground)/0.2)] sm:px-6">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <AlarmClock className="size-4" /> {t('exam.nextExam')}
                </p>
                <h2 className="mt-1 font-display text-3xl leading-tight">
                  {nextSubject?.name ?? t('common.subject')}
                </h2>
                {nextExam && (
                  <p className="mt-1 text-base text-muted-foreground">
                    {format(parseISO(nextExam.date), 'EEEE, d MMMM yyyy')} · {nextExam.time}
                  </p>
                )}
                <div className="mt-4 max-w-md">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-semibold">Syllabus coverage</span>
                    <span className="font-display text-2xl leading-none">
                      {percent(nextSyllabus.covered, Math.max(1, nextSyllabus.total))}%
                    </span>
                  </div>
                  <Progress
                    value={percent(nextSyllabus.covered, Math.max(1, nextSyllabus.total))}
                    className="mt-1.5 h-4"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {nextSyllabus.covered} of {nextSyllabus.total} topics covered
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 border-2 border-foreground bg-[var(--paper)] px-5 py-3 sm:flex-col sm:items-center sm:gap-0">
                <p className="font-display text-6xl leading-none">{daysLeft}</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {daysLeft === 0 ? t('exam.examDay') : t('exam.countdown')}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl">{t('exam.scheduleTitle')}</h2>
                <span className="text-sm text-muted-foreground">{sortedExams.length} exams</span>
              </div>
              <div className="border-t-2 border-dashed border-border">
                {sortedExams.map((exam, index) => {
                  const subject = subjectById.get(exam.subjectId)
                  const left = examDaysLeft(exam.date)
                  return (
                    <div
                      key={exam.id}
                      className="flex flex-col gap-2 border-b-2 border-dashed border-border py-3 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex w-14 shrink-0 flex-col items-center border-2 border-foreground px-1 py-1 leading-tight">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {format(parseISO(exam.date), 'MMM')}
                          </span>
                          <span className="font-display text-2xl">{format(parseISO(exam.date), 'd')}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-bold">{subject?.name ?? t('common.subject')}</p>
                            <Badge variant={left <= 3 ? 'destructive' : left <= 7 ? 'warning' : 'outline'}>
                              {left < 0 ? 'Passed' : left === 0 ? t('exam.examDay') : `${left} ${t('exam.countdown')}`}
                            </Badge>
                            {index === 0 && <Badge variant="accent">Next paper</Badge>}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" /> {exam.time}
                            </span>
                            <span>·</span>
                            <span>{exam.syllabusTopics.length} syllabus topics</span>
                          </p>
                          {exam.syllabusTopics.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {exam.syllabusTopics.slice(0, 4).map((name) => (
                                <span
                                  key={name}
                                  className="border-b-2 border-[var(--rule)] px-1 text-sm text-muted-foreground"
                                >
                                  {name}
                                </span>
                              ))}
                              {exam.syllabusTopics.length > 4 && (
                                <span className="text-sm font-semibold text-muted-foreground">
                                  +{exam.syllabusTopics.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/subjects/${exam.subjectId}`}>
                          <BookOpen className="size-3.5" /> {t('common.open')}
                        </Link>
                      </Button>
                    </div>
                  )
                })}
                {sortedExams.length === 0 && (
                  <p className="border-b-2 border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                    {t('exam.noSyllabus')}
                  </p>
                )}
              </div>
            </section>

            <aside className="space-y-5">
              <Card className="tape">
                <CardContent className="p-5">
                  <h2 className="flex items-center gap-2 font-display text-xl">
                    <PencilDoodle className="size-5" /> {t('exam.rulesTitle')}
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {rules.map((rule, index) => (
                      <li key={index} className="flex gap-2 text-sm leading-7 text-muted-foreground">
                        <TickDoodle className="mt-0.5 size-4 shrink-0" /> {rule}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-l-2 border-[var(--margin-line)] pl-2 text-sm leading-7 text-muted-foreground">
                    {t('exam.autoEnd')}
                  </p>
                </CardContent>
              </Card>

              <section>
                <h2 className="font-display text-xl">Syllabus focus</h2>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  Topics the planner is keeping in view for {nextSubject?.name ?? 'your exam'}.
                </p>
                {nextSyllabus.total === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{t('exam.noSyllabus')}</p>
                ) : (
                  <div className="mt-3">
                    <Progress value={percent(nextSyllabus.covered, nextSyllabus.total)} className="h-4" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {nextSyllabus.covered} of {nextSyllabus.total} syllabus topics covered.
                    </p>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-4 border-l-4 border-[var(--margin-line)] bg-[hsl(var(--highlighter-hsl)/0.3)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CalendarDoodle className="mt-1 size-8 shrink-0" />
              <div>
                <h2 className="font-display text-2xl text-balance">{t('exam.inactiveTitle')}</h2>
                <p className="mt-1 max-w-[60ch] text-base leading-8 text-muted-foreground">
                  {t('exam.inactiveDesc')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={loadSample} disabled={!subjects.length}>
                <Sparkles className="size-3.5" /> {t('exam.loadSample')}
              </Button>
              <Button size="sm" onClick={() => fileRef.current?.click()} disabled={!subjects.length}>
                <UploadCloud className="size-3.5" /> {t('exam.uploadSchedule')}
              </Button>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card className="tape">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <h2 className="font-display text-2xl">{t('exam.uploadSchedule')}</h2>
                    <p className="mt-1 text-base leading-8 text-muted-foreground">
                      Add a PDF timetable, or paste the text and let it be read row by row.
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handleFile(file)
                      event.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-1.5 border-2 border-dashed border-foreground/40 px-4 py-6 text-center transition-colors hover:border-foreground hover:bg-[hsl(var(--highlighter-hsl)/0.25)]"
                  >
                    {parsing ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <UploadCloud className="size-7" />
                    )}
                    <span className="text-base font-semibold">
                      {parsing ? t('exam.parsing') : 'Click to upload a schedule'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {uploadName || 'PDF, image or plain text · readable text only'}
                    </span>
                  </button>
                  <div>
                    <Label htmlFor="schedule-text" className="mb-1 block">
                      Or paste schedule text
                    </Label>
                    <Textarea
                      id="schedule-text"
                      value={scheduleText}
                      onChange={(event) => setScheduleText(event.target.value)}
                      placeholder={'Physics — 2026-11-20 at 10:00\nChemistry — 2026-11-24 at 10:00'}
                      className="min-h-24"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={parseSchedule} disabled={parsing}>
                      {parsing ? <Loader2 className="size-3.5 animate-spin" /> : <PencilDoodle className="size-4" />}
                      {parsing ? t('exam.parsing') : t('exam.parse')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={loadSample} disabled={!subjects.length}>
                      {t('exam.loadSample')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl">{t('exam.preview')}</h2>
                      <p className="mt-1 text-base text-muted-foreground">{t('exam.previewDesc')}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{rows.length} rows</span>
                  </div>
                  <div className="space-y-4">
                    {rows.map((row, index) => {
                      const subject = subjectById.get(row.subjectId)
                      return (
                        <div key={row.key} className="border-b-2 border-dashed border-border pb-4 last:pb-0">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="flex items-center gap-2 text-base font-bold">
                              <span className="flex size-6 items-center justify-center border-2 border-foreground text-sm">
                                {index + 1}
                              </span>
                              {subject?.name ?? 'Exam'}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeRow(row.key)}
                              aria-label={t('exam.removeRow')}
                            >
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <Label className="mb-1 block text-sm">{t('exam.subject')}</Label>
                              <Select
                                value={row.subjectId}
                                onValueChange={(value) => updateRow(row.key, { subjectId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('exam.subject')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {subjects.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      {item.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm">{t('exam.date')}</Label>
                              <Input
                                type="date"
                                value={row.date}
                                onChange={(event) => updateRow(row.key, { date: event.target.value })}
                              />
                            </div>
                            <div>
                              <Label className="mb-1 block text-sm">{t('exam.time')}</Label>
                              <Input
                                type="time"
                                value={row.time}
                                onChange={(event) => updateRow(row.key, { time: event.target.value })}
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <Label className="mb-1 block text-sm">{t('exam.syllabus')}</Label>
                            <div className="flex gap-1.5">
                              <Input
                                value={row.syllabusText}
                                onChange={(event) => updateRow(row.key, { syllabusText: event.target.value })}
                                placeholder="Laws of Motion, Work Energy, Thermodynamics"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => void suggestSyllabus(row)}
                                disabled={syllabusRow === row.key}
                                aria-label="Organise syllabus"
                                title="Organise syllabus"
                              >
                                {syllabusRow === row.key ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Sparkles className="size-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <Button variant="outline" size="sm" onClick={addRow} className="w-full">
                    <Plus className="size-3.5" /> {t('exam.addRow')}
                  </Button>

                  <div className="flex flex-col gap-2 border-t-2 border-dashed border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={cn('text-sm leading-7', validRows ? 'text-muted-foreground' : 'text-destructive')}>
                      {validRows ? t('exam.autoEnd') : t('exam.subjectMismatch')}
                    </p>
                    <Button onClick={() => setConfirmEnter(true)} disabled={!validRows}>
                      <ShieldCheck className="size-4" /> {t('exam.confirm')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-5">
              <section>
                <h2 className="flex items-center gap-2 font-display text-xl">
                  <PencilDoodle className="size-5" /> {t('exam.rulesTitle')}
                </h2>
                <ul className="mt-2">
                  {rules.map((rule, index) => (
                    <li
                      key={index}
                      className="flex gap-2 border-b-2 border-dashed border-border py-2 text-sm leading-7 text-muted-foreground last:border-0"
                    >
                      <TickDoodle className="mt-1 size-4 shrink-0" /> {rule}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="border-l-4 border-[var(--margin-line)] pl-3">
                <p className="flex items-center gap-1.5 font-display text-lg">
                  <PencilDoodle className="size-4" /> {t('exam.sampleNote')}
                </p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">{t('exam.inactiveDesc')}</p>
                <Button variant="ghost" size="sm" className="mt-2 px-0" onClick={loadSample} disabled={!subjects.length}>
                  <ArrowRight className="size-3.5" /> {t('exam.loadSample')}
                </Button>
              </section>
            </aside>
          </div>
        </>
      )}

      {archive.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-display text-2xl">
            <Archive className="size-5" /> {t('exam.archive')}
          </h2>
          <div className="mt-2 border-t-2 border-dashed border-border">
            {archive.map((entry, index) => (
              <div
                key={`${entry.exitedAt}-${index}`}
                className="flex flex-col gap-1 border-b-2 border-dashed border-border py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold">
                    {entry.exams.length} exam{entry.exams.length === 1 ? '' : 's'} ·{' '}
                    {entry.exams
                      .map((exam) => subjectById.get(exam.subjectId)?.name)
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('exam.archivedOn', { date: format(parseISO(entry.exitedAt), 'd MMM yyyy') })}
                  </p>
                </div>
                <Badge variant={entry.reason === 'all-passed' ? 'success' : entry.reason === 'auto' ? 'info' : 'outline'}>
                  {entry.reason === 'all-passed'
                    ? 'All papers done'
                    : entry.reason === 'auto'
                      ? 'Ended on its own'
                      : 'Exited by hand'}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmEnter}
        onOpenChange={setConfirmEnter}
        title={t('exam.confirm')}
        description={`${rows.length} exam${rows.length === 1 ? '' : 's'} will rebuild your plan backwards from ${
          rows[0]?.date ? format(parseISO(rows[0].date), 'd MMM yyyy') : 'the nearest paper'
        }. `}
        confirmLabel={t('exam.enter')}
        onConfirm={doEnter}
      />

      <ConfirmDialog
        open={confirmExit}
        onOpenChange={setConfirmExit}
        title={t('exam.exitTitle')}
        description={t('exam.exitDesc')}
        confirmLabel={t('exam.exit')}
        destructive
        onConfirm={() => {
          exitExamMode()
          setConfirmExit(false)
        }}
      />
    </div>
  )
}
