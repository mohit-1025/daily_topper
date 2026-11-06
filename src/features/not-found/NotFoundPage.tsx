import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard, SearchX } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'

export function NotFoundPage() {
  const session = useAppStore((state) => state.session)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      <Logo className="mb-10" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-lift">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <SearchX className="size-8" />
          </span>
          <p className="mt-5 font-display text-6xl font-extrabold tracking-tight gradient-text">404</p>
          <h1 className="mt-2 font-display text-xl font-extrabold">This page took a study break</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            The link may be outdated, or the page moved. Every other corner of your study space is still here.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              {session ? (
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" /> Back to dashboard
                </Link>
              ) : (
                <Link to="/">
                  <ArrowLeft className="size-4" /> Back to landing
                </Link>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link to={session ? '/plan' : '/auth'}>
                <Compass className="size-4" /> {session ? 'Open study plan' : 'Log in'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-8 text-[11px] text-muted-foreground">Daily Topper · Your data stays yours</p>
    </div>
  )
}
