import { useLocation, useNavigate } from 'react-router-dom'
import { Pause, Play, TimerReset } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useTimerRemaining } from '@/hooks/useTimerRemaining'
import { formatClock } from '@/lib/utils'

export function GlobalTimerPill() {
  const navigate = useNavigate()
  const location = useLocation()
  const timer = useAppStore((state) => state.timer)
  const slots = useAppStore((state) => state.slots)
  const subjects = useAppStore((state) => state.subjects)
  const pauseTimer = useAppStore((state) => state.pauseTimer)
  const resumeTimer = useAppStore((state) => state.resumeTimer)
  const remaining = useTimerRemaining(timer)

  if (!timer || location.pathname === '/tasks') return null
  const slot = slots.find((item) => item.id === timer.slotId)
  const subject = subjects.find((item) => item.id === slot?.subjectId)
  const progress = timer.totalSec ? Math.max(0, Math.min(1, remaining / timer.totalSec)) : 0

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-6">
      <div className="flex items-center gap-2 rounded-[5px_14px_7px_11px] border-2 border-foreground bg-card p-1.5 pl-2.5 shadow-[3px_3px_0_hsl(var(--foreground)/0.24)]">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-2.5"
          aria-label="Open focus timer"
        >
          <span className="relative flex size-9 items-center justify-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="hsl(var(--highlighter-hsl))"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 97.4} 97.4`}
              />
            </svg>
            <TimerReset className="size-4 text-primary" />
          </span>
          <span className="text-left">
            <span className="block text-[11px] font-medium text-muted-foreground">
              {subject?.name ?? 'Focus'}
            </span>
            <span className="block text-sm font-bold tabular-nums">{formatClock(remaining)}</span>
          </span>
        </button>
        <button
          onClick={() => (timer.paused ? resumeTimer() : pauseTimer())}
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={timer.paused ? 'Resume timer' : 'Pause timer'}
        >
          {timer.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
      </div>
    </div>
  )
}
