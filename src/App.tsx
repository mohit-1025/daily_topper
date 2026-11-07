import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/layout/app-shell'
import { RequireAuth, Splash } from '@/components/layout/require-auth'
import { Skeleton } from '@/components/ui/misc'
import { Toaster } from '@/components/ui/toast'
import { LandingPage } from '@/features/landing/LandingPage'
import { AuthPage } from '@/features/auth/AuthPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { PublicShell } from '@/features/public/PublicShell'
import { NotFoundPage } from '@/features/not-found/NotFoundPage'
import { useAppStore } from '@/store/useAppStore'
import { useMusicStore } from '@/store/useMusicStore'
import { themeMeta } from '@/lib/themes'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const SubjectsPage = lazy(() =>
  import('@/features/subjects/SubjectsPage').then((m) => ({ default: m.SubjectsPage })),
)
const SubjectDetailPage = lazy(() =>
  import('@/features/subjects/SubjectDetailPage').then((m) => ({ default: m.SubjectDetailPage })),
)
const TasksPage = lazy(() =>
  import('@/features/tasks/TasksPage').then((m) => ({ default: m.TasksPage })),
)
const PlanPage = lazy(() =>
  import('@/features/plan/PlanPage').then((m) => ({ default: m.PlanPage })),
)
const ProgressPage = lazy(() =>
  import('@/features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })),
)
const QuizzesPage = lazy(() =>
  import('@/features/quizzes/QuizzesPage').then((m) => ({ default: m.QuizzesPage })),
)
const ExamPage = lazy(() =>
  import('@/features/exam/ExamPage').then((m) => ({ default: m.ExamPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const AboutPage = lazy(() =>
  import('@/features/public/AboutPage').then((m) => ({ default: m.AboutPage })),
)
const FaqPage = lazy(() => import('@/features/public/FaqPage').then((m) => ({ default: m.FaqPage })))
const PrivacyPage = lazy(() =>
  import('@/features/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() =>
  import('@/features/public/TermsPage').then((m) => ({ default: m.TermsPage })),
)

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

function LazyPages() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  )
}

function PublicPageFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pt-12 sm:px-6" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function LazyPublicPages() {
  return (
    <Suspense fallback={<PublicPageFallback />}>
      <Outlet />
    </Suspense>
  )
}

function HomeRoute() {
  const hydrated = useAppStore((state) => state.hydrated)
  const session = useAppStore((state) => state.session)

  if (!hydrated) return <Splash />
  return session ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

function AuthRoute() {
  const hydrated = useAppStore((state) => state.hydrated)
  const session = useAppStore((state) => state.session)
  const profile = useAppStore((state) => state.profile)

  if (!hydrated) return <Splash />
  // Guests can still visit /auth to create a real account.
  if (session && !session.guest) {
    return <Navigate to={profile?.onboarded ? '/dashboard' : '/onboarding'} replace />
  }
  return <AuthPage />
}

export default function App() {
  const hydrated = useAppStore((state) => state.hydrated)
  const session = useAppStore((state) => state.session)
  const language = useAppStore((state) => state.settings.language)
  const theme = useAppStore((state) => state.theme)
  const { i18n } = useTranslation()
  const booted = useRef(false)

  useEffect(() => {
    if (booted.current) return
    booted.current = true
    void useAppStore.getState().hydrate()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const meta = themeMeta(theme)
    root.dataset.theme = meta.id
    root.style.colorScheme = meta.colorScheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', meta.metaColor)
    useMusicStore.getState().syncTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!session) useMusicStore.getState().stop()
  }, [session])

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language)
    document.documentElement.lang = language
  }, [language, i18n])

  useEffect(() => {
    if (!hydrated || !session) return
    const state = useAppStore.getState()
    state.syncExamMode()
    state.processMissedSlots(true)
  }, [hydrated, session])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/auth" element={<AuthRoute />} />
        <Route element={<PublicShell />}>
          <Route element={<LazyPublicPages />}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AppShell />}>
            <Route element={<LazyPages />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/subjects/:id" element={<SubjectDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/exam" element={<ExamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
