import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { CalendarDoodle, NoteDoodle, PencilDoodle, TickDoodle } from '@/components/shared/doodles'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'signup'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Field({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string
  label: string
  icon: typeof Mail
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
        {error && (
          <p className="mt-1 border-l-2 border-[var(--margin-line)] pl-2 text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    </div>
  )
}

const notes = [
  {
    icon: CalendarDoodle,
    title: 'A plan that rebuilds itself',
    desc: 'Skip a slot or change a rating. Tomorrow adapts.',
  },
  {
    icon: PencilDoodle,
    title: 'Private by default',
    desc: 'Guest mode keeps everything on this device.',
  },
  {
    icon: TickDoodle,
    title: 'Progress you can see',
    desc: 'Every slot ends with a short quiz. Streaks grow.',
  },
]

export function AuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const signIn = useAppStore((state) => state.signIn)
  const signUp = useAppStore((state) => state.signUp)
  const startGuest = useAppStore((state) => state.startGuest)
  const pushToast = useAppStore((state) => state.pushToast)
  const [mode, setMode] = useState<Mode>(() => (searchParams.get('mode') === 'signup' ? 'signup' : 'login'))
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<'form' | 'guest' | null>(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
    setError('')
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (mode === 'signup' && form.name.trim().length < 2) errors.name = 'Enter your full name.'
    if (!emailPattern.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (form.password.length < 6) errors.password = 'Use at least 6 characters.'
    if (mode === 'signup' && form.confirm !== form.password) errors.confirm = 'Passwords do not match.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!validate()) return
    setLoading('form')
    try {
      const session =
        mode === 'login'
          ? await signIn(form.email.trim(), form.password)
          : await signUp(form.name.trim(), form.email.trim(), form.password)
      const state = useAppStore.getState()
      pushToast(
        mode === 'login' ? 'Welcome back!' : 'Notebook opened',
        mode === 'login' ? `Good to see you, ${session.name.split(' ')[0]}.` : 'Your study space is ready.',
        'success',
      )
      navigate(state.profile?.onboarded ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setLoading(null)
    }
  }

  const handleGuest = async () => {
    setLoading('guest')
    try {
      await startGuest()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
      setLoading(null)
    }
  }

  return (
    <div className="ruled-page relative min-h-dvh bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </Button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-4 sm:px-8 lg:grid-cols-[1fr_440px] lg:items-start lg:gap-16 lg:pt-10">
        <section className="hidden lg:block">
          <p className="text-base text-muted-foreground">{t('landing.badge')}</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">
            {t('landing.heroTitle')}
            <br />
            <span className="mark">{t('landing.heroAccent')}</span>
          </h1>
          <p className="mt-5 max-w-[58ch] text-lg leading-8 text-muted-foreground">{t('landing.heroSubtitle')}</p>

          <ul className="mt-9 max-w-[56ch] border-t-2 border-dashed border-border">
            {notes.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.title} className="flex items-start gap-4 border-b-2 border-dashed border-border py-4">
                  <Icon className="mt-1 size-6 shrink-0 text-foreground" />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-base leading-8 text-muted-foreground">{item.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="mt-8 flex max-w-[54ch] items-start gap-2 text-base leading-8 text-muted-foreground">
            <NoteDoodle className="mt-1.5 size-5 shrink-0 text-[var(--margin-line)]" />
            Your exam dates and syllabus shape every plan. Nothing is dropped — it moves.
          </p>
        </section>

        <section className="paper-card tape mx-auto w-full max-w-md p-5 sm:p-7 lg:mx-0">
          <div className="mb-5">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {mode === 'login' ? t('auth.welcomeBack') : t('auth.signupTab')}
            </h2>
            <p className="mt-1 text-base text-muted-foreground">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>
          </div>

          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as Mode)
              setError('')
              setFieldErrors({})
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth.loginTab')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signupTab')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login" forceMount className={cn(mode !== 'login' && 'hidden')}>
              <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
                <Field id="login-email" label={t('common.email')} icon={Mail} error={fieldErrors.email}>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </Field>
                <Field id="login-password" label={t('common.password')} icon={Lock} error={fieldErrors.password}>
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-10 pr-11"
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[4px_9px_5px_8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </Field>
                {error && (
                  <p className="border-l-2 border-[var(--margin-line)] bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading === 'form'}>
                  {loading === 'form' ? t('auth.signingIn') : t('auth.loginTab')}
                  {loading !== 'form' && <ArrowLeft className="size-4 rotate-180" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" forceMount className={cn(mode !== 'signup' && 'hidden')}>
              <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
                <Field id="signup-name" label={t('common.name')} icon={User} error={fieldErrors.name}>
                  <Input
                    id="signup-name"
                    autoComplete="name"
                    placeholder="Riya Sharma"
                    className="pl-10"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.name)}
                  />
                </Field>
                <Field id="signup-email" label={t('common.email')} icon={Mail} error={fieldErrors.email}>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                </Field>
                <Field id="signup-password" label={t('common.password')} icon={Lock} error={fieldErrors.password}>
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className="pl-10 pr-11"
                    value={form.password}
                    onChange={(event) => update('password', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[4px_9px_5px_8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </Field>
                <Field id="signup-confirm" label={t('auth.confirmPassword')} icon={Check} error={fieldErrors.confirm}>
                  <Input
                    id="signup-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    className="pl-10"
                    value={form.confirm}
                    onChange={(event) => update('confirm', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.confirm)}
                  />
                </Field>
                {error && (
                  <p className="border-l-2 border-[var(--margin-line)] bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" loading={loading === 'form'}>
                  {loading === 'form' ? t('auth.creating') : t('auth.signupTab')}
                  {loading !== 'form' && <ArrowLeft className="size-4 rotate-180" />}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <span className="h-0.5 flex-1 bg-border" />
            <span className="text-base text-muted-foreground">{t('auth.or')}</span>
            <span className="h-0.5 flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGuest} loading={loading === 'guest'}>
            {loading !== 'guest' && <PencilDoodle className="size-5" />}
            {t('auth.guestButton')}
          </Button>
          <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">{t('auth.guestHint')}</p>
          <p className="mt-4 border-t-2 border-dashed border-border pt-3 text-center text-sm text-muted-foreground">
            {t('auth.settingsNote')}
          </p>
        </section>
      </main>
    </div>
  )
}
