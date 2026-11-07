import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard, SearchX } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { PencilDoodle } from '@/components/shared/doodles'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'

export function NotFoundPage() {
  const session = useAppStore((state) => state.session)

  return (
    <div className="ruled-page flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16">
      <Logo className="mb-10" />
      <div className="paper-card tape w-full max-w-lg px-6 py-8 sm:px-8">
        <div className="flex items-start gap-4">
          <PencilDoodle className="mt-1 size-8 shrink-0" />
          <div>
            <p className="font-display text-6xl leading-none marker-line">404</p>
            <h1 className="mt-2 font-display text-2xl leading-tight">This page took a study break</h1>
            <p className="mt-1 max-w-[52ch] text-base leading-8 text-muted-foreground">
              The link may be outdated, or the page moved. Every other corner of your notebook is still here.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
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
        <p className="mt-6 text-sm text-muted-foreground">Daily Topper · Your data stays yours</p>
      </div>
      <p className="mt-8 flex items-center gap-1.5 text-sm text-muted-foreground">
        <SearchX className="size-4" /> Nothing was lost.
      </p>
    </div>
  )
}
