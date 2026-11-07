import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, BookOpen, Check, Loader2, Plus, Trash2 } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { ArrowDoodle, BookDoodle } from '@/components/shared/doodles'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress, RatingStars } from '@/components/ui/misc'
import { useAppStore } from '@/store/useAppStore'
import { presetStudyWindow } from '@/services/plannerService'
import { languages } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { EducationLevel, Language, SlotLength, StudyTime } from '@/types'

const steps = [
  { key: 'personal', titleKey: 'onboarding.personal', descKey: 'onboarding.personalDesc' },
  { key: 'education', titleKey: 'onboarding.education', descKey: 'onboarding.educationDesc' },
  { key: 'preferences', titleKey: 'onboarding.preferences', descKey: 'onboarding.preferencesDesc' },
  { key: 'subjects', titleKey: 'onboarding.subjects', descKey: 'onboarding.subjectsDesc' },
]

const suggestions: Record<string, string[]> = {
  school: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Social Science', 'Computer Science'],
  undergraduate: ['Data Structures', 'Discrete Mathematics', 'Operating Systems', 'Microeconomics', 'Statistics', 'DBMS'],
  postgraduate: ['Machine Learning', 'Research Methods', 'Advanced Algorithms', 'Finance', 'Marketing', 'Thesis'],
  competitive: ['Quantitative Aptitude', 'Reasoning', 'General Awareness', 'Physics', 'Chemistry', 'Biology'],
}

const ratingLabels = ['Very weak', 'Weak', 'Moderate', 'Strong', 'Very strong']

