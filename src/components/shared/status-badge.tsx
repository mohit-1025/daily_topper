import { useTranslation } from 'react-i18next'
import { CalendarClock, CheckCircle2, CirclePlay, CircleSlash2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SlotSource, SlotStatus } from '@/types'

const styles: Record<SlotStatus, string> = {
  scheduled: 'status-scheduled',
  running: 'status-running',
  done: 'status-done',
  skipped: 'status-skipped',
  missed: 'status-missed',
}

const icons = {
  scheduled: CalendarClock,
  running: CirclePlay,
  done: CheckCircle2,
  skipped: CircleSlash2,
  missed: XCircle,
}

export function StatusBadge({
  status,
  source,
  className,
}: {
  status: SlotStatus
  source?: SlotSource
  className?: string
}) {
  const { t } = useTranslation()
  const Icon = icons[status]
  const isExam = status === 'scheduled' && (source === 'exam' || source === 'revision')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px_8px_4px_7px] border-2 px-2 py-0.5 text-sm font-semibold',
        styles[status],
        status === 'missed' && 'missed-strike',
        isExam && 'status-exam',
        className,
      )}
    >
      <Icon className="size-3" />
      {t(`slotStatus.${status}`)}
      {isExam && <span className="opacity-80">· {t(source === 'exam' ? 'tasks.source.exam' : 'tasks.source.revision')}</span>}
    </span>
  )
}

export function slotAccent(status: SlotStatus, source?: SlotSource) {
  if (status === 'done') return 'border-l-success'
  if (status === 'running') return 'border-l-primary'
  if (status === 'skipped') return 'border-l-warning'
  if (status === 'missed') return 'border-l-destructive'
  if (source === 'exam' || source === 'revision') return 'border-l-accent'
  return 'border-l-info'
}

export function slotDot(status: SlotStatus, source?: SlotSource) {
  if (status === 'done') return 'bg-success'
  if (status === 'running') return 'bg-primary'
  if (status === 'skipped') return 'bg-warning'
  if (status === 'missed') return 'bg-destructive'
  if (source === 'exam' || source === 'revision') return 'bg-accent'
  return 'bg-info'
}
