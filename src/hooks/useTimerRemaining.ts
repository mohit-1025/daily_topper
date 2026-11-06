import { useEffect, useState } from 'react'
import type { TimerState } from '@/types'

export function useTimerRemaining(timer: TimerState | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!timer || timer.paused) return undefined
    setNow(Date.now())
    const interval = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(interval)
  }, [timer?.slotId, timer?.paused, timer?.endsAt])

  if (!timer) return 0
  if (timer.paused) return Math.max(0, timer.remainingSec ?? 0)
  if (!timer.endsAt) return 0
  return Math.max(0, Math.ceil((timer.endsAt - now) / 1000))
}

export function useTick(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(interval)
  }, [intervalMs])
  return now
}
