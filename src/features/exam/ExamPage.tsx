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
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        'Offline OCR is unavailable — paste the schedule text below and press Parse with AI.',
        'info',
      )
      return
    }
    setParsing(true)
    try {
      const text = await extractUploadText(file, kind, settings.language)
      if (!text?.trim()) throw new Error('empty')
      setScheduleText(text.slice(0, 4000))
      pushToast('Schedule text extracted', 'Review it, then press Parse with AI.', 'success')
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
      pushToast('Schedule parsed', 'Check every row before entering Exam Mode.', 'success')
    } catch {
      pushToast('Could not parse the schedule', 'Add the rows manually below.', 'error')
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

  return (
    <div className="space-y-5">
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
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow">
            <div className="absolute -right-10 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 left-1/3 size-48 rounded-full bg-white/10 blur-2xl" />
            <CardContent className="relative grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80">
                  <AlarmClock className="size-3.5" /> {t('exam.nextExam')}
                </p>
                <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
                  {nextSubject?.name ?? t('common.subject')}
                </h2>
                {nextExam && (
                  <p className="mt-1 text-sm text-white/85">
                    {format(parseISO(nextExam.date), 'EEEE, d MMMM yyyy')} · {nextExam.time}
                  </p>
                )}
                <div className="mt-4 max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-medium text-white/85">
                    <span>Syllabus coverage</span>
                    <span>
                      {nextSyllabus.covered}/{nextSyllabus.total} topics
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-700"
                      style={{ width: `${percent(nextSyllabus.covered, Math.max(1, nextSyllabus.total))}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-white/15 p-4 backdrop-blur-sm sm:flex-col sm:gap-1">
                <p className="font-display text-5xl font-extrabold leading-none">{daysLeft}</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/85">
                  {daysLeft === 0 ? t('exam.examDay') : t('exam.countdown')}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">{t('exam.scheduleTitle')}</h2>
                <Badge variant="secondary">{sortedExams.length} exams</Badge>
              </div>
              {sortedExams.map((exam, index) => {
                const subject = subjectById.get(exam.subjectId)
                const left = examDaysLeft(exam.date)
                return (
                  <Card key={exam.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: subject?.color ?? '#6366f1' }}>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/60">
                          <span className="text-[9px] font-bold uppercase text-muted-foreground">
                            {format(parseISO(exam.date), 'MMM')}
                          </span>
                          <span className="font-display text-lg font-extrabold leading-none">
                            {format(parseISO(exam.date), 'd')}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold">{subject?.name ?? t('common.subject')}</p>
                            <Badge variant={left <= 3 ? 'destructive' : left <= 7 ? 'warning' : 'outline'}>
                              {left < 0 ? 'Passed' : left === 0 ? t('exam.examDay') : `${left} ${t('exam.countdown')}`}
                            </Badge>
                            {index === 0 && <Badge variant="violet">Next paper</Badge>}
                          </div>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" /> {exam.time}
                            </span>
                            <span>·</span>
                            <span>{exam.syllabusTopics.length} syllabus topics</span>
                          </p>
                          {exam.syllabusTopics.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {exam.syllabusTopics.slice(0, 4).map((name) => (
                                <span key={name} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {name}
                                </span>
                              ))}
                              {exam.syllabusTopics.length > 4 && (
                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
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
                    </CardContent>
                  </Card>
                )
              })}
              {sortedExams.length === 0 && (
                <p className="rounded-xl bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground">
                  {t('exam.noSyllabus')}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="size-4 text-primary" /> {t('exam.rulesTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {[t('exam.rule1'), t('exam.rule2'), t('exam.rule3'), t('exam.rule4'), t('exam.rule5')].map(
                      (rule, index) => (
                        <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" /> {rule}
                        </li>
                      ),
                    )}
                  </ul>
                  <p className="mt-3 rounded-xl bg-primary-soft px-3 py-2 text-[11px] font-medium text-primary">
                    {t('exam.autoEnd')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Syllabus focus</CardTitle>
                  <CardDescription>Topics the planner is prioritising for {nextSubject?.name ?? 'your exam'}.</CardDescription>
                </CardHeader>
                <CardContent>
                  {nextSyllabus.total === 0 ? (
                    <p className="text-xs text-muted-foreground">{t('exam.noSyllabus')}</p>
                  ) : (
                    <>
                      <Progress
                        value={percent(nextSyllabus.covered, nextSyllabus.total)}
                        className="h-2"
                        indicatorClassName="bg-violet-500"
                      />
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {nextSyllabus.covered} of {nextSyllabus.total} syllabus topics covered.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <>
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary-soft/70 via-card to-card">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <GraduationCap className="size-6" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-extrabold">{t('exam.inactiveTitle')}</h2>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t('exam.inactiveDesc')}</p>
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
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('exam.uploadSchedule')}</CardTitle>
                  <CardDescription>Drop a PDF timetable, or paste the text and let AI parse it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    {parsing ? (
                      <Loader2 className="size-6 animate-spin text-primary" />
                    ) : (
                      <UploadCloud className="size-6 text-primary" />
                    )}
                    <span className="text-sm font-semibold">
                      {parsing ? t('exam.parsing') : 'Click to upload a schedule'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {uploadName || 'PDF, image or plain text · readable text only'}
                    </span>
                  </button>
                  <div>
                    <Label htmlFor="schedule-text" className="mb-1.5 block">
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
                    <Button variant="soft" size="sm" onClick={parseSchedule} disabled={parsing}>
                      {parsing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                      {parsing ? t('exam.parsing') : t('exam.parse')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={loadSample} disabled={!subjects.length}>
                      {t('exam.loadSample')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{t('exam.preview')}</CardTitle>
                      <CardDescription>{t('exam.previewDesc')}</CardDescription>
                    </div>
                    <Badge variant="secondary">{rows.length} rows</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rows.map((row, index) => {
                    const subject = subjectById.get(row.subjectId)
                    return (
                      <div key={row.key} className="rounded-xl border border-border bg-background/40 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="flex items-center gap-2 text-xs font-bold">
                            <span
                              className="flex size-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                              style={{ backgroundColor: subject?.color ?? '#6366f1' }}
                            >
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
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <Label className="mb-1 block text-[11px]">{t('exam.subject')}</Label>
                            <Select value={row.subjectId} onValueChange={(value) => updateRow(row.key, { subjectId: value })}>
                              <SelectTrigger className="h-10">
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
                            <Label className="mb-1 block text-[11px]">{t('exam.date')}</Label>
                            <Input
                              type="date"
                              value={row.date}
                              onChange={(event) => updateRow(row.key, { date: event.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="mb-1 block text-[11px]">{t('exam.time')}</Label>
                            <Input
                              type="time"
                              value={row.time}
                              onChange={(event) => updateRow(row.key, { time: event.target.value })}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <Label className="mb-1 block text-[11px]">{t('exam.syllabus')}</Label>
                          <div className="flex gap-1.5">
                            <Input
                              value={row.syllabusText}
                              onChange={(event) => updateRow(row.key, { syllabusText: event.target.value })}
                              placeholder="Laws of Motion, Work Energy, Thermodynamics"
                              className="h-10"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void suggestSyllabus(row)}
                              disabled={syllabusRow === row.key}
                              aria-label="Organise syllabus with AI"
                              title="Organise syllabus with AI"
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

                  <Button variant="outline" size="sm" onClick={addRow} className="w-full">
                    <Plus className="size-3.5" /> {t('exam.addRow')}
                  </Button>

                  <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={cn('text-[11px]', validRows ? 'text-muted-foreground' : 'text-destructive')}>
                      {validRows ? t('exam.autoEnd') : t('exam.subjectMismatch')}
                    </p>
                    <Button onClick={() => setConfirmEnter(true)} disabled={!validRows}>
                      <ShieldCheck className="size-4" /> {t('exam.confirm')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="size-4 text-primary" /> {t('exam.rulesTitle')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {[t('exam.rule1'), t('exam.rule2'), t('exam.rule3'), t('exam.rule4'), t('exam.rule5')].map(
                      (rule, index) => (
                        <li key={index} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" /> {rule}
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-dashed bg-transparent">
                <CardContent className="p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="size-3.5 text-violet-500" /> {t('exam.sampleNote')}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {t('exam.inactiveDesc')}
                  </p>
                  <Button variant="soft" size="sm" className="mt-3 w-full" onClick={loadSample} disabled={!subjects.length}>
                    <ArrowRight className="size-3.5" /> {t('exam.loadSample')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {archive.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="size-4 text-muted-foreground" /> {t('exam.archive')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archive.map((entry, index) => (
              <div
                key={`${entry.exitedAt}-${index}`}
                className="flex flex-col gap-1 rounded-xl border border-border bg-background/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold">
                    {entry.exams.length} exam{entry.exams.length === 1 ? '' : 's'} ·{' '}
                    {entry.exams
                      .map((exam) => subjectById.get(exam.subjectId)?.name)
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t('exam.archivedOn', { date: format(parseISO(entry.exitedAt), 'd MMM yyyy') })}
                  </p>
                </div>
                <Badge variant={entry.reason === 'all-passed' ? 'success' : entry.reason === 'auto' ? 'info' : 'outline'}>
                  {entry.reason === 'all-passed' ? 'All papers done' : entry.reason === 'auto' ? 'Auto-ended' : 'Exited manually'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
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
