import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DemoBanner, ExamModeBanner } from '@/components/layout/banners'
import { GlobalTimerPill } from '@/components/layout/timer-pill'
import { useAppStore } from '@/store/useAppStore'
import { playChime, showNotification } from '@/lib/feedback'
import { cn } from '@/lib/utils'

export function AppShell() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dt-sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })
  const examActive = useAppStore((state) => state.examMode.active)
  const timer = useAppStore((state) => state.timer)

  useEffect(() => {
    if (!timer || timer.paused || timer.remainingSec === 0) return undefined
    const interval = window.setInterval(() => {
      if (location.pathname === '/tasks') return
      const state = useAppStore.getState()
      const current = state.timer
      if (!current || current.paused || !current.endsAt || current.remainingSec === 0) return
      if (current.endsAt > Date.now()) return
      state.finishTimer()
      if (state.settings.sound) playChime()
      if (state.settings.reminders) {
        showNotification('Focus session complete', 'Open Daily Tasks to finish the slot with a check-in quiz.')
      }
      state.pushToast('Focus session complete', 'Open Daily Tasks to finish with a check-in quiz.', 'success')
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timer?.slotId, timer?.paused, timer?.endsAt, timer?.remainingSec, location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem('dt-sidebar-collapsed', collapsed ? '1' : '0')
    } catch {
      /* noop */
    }
  }, [collapsed])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      {examActive && (
        <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-violet-500/[0.05] via-transparent to-transparent" />
      )}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className={cn('transition-[padding] duration-300', collapsed ? 'md:pl-[84px]' : 'md:pl-[264px]')}>
        <Header />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-32 pt-4 sm:px-6 md:pb-12 md:pt-6">
          <DemoBanner />
          <ExamModeBanner />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <MobileNav />
      <GlobalTimerPill />
    </div>
  )
}
