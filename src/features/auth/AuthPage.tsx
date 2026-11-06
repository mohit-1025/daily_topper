import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { Logo } from '@/components/shared/brand'
import { ThemeToggle } from '@/components/shared/theme-toggle'
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
        {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
      </div>
    </div>
  )
}

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
        mode === 'login' ? 'Welcome back!' : 'Account created',
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
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 mesh-bg" aria-hidden />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-16 pt-2 sm:px-8 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-16 lg:pt-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> {t('landing.badge')}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-5xl">
            {t('landing.heroTitle')}
            <br />
            <span className="gradient-text">{t('landing.heroAccent')}</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            {t('landing.heroSubtitle')}
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: CalendarCheck2, title: 'A plan that rebuilds itself', desc: 'Skip a slot, miss one, or change a rating — tomorrow adapts.' },
              { icon: ShieldCheck, title: 'Private by default', desc: 'Guest mode keeps everything on this device. No setup needed.' },
              { icon: Flame, title: 'Momentum you can feel', desc: 'Quizzes end every slot, topics get covered, streaks grow.' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card/95 p-5 shadow-lift backdrop-blur sm:p-7 lg:mx-0"
        >
          <div className="mb-5">
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              {mode === 'login' ? t('auth.welcomeBack') : t('auth.signupTab')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={showPassword ? t('auth.hide') : t('auth.show')}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </Field>
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full" loading={loading === 'form'}>
                  {loading === 'form' ? t('auth.signingIn') : t('auth.loginTab')}
                  {loading !== 'form' && <ArrowRight className="size-4" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" forceMount className={cn(mode !== 'signup' && 'hidden')}>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
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
                {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>}
                <Button type="submit" className="w-full" loading={loading === 'form'}>
                  {loading === 'form' ? t('auth.creating') : t('auth.signupTab')}
                  {loading !== 'form' && <ArrowRight className="size-4" />}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t('auth.or')}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full border-primary/30 bg-primary-soft text-primary hover:bg-primary/15"
            onClick={handleGuest}
            loading={loading === 'guest'}
          >
            {loading !== 'guest' && <Sparkles className="size-4" />}
            {t('auth.guestButton')}
          </Button>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">{t('auth.guestHint')}</p>
          <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="mr-1 inline size-3.5" /> {t('auth.settingsNote')}
          </p>
        </motion.section>
      </main>
    </div>
  )
}
