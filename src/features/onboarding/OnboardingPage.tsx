import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Languages,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Timer,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress, RatingStars } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/useAppStore'
import { languages } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { EducationLevel, Language, SlotLength, StudyTime } from '@/types'

const steps = [
  { key: 'personal', icon: UserRound, titleKey: 'onboarding.personal', descKey: 'onboarding.personalDesc' },
  { key: 'education', icon: GraduationCap, titleKey: 'onboarding.education', descKey: 'onboarding.educationDesc' },
  { key: 'preferences', icon: Timer, titleKey: 'onboarding.preferences', descKey: 'onboarding.preferencesDesc' },
  { key: 'subjects', icon: BookOpen, titleKey: 'onboarding.subjects', descKey: 'onboarding.subjectsDesc' },
]

const suggestions: Record<string, string[]> = {
  school: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Social Science', 'Computer Science'],
  undergraduate: ['Data Structures', 'Discrete Mathematics', 'Operating Systems', 'Microeconomics', 'Statistics', 'DBMS'],
  postgraduate: ['Machine Learning', 'Research Methods', 'Advanced Algorithms', 'Finance', 'Marketing', 'Thesis'],
  competitive: ['Quantitative Aptitude', 'Reasoning', 'General Awareness', 'Physics', 'Chemistry', 'Biology'],
}

const ratingLabels = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']

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
    <div className="relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-bg" aria-hidden />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo to="/dashboard" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <button type="button" onClick={() => navigate('/dashboard')}>
              {t('common.skip')}
            </button>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-16 sm:px-8 lg:grid-cols-[280px_1fr] lg:gap-10">
        <aside className="lg:pt-6">
          <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-soft backdrop-blur lg:sticky lg:top-6">
            <Badge variant="accent" className="mb-3">
              <Sparkles className="size-3" /> {t('onboarding.step', { current: step + 1, total: steps.length })}
            </Badge>
            <h1 className="font-display text-xl font-extrabold tracking-tight">{t('onboarding.title')}</h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t('onboarding.subtitle')}</p>
            <Progress value={progress} className="mt-4" indicatorClassName="bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            <ol className="mt-5 hidden space-y-1 lg:block">
              {steps.map((item, index) => {
                const active = index === step
                const done = index < step
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => index < step && setStep(index)}
                      disabled={index > step}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors',
                        active ? 'bg-primary-soft' : 'hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                          done && 'border-success/30 bg-success/10 text-success',
                          active && 'border-primary/30 bg-primary text-primary-foreground',
                          !done && !active && 'border-border bg-background text-muted-foreground',
                        )}
                      >
                        {done ? <Check className="size-4" /> : <item.icon className="size-4" />}
                      </span>
                      <span>
                        <span className={cn('block text-sm font-semibold', active && 'text-primary')}>{t(item.titleKey)}</span>
                        <span className="block text-[11px] text-muted-foreground">{index + 1} / {steps.length}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </aside>

        <section className="rounded-3xl border border-border bg-card/95 p-5 shadow-soft sm:p-7 lg:mt-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('onboarding.step', { current: step + 1, total: steps.length })}
            </p>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{t(steps[step].titleKey)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t(steps[step].descKey)}</p>
          </div>

          <AnimatePresence initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
            >
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
                    <Label htmlFor="ob-language" className="flex items-center gap-2">
                      <Languages className="size-4 text-primary" /> {t('onboarding.language')}
                    </Label>
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
                    <p className="text-[11px] text-muted-foreground">AI explanations and revision sheets will be written in this language.</p>
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
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label>{t('onboarding.dailyHours')}</Label>
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                        {form.studyHours} {t('progress.studyHours').toLowerCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, 5).map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => set('studyHours', hours)}
                          className={cn(
                            'flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors',
                            form.studyHours === hours
                              ? 'border-primary bg-primary text-primary-foreground'
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
                          onClick={() => set('preferredStudyTime', time)}
                          className={cn(
                            'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors',
                            form.preferredStudyTime === time
                              ? 'border-primary bg-primary-soft text-primary'
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
                    <div className="grid grid-cols-4 gap-2">
                      {([25, 45, 60, 90] as SlotLength[]).map((length) => (
                        <button
                          key={length}
                          type="button"
                          onClick={() => set('slotLength', length)}
                          className={cn(
                            'flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors',
                            form.slotLength === length
                              ? 'border-primary bg-primary-soft text-primary'
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
                <div className="space-y-5">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
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
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('onboarding.rateSubject')}</p>
                      <RatingStars
                        value={subjectDraft.selfRating}
                        onChange={(value) => setSubjectDraft((current) => ({ ...current, selfRating: value }))}
                        showLabel
                      />
                    </div>
                    {subjectError && <p className="mt-2 text-xs font-medium text-destructive">{subjectError}</p>}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Suggestions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestionsForLevel.slice(0, 6).map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => addSubject(name, 3)}
                          disabled={subjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase())}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary-soft disabled:opacity-40"
                        >
                          <Plus className="size-3" /> {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {subjects.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
                        <BookOpen className="mx-auto size-7 text-muted-foreground/60" />
                        <p className="mt-2 text-sm font-medium">{t('subjects.emptyTitle')}</p>
                        <p className="text-xs text-muted-foreground">{t('onboarding.addAtLeastOne')}</p>
                      </div>
                    )}
                    {subjects.map((subject, index) => (
                      <motion.div
                        key={subject.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                          {subject.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{subject.name}</p>
                          <p className="text-[11px] text-muted-foreground">{ratingLabels[subject.selfRating - 1]}</p>
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
                          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Remove ${subject.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (step === 0 ? navigate('/dashboard') : setStep((current) => Math.max(0, current - 1)))}
            >
              <ArrowLeft className="size-4" /> {t('common.back')}
            </Button>
            {step < steps.length - 1 ? (
              <Button type="button" onClick={next}>
                {t('common.next')} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={finish} loading={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Rocket className="size-4" />}
                {saving ? t('onboarding.finishing') : t('onboarding.finish')}
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