const choiceClass =
  'flex h-11 items-center justify-center rounded-[5px_11px_6px_9px] border-2 text-base font-semibold transition-[background-color,box-shadow] duration-150'

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const profile = useAppStore((state) => state.profile)
  const settings = useAppStore((state) => state.settings)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    dob: profile?.dob ?? '',
    gender: profile?.gender ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    language: settings.language as Language,
    educationLevel: (profile?.educationLevel ?? 'school') as EducationLevel,
    course: profile?.course ?? '',
    yearSemester: profile?.yearSemester ?? '',
    boardUniversity: profile?.boardUniversity ?? '',
    institutionName: profile?.institutionName ?? '',
    academicGoal: profile?.academicGoal ?? '',
    studyHours: settings.studyHours,
    preferredStudyTime: settings.preferredStudyTime as StudyTime,
    studyStart: settings.studyStart,
    studyEnd: settings.studyEnd,
    slotLength: settings.slotLength as SlotLength,
    weeklyOffDay: settings.weeklyOffDay,
  })
  const [subjects, setSubjects] = useState<{ name: string; selfRating: number }[]>([])
  const [subjectDraft, setSubjectDraft] = useState({ name: '', selfRating: 3 })
  const [subjectError, setSubjectError] = useState('')

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const progress = ((step + 1) / steps.length) * 100
  const suggestionsForLevel = useMemo(() => suggestions[form.educationLevel] ?? [], [form.educationLevel])
  const weekdays = ['days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat']

  const chooseStudyTime = (time: StudyTime) => {
    const window = presetStudyWindow(time)
    setForm((current) => ({
      ...current,
      preferredStudyTime: time,
      studyStart: window.start,
      studyEnd: window.end,
    }))
    setError('')
  }

  const validateStep = () => {
    if (step === 0) {
      if (form.name.trim().length < 2) return 'Please tell us your full name.'
      if (!form.dob) return 'Please add your date of birth.'
    }
    if (step === 1) {
      if (!form.course.trim()) return 'Add your class, course or branch.'
      if (!form.institutionName.trim()) return 'Add your institution name.'
      if (!form.academicGoal.trim()) return 'Write a short academic goal — it keeps the plan honest.'
    }
    if (step === 3 && subjects.length === 0) return t('onboarding.addAtLeastOne')
    return ''
  }

  const next = () => {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep((current) => Math.min(steps.length - 1, current + 1))
  }

  const addSubject = (name = subjectDraft.name, rating = subjectDraft.selfRating) => {
    const trimmed = name.trim()
    if (!trimmed) {
      setSubjectError(t('onboarding.subjectName'))
      return
    }
    if (subjects.some((subject) => subject.name.toLowerCase() === trimmed.toLowerCase())) {
      setSubjectError(t('onboarding.duplicate'))
      return
    }
    setSubjects((current) => [...current, { name: trimmed, selfRating: rating }])
    setSubjectDraft({ name: '', selfRating: 3 })
    setSubjectError('')
  }

  const finish = async () => {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }
    setSaving(true)
    try {
      await completeOnboarding({
        profile: {
          name: form.name.trim(),
          dob: form.dob,
          gender: form.gender || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          educationLevel: form.educationLevel,
          course: form.course.trim(),
          yearSemester: form.yearSemester.trim(),
          boardUniversity: form.boardUniversity.trim(),
          institutionName: form.institutionName.trim(),
          academicGoal: form.academicGoal.trim(),
        },
        settings: {
          language: form.language,
          studyHours: form.studyHours,
          preferredStudyTime: form.preferredStudyTime,
          studyStart: form.studyStart,
          studyEnd: form.studyEnd,
          slotLength: form.slotLength,
          weeklyOffDay: form.weeklyOffDay,
        },
        subjects,
      })
      const state = useAppStore.getState()
      state.setLanguage(form.language)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
      setSaving(false)
    }
  }

  return (
    <div className="ruled-page min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo to="/dashboard" />
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 sm:px-8 lg:grid-cols-[260px_1fr] lg:gap-12">
        <aside className="lg:pt-2">
          <div className="lg:sticky lg:top-6">
            <p className="border-b-2 border-[var(--margin-line)] pb-1 text-base text-muted-foreground">
              {t('onboarding.step', { current: step + 1, total: steps.length })}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight">{t('onboarding.title')}</h1>
            <p className="mt-2 text-base leading-8 text-muted-foreground">{t('onboarding.subtitle')}</p>
            <Progress value={progress} className="mt-4" />
            <ol className="mt-5 hidden space-y-0.5 lg:block">
              {steps.map((item, index) => {
                const active = index === step
                const done = index < step
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => index < step && setStep(index)}
                      disabled={index > step}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[4px_9px_5px_8px] px-2 py-2 text-left transition-colors',
                        active && 'bg-accent/60',
                        !active && index < step && 'hover:bg-muted',
                        index > step && 'cursor-default opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-[3px_7px_4px_6px] border-2 text-sm font-bold',
                          done && 'border-foreground bg-background',
                          active && 'border-primary bg-primary text-primary-foreground',
                          !done && !active && 'border-border bg-background text-muted-foreground',
                        )}
                      >
                        {done ? <Check className="size-4" /> : index + 1}
                      </span>
                      <span className={cn('text-base font-semibold', active && 'underline decoration-accent decoration-[6px] underline-offset-[-2px]')}>
                        {t(item.titleKey)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </aside>

        <section className="paper-card p-5 sm:p-7">
          <div className="mb-5 border-b-2 border-dashed border-border pb-4">
            <p className="text-base text-muted-foreground">
              {t('onboarding.step', { current: step + 1, total: steps.length })}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">{t(steps[step].titleKey)}</h2>
            <p className="mt-1 text-base leading-8 text-muted-foreground">{t(steps[step].descKey)}</p>
          </div>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ob-name">{t('common.name')} *</Label>
                <Input
                  id="ob-name"
                  value={form.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="Riya Sharma"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-dob">{t('onboarding.dob')} *</Label>
                <Input id="ob-dob" type="date" value={form.dob} max={new Date().toISOString().slice(0, 10)} onChange={(event) => set('dob', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-gender">
                  {t('onboarding.gender')} <span className="font-normal text-muted-foreground">({t('common.optional')})</span>
                </Label>
                <Select value={form.gender || 'none'} onValueChange={(value) => set('gender', value === 'none' ? '' : value)}>
                  <SelectTrigger id="ob-gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Prefer not to say</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-city">{t('onboarding.city')}</Label>
                <Input id="ob-city" value={form.city} onChange={(event) => set('city', event.target.value)} placeholder="Jaipur" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-state">{t('onboarding.state')}</Label>
                <Input id="ob-state" value={form.state} onChange={(event) => set('state', event.target.value)} placeholder="Rajasthan" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ob-language">{t('onboarding.language')}</Label>
                <Select value={form.language} onValueChange={(value) => set('language', value as Language)}>
                  <SelectTrigger id="ob-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.native} · {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm leading-6 text-muted-foreground">
                  Explanations and revision sheets will be written in this language.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ob-level">{t('onboarding.educationLevel')}</Label>
                <Select value={form.educationLevel} onValueChange={(value) => set('educationLevel', value as EducationLevel)}>
                  <SelectTrigger id="ob-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['school', 'undergraduate', 'postgraduate', 'competitive'] as EducationLevel[]).map((level) => (
                      <SelectItem key={level} value={level}>
                        {t(`onboarding.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-course">{t('onboarding.course')} *</Label>
                <Input
                  id="ob-course"
                  value={form.course}
                  onChange={(event) => set('course', event.target.value)}
                  placeholder={form.educationLevel === 'school' ? 'Class 12 — Science (PCB)' : 'B.Tech Computer Science'}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-year">{t('onboarding.year')}</Label>
                <Input
                  id="ob-year"
                  value={form.yearSemester}
                  onChange={(event) => set('yearSemester', event.target.value)}
                  placeholder={form.educationLevel === 'school' ? 'Class 12' : 'Semester 5'}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-board">{t('onboarding.board')}</Label>
                <Input
                  id="ob-board"
                  value={form.boardUniversity}
                  onChange={(event) => set('boardUniversity', event.target.value)}
                  placeholder={form.educationLevel === 'school' ? 'CBSE' : 'Delhi University'}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ob-institution">{t('onboarding.institution')} *</Label>
                <Input
                  id="ob-institution"
                  value={form.institutionName}
                  onChange={(event) => set('institutionName', event.target.value)}
                  placeholder="St. Xavier's School"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ob-goal">{t('onboarding.goal')} *</Label>
                <Textarea
                  id="ob-goal"
                  value={form.academicGoal}
                  onChange={(event) => set('academicGoal', event.target.value)}
                  placeholder={t('onboarding.goalPlaceholder')}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>{t('onboarding.dailyHours')}</Label>
                  <span className="text-base font-bold underline decoration-accent decoration-[8px] underline-offset-[-3px]">
                    {t('onboarding.hoursPerDay', { count: form.studyHours })}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => set('studyHours', hours)}
                      aria-pressed={form.studyHours === hours}
                      className={cn(
                        choiceClass,
                        form.studyHours === hours
                          ? 'border-primary bg-accent text-accent-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.35)]'
                          : 'border-border bg-card hover:bg-muted',
                      )}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('onboarding.studyTime')}</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['morning', 'afternoon', 'evening', 'night'] as StudyTime[]).map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => chooseStudyTime(time)}
                      aria-pressed={form.preferredStudyTime === time}
                      className={cn(
                        choiceClass,
                        form.preferredStudyTime === time
                          ? 'border-primary bg-accent text-accent-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.35)]'
                          : 'border-border bg-card hover:bg-muted',
                      )}
                    >
                      {t(`onboarding.${time}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('onboarding.slotLength')}</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([25, 45, 60, 90] as SlotLength[]).map((length) => (
                    <button
                      key={length}
                      type="button"
                      onClick={() => set('slotLength', length)}
                      aria-pressed={form.slotLength === length}
                      className={cn(
                        choiceClass,
                        form.slotLength === length
                          ? 'border-primary bg-accent text-accent-foreground shadow-[2px_2px_0_hsl(var(--foreground)/0.35)]'
                          : 'border-border bg-card hover:bg-muted',
                      )}
                    >
                      {length} {t('common.minutes')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ob-off-day">{t('onboarding.offDay')}</Label>
                <Select value={String(form.weeklyOffDay)} onValueChange={(value) => set('weeklyOffDay', Number(value))}>
                  <SelectTrigger id="ob-off-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {t(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-border p-4">
                <Label htmlFor="ob-subject">{t('onboarding.addSubject')}</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="ob-subject"
                    value={subjectDraft.name}
                    onChange={(event) => {
                      setSubjectDraft((current) => ({ ...current, name: event.target.value }))
                      setSubjectError('')
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addSubject()
                      }
                    }}
                    placeholder="e.g. Organic Chemistry"
                  />
                  <Button type="button" onClick={() => addSubject()} className="sm:w-auto">
                    <Plus className="size-4" /> {t('common.add')}
                  </Button>
                </div>
                <div className="mt-3">
                  <p className="mb-1.5 text-base text-muted-foreground">{t('onboarding.rateSubject')}</p>
                  <RatingStars
                    value={subjectDraft.selfRating}
                    onChange={(value) => setSubjectDraft((current) => ({ ...current, selfRating: value }))}
                    showLabel
                  />
                </div>
                {subjectError && (
                  <p className="mt-2 border-l-2 border-[var(--margin-line)] pl-2 text-sm font-medium text-destructive">{subjectError}</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-base text-muted-foreground">Suggestions for your course</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestionsForLevel.slice(0, 6).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => addSubject(name, 3)}
                      disabled={subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())}
                      className="inline-flex items-center gap-1 rounded-[4px_9px_5px_8px] border-2 border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-foreground hover:bg-accent/40 disabled:opacity-40"
                    >
                      <Plus className="size-3.5" /> {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-dashed border-border">
                {subjects.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <BookDoodle className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-base font-semibold">{t('subjects.emptyTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('onboarding.addAtLeastOne')}</p>
                  </div>
                )}
                {subjects.map((subject, index) => (
                  <div
                    key={subject.name}
                    className="flex flex-wrap items-center gap-3 border-b-2 border-dashed border-border px-1 py-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[3px_7px_4px_6px] border-2 border-foreground text-xs font-bold">
                      {subject.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">{ratingLabels[subject.selfRating - 1]}</p>
                    </div>
                    <RatingStars
                      value={subject.selfRating}
                      size="sm"
                      onChange={(value) =>
                        setSubjects((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, selfRating: value } : item,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setSubjects((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="flex size-9 items-center justify-center rounded-[4px_9px_5px_8px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${subject.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                {subjects.length === 0 && (
                  <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                    <BookOpen className="size-4" /> Subjects you add here get their own slots in your plan.
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <p
              className="mt-4 border-l-2 border-[var(--margin-line)] bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t-2 border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 0 ? navigate('/dashboard') : setStep((current) => Math.max(0, current - 1)))}
            >
              <ArrowLeft className="size-4" /> {t('common.back')}
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={next}>
                {t('common.next')} <ArrowDoodle className="size-5" />
              </Button>
            ) : (
              <Button type="button" onClick={finish} loading={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
                {saving ? t('onboarding.finishing') : t('onboarding.finish')}
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
