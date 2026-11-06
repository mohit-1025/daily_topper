import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Database,
  Download,
  GraduationCap,
  Info,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Avatar, AvatarFallback, Switch } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/store/useAppStore'
import { ensureNotificationPermission } from '@/lib/feedback'
import { languages } from '@/lib/i18n'
import { cn, downloadFile, initials, todayISO } from '@/lib/utils'
import type { EducationLevel, Language, SlotLength, StudyTime, ThemeMode } from '@/types'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const THEMES: { value: ThemeMode; icon: LucideIcon; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'common.light' },
  { value: 'dark', icon: Moon, labelKey: 'common.dark' },
  { value: 'system', icon: Monitor, labelKey: 'common.system' },
]

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function DataRow({
  icon: Icon,
  title,
  description,
  action,
  destructive,
}: {
  icon: LucideIcon
  title: string
  description: string
  action: ReactNode
  destructive?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            destructive ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-3">{action}</div>
    </div>
  )
}

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const profile = useAppStore((state) => state.profile)
  const session = useAppStore((state) => state.session)
  const settings = useAppStore((state) => state.settings)
  const updateProfile = useAppStore((state) => state.updateProfile)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const setTheme = useAppStore((state) => state.setTheme)
  const resetDemo = useAppStore((state) => state.resetDemo)
  const resetAllData = useAppStore((state) => state.resetAllData)
  const deleteAccount = useAppStore((state) => state.deleteAccount)
  const logout = useAppStore((state) => state.logout)
  const pushToast = useAppStore((state) => state.pushToast)

  const [draft, setDraft] = useState({
    name: profile?.name ?? '',
    email: profile?.email ?? '',
    dob: profile?.dob ?? '',
    gender: profile?.gender ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    educationLevel: profile?.educationLevel ?? ('school' as EducationLevel),
    course: profile?.course ?? '',
    yearSemester: profile?.yearSemester ?? '',
    boardUniversity: profile?.boardUniversity ?? '',
    institutionName: profile?.institutionName ?? '',
    academicGoal: profile?.academicGoal ?? '',
  })
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const setField = (key: keyof typeof draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const saveProfile = () => {
    if (!draft.name.trim()) {
      pushToast('Name is required', 'Add your name so the app can greet you properly.', 'warning')
      return
    }
    updateProfile({
      name: draft.name.trim(),
      dob: draft.dob,
      gender: draft.gender || undefined,
      city: draft.city.trim(),
      state: draft.state.trim(),
      educationLevel: draft.educationLevel,
      course: draft.course.trim(),
      yearSemester: draft.yearSemester.trim(),
      boardUniversity: draft.boardUniversity.trim(),
      institutionName: draft.institutionName.trim(),
      academicGoal: draft.academicGoal.trim(),
    })
    pushToast(t('settings.saved'), 'Your profile has been updated.', 'success')
  }

  const exportData = () => {
    const state = useAppStore.getState()
    const payload = {
      app: 'Daily Topper',
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      settings: state.settings,
      subjects: state.subjects,
      topics: state.topics,
      uploads: state.uploads,
      generated: state.generated,
      slots: state.slots,
      attempts: state.attempts,
      revisionSheets: state.revisionSheets,
      exams: state.exams,
      examMode: state.examMode,
    }
    downloadFile(`daily-topper-${todayISO()}.json`, JSON.stringify(payload, null, 2))
    pushToast(t('settings.exportDone'), 'Your data is in the downloads folder.', 'success')
  }

  const changeLanguage = (value: string) => {
    const language = value as Language
    setLanguage(language)
    void i18n.changeLanguage(language)
  }

  const toggleReminders = async (checked: boolean) => {
    updateSettings({ reminders: checked })
    if (checked) {
      const granted = await ensureNotificationPermission()
      if (!granted) {
        pushToast('Notifications are blocked', 'Reminders will still appear inside the app.', 'warning')
      }
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        actions={
          session?.guest ? (
            <Badge variant="accent">{t('common.demo')}</Badge>
          ) : (
            <Badge variant="secondary">
              <UserRound className="size-3" /> {session?.email}
            </Badge>
          )
        }
      />

      {session?.guest && (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Info className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Guest mode</p>
              <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">{t('settings.guestNote')}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void resetDemo()}>
              <RotateCcw className="size-3.5" /> {t('guest.reset')}
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth?mode=signup">
                <Sparkles className="size-3.5" /> {t('settings.createAccount')}
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={UserRound}
          title={t('settings.profile')}
          description={t('settings.profileDesc')}
          className="lg:col-span-2"
        >
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/30 p-3">
            <Avatar className="size-12 ring-2 ring-border">
              <AvatarFallback>{initials(draft.name || 'Student')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold">{draft.name || 'Your name'}</p>
              <p className="truncate text-xs text-muted-foreground">{draft.email}</p>
            </div>
            {profile?.course && (
              <Badge variant="secondary" className="ml-auto hidden sm:inline-flex">
                {profile.course}
              </Badge>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="settings-name" className="mb-1.5 block">Full name</Label>
              <Input id="settings-name" value={draft.name} onChange={(event) => setField('name', event.target.value)} />
            </div>
            <div>
              <Label htmlFor="settings-email" className="mb-1.5 block">Email</Label>
              <Input id="settings-email" value={draft.email} disabled />
            </div>
            <div>
              <Label htmlFor="settings-dob" className="mb-1.5 block">{t('onboarding.dob')}</Label>
              <Input
                id="settings-dob"
                type="date"
                value={draft.dob}
                onChange={(event) => setField('dob', event.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t('onboarding.gender')}</Label>
              <Select
                value={draft.gender || 'unspecified'}
                onValueChange={(value) => setField('gender', value === 'unspecified' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">{t('common.optional')}</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="settings-city" className="mb-1.5 block">{t('onboarding.city')}</Label>
              <Input id="settings-city" value={draft.city} onChange={(event) => setField('city', event.target.value)} />
            </div>
            <div>
              <Label htmlFor="settings-state" className="mb-1.5 block">{t('onboarding.state')}</Label>
              <Input
                id="settings-state"
                value={draft.state}
                onChange={(event) => setField('state', event.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{t('onboarding.educationLevel')}</Label>
              <Select
                value={draft.educationLevel}
                onValueChange={(value) => setField('educationLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">{t('onboarding.school')}</SelectItem>
                  <SelectItem value="undergraduate">{t('onboarding.undergraduate')}</SelectItem>
                  <SelectItem value="postgraduate">{t('onboarding.postgraduate')}</SelectItem>
                  <SelectItem value="competitive">{t('onboarding.competitive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="settings-course" className="mb-1.5 block">{t('onboarding.course')}</Label>
              <Input
                id="settings-course"
                value={draft.course}
                onChange={(event) => setField('course', event.target.value)}
                placeholder="Class 12 · Science"
              />
            </div>
            <div>
              <Label htmlFor="settings-year" className="mb-1.5 block">{t('onboarding.year')}</Label>
              <Input
                id="settings-year"
                value={draft.yearSemester}
                onChange={(event) => setField('yearSemester', event.target.value)}
                placeholder="2026 · Semester 1"
              />
            </div>
            <div>
              <Label htmlFor="settings-board" className="mb-1.5 block">{t('onboarding.board')}</Label>
              <Input
                id="settings-board"
                value={draft.boardUniversity}
                onChange={(event) => setField('boardUniversity', event.target.value)}
                placeholder="CBSE"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="settings-institution" className="mb-1.5 block">{t('onboarding.institution')}</Label>
              <Input
                id="settings-institution"
                value={draft.institutionName}
                onChange={(event) => setField('institutionName', event.target.value)}
                placeholder="Your school or college"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="settings-goal" className="mb-1.5 block">{t('onboarding.goal')}</Label>
              <Textarea
                id="settings-goal"
                value={draft.academicGoal}
                onChange={(event) => setField('academicGoal', event.target.value)}
                placeholder="Score 90%+ in board exams and build strong Physics fundamentals."
                className="min-h-20"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveProfile}>
              <GraduationCap className="size-4" /> {t('common.save')}
            </Button>
          </div>
        </SectionCard>

        <SectionCard icon={SlidersHorizontal} title={t('settings.study')} description={t('settings.studyDesc')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block">{t('settings.dailyHours')}</Label>
              <Select
                value={String(settings.studyHours)}
                onValueChange={(value) => updateSettings({ studyHours: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                    <SelectItem key={hours} value={String(hours)}>
                      {hours} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{t('settings.slotLength')}</Label>
              <Select
                value={String(settings.slotLength)}
                onValueChange={(value) => updateSettings({ slotLength: Number(value) as SlotLength })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 45, 60, 90].map((length) => (
                    <SelectItem key={length} value={String(length)}>
                      {length} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{t('settings.studyTime')}</Label>
              <Select
                value={settings.preferredStudyTime}
                onValueChange={(value) => updateSettings({ preferredStudyTime: value as StudyTime })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{t('settings.offDay')}</Label>
              <Select
                value={String(settings.weeklyOffDay)}
                onValueChange={(value) => updateSettings({ weeklyOffDay: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_KEYS.map((key, index) => (
                    <SelectItem key={key} value={String(index)}>
                      {t(`days.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
            Changes rebalance today’s plan automatically. Manual changes take effect immediately.
          </p>
        </SectionCard>

        <SectionCard icon={Palette} title={t('settings.appearance')} description={t('settings.appearanceDesc')}>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">{t('common.theme')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border text-[11px] font-semibold transition-colors',
                      settings.theme === option.value
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    <option.icon className="size-4" />
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">{t('common.language')}</Label>
              <Select value={settings.language} onValueChange={changeLanguage}>
                <SelectTrigger>
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
              <p className="mt-1 text-[11px] text-muted-foreground">{t('settings.languageNote')}</p>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Bell className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">{t('settings.reminders')}</p>
                    <p className="text-[11px] text-muted-foreground">{t('settings.remindersDesc')}</p>
                  </div>
                </div>
                <Switch checked={settings.reminders} onCheckedChange={(checked) => void toggleReminders(checked)} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="reminder-time" className="text-xs">{t('settings.reminderTime')}</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(event) => updateSettings({ reminderTime: event.target.value })}
                  disabled={!settings.reminders}
                  className="h-9 w-32"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{t('settings.sound')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('settings.soundDesc')}</p>
                </div>
                <Switch checked={settings.sound} onCheckedChange={(checked) => updateSettings({ sound: checked })} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Database}
          title={t('settings.data')}
          description={t('settings.dataDesc')}
          className="lg:col-span-2"
        >
          <div className="space-y-2">
            <DataRow
              icon={Download}
              title={t('settings.export')}
              description={t('settings.exportDesc')}
              action={
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="size-3.5" /> Export JSON
                </Button>
              }
            />
            <DataRow
              icon={RotateCcw}
              title={t('settings.reset')}
              description={t('settings.resetDesc')}
              destructive
              action={
                <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="size-3.5" /> {t('settings.resetConfirm')}
                </Button>
              }
            />
            <DataRow
              icon={Trash2}
              title={t('settings.deleteAccount')}
              description={t('settings.deleteDesc')}
              destructive
              action={
                <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-3.5" /> {t('settings.deleteConfirm')}
                </Button>
              }
            />
            <DataRow
              icon={LogOut}
              title={t('settings.account')}
              description={session?.guest ? 'Guest session on this device.' : `Signed in as ${session?.email}`}
              action={
                <div className="flex flex-wrap gap-2">
                  {session?.guest && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/auth?mode=signup">{t('settings.createAccount')}</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setConfirmLogout(true)}>
                    <LogOut className="size-3.5" /> {t('settings.signOut')}
                  </Button>
                </div>
              }
            />
          </div>
        </SectionCard>
      </div>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        Daily Topper · Your data stays yours. Guest data never leaves this device.
      </p>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t('settings.resetTitle')}
        description={t('settings.resetDesc')}
        confirmLabel={t('settings.resetConfirm')}
        destructive
        onConfirm={() => {
          setConfirmReset(false)
          void resetAllData()
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('settings.deleteTitle')}
        description={t('settings.deleteDesc')}
        confirmLabel={t('settings.deleteConfirm')}
        destructive
        onConfirm={() => {
          setConfirmDelete(false)
          void deleteAccount()
        }}
      />

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title={t('settings.signOut')}
        description="You can come back anytime — your progress is saved locally."
        confirmLabel={t('settings.signOut')}
        destructive
        onConfirm={() => {
          setConfirmLogout(false)
          void logout().then(() => navigate('/'))
        }}
      />
    </div>
  )
}
