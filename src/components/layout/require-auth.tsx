import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

export function RequireAuth() {
  const hydrated = useAppStore((state) => state.hydrated)
  const session = useAppStore((state) => state.session)
  const profile = useAppStore((state) => state.profile)
  const location = useLocation()

  if (!hydrated) return null
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }
  if (!profile?.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  if (profile?.onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

export function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
      <div className="flex size-16 -rotate-2 items-center justify-center rounded-[6px_18px_8px_14px] border-2 border-foreground bg-card text-foreground shadow-[4px_4px_0_hsl(var(--foreground)/0.28)]">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-display text-2xl">
          Daily <span className="mark">Topper</span>
        </p>
        <p className="mt-1 text-base text-muted-foreground">Opening your notebook…</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-2 animate-bounce rounded-full bg-foreground/60"
            style={{ animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  )
}
