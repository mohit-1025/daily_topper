import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarClock, FlaskConical, RotateCcw, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAppStore } from '@/store/useAppStore'
import { examDaysLeft } from '@/services/plannerService'
import { prettyDate } from '@/lib/utils'

export function DemoBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useAppStore((state) => state.session)
  const resetDemo = useAppStore((state) => state.resetDemo)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [hidden, setHidden] = useState(false)

  if (!session?.guest || hidden) return null

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-accent/30 bg-gradient-to-r from-amber-400/10 via-amber-300/5 to-transparent p-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-amber-700 dark:text-accent">
          <FlaskConical className="size-4" />
        </span>
        <p className="text-xs font-medium leading-relaxed text-foreground/80">
          <span className="font-bold text-foreground">{t('common.demo')} · </span>
          {t('guest.banner')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)} disabled={resetting}>
          <RotateCcw className="size-3.5" />
          {t('guest.reset')}
        </Button>
        <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>
          <UserRound className="size-3.5" />
          <span className="hidden xs:inline">{t('guest.create')}</span>
          <span className="xs:hidden">{t('common.signup')}</span>
        </Button>
        <button
          onClick={() => setHidden(true)}
          aria-label={t('common.close')}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-background/60 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('guest.reset')}
        description="This restores Riya’s pre-loaded profile: 5 subjects, a 6-day streak, quiz history, today’s tasks and a sample exam schedule."
        confirmLabel={t('guest.reset')}
        onConfirm={async () => {
          setResetting(true)
          await resetDemo()
          setResetting(false)
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}

export function ExamModeBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const examMode = useAppStore((state) => state.examMode)
  const subjects = useAppStore((state) => state.subjects)

  const next = useMemo(() => {
    if (!examMode.active) return null
    return [...examMode.exams].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )[0]
  }, [examMode])

  if (!examMode.active || !next) return null
  const subject = subjects.find((s) => s.id === next.subjectId)
  const days = examDaysLeft(next.date)

  return (
    <button
      onClick={() => navigate('/exam')}
      className="group mb-4 flex w-full flex-col gap-2 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/15 via-indigo-500/10 to-fuchsia-500/10 p-3.5 text-left transition-shadow hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
          <CalendarClock className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
            {t('exam.activeTitle')}
          </p>
          <p className="text-sm font-semibold">
            {days <= 0 ? t('exam.examDay') : `${days} ${t('exam.countdown')}`} · {subject?.name}{' '}
            <span className="font-normal text-muted-foreground">
              ({prettyDate(next.date)}, {next.time})
            </span>
          </p>
        </div>
      </div>
      <span className="flex items-center gap-1 pl-12 text-xs font-semibold text-violet-500 sm:pl-0">
        {t('exam.title')}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}
