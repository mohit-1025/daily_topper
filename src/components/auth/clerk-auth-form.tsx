import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSignIn, useSignUp, useUser } from '@clerk/react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { useAppStore } from '@/store/useAppStore'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Mode = 'login' | 'signup'
type Step = 'email' | 'code'
type Pending = 'send' | 'verify' | 'resend' | null

function errorMessage(
  error: { code: string; longMessage?: string; message: string },
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  switch (error.code) {
    case 'form_identifier_not_found':
      return t('auth.noAccountFound')
    case 'form_identifier_exists':
      return t('auth.accountExists')
    case 'form_code_incorrect':
    case 'verification_failed':
      return t('auth.codeIncorrect')
    case 'verification_expired':
      return t('auth.codeExpired')
    case 'too_many_requests':
      return t('auth.tooManyAttempts')
    default:
      return error.longMessage || error.message
  }
}

/**
 * Custom email-code auth built on Clerk's signal hooks, so the card looks like
 * the rest of the notebook instead of Clerk's hosted widgets.
 */
export function ClerkAuthForm({ mode }: { mode: Mode }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const { user } = useUser()
  const session = useAppStore((state) => state.session)

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [pending, setPending] = useState<Pending>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deviceTrust, setDeviceTrust] = useState(false)
  const [verified, setVerified] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const finalizeRef = useRef(false)

  useEffect(() => {
    if (!finishing || !user) return
    if (useAppStore.getState().session?.userId !== user.id) return
    const onboarded = useAppStore.getState().profile?.onboarded
    navigate(onboarded ? '/dashboard' : '/onboarding', { replace: true })
  }, [finishing, user, session, navigate])

  const finish = useCallback(
    async (finalize: () => Promise<{ error: unknown }>) => {
      setFinishing(true)
      const { error: finalizeError } = await finalize()
      if (finalizeError) {
        finalizeRef.current = false
        setFinishing(false)
        setPending(null)
        setError(errorMessage(finalizeError as { code: string; longMessage?: string; message: string }, t))
      }
    },
    [t],
  )

  const missing = signUp.missingFields.join('|')
  const unverified = signUp.unverifiedFields.join('|')

  // Verification resolves asynchronously in Clerk's signals, so completion is
  // driven by the reactive status instead of the value returned by the call.
  useEffect(() => {
    if (!verified || finalizeRef.current) return

    if (mode === 'signup') {
      if (signUp.status === 'complete') {
        finalizeRef.current = true
        void finish(() => signUp.finalize())
      } else if (signUp.status === 'missing_requirements' && !unverified && missing) {
        setVerified(false)
        setPending(null)
        setError(t('auth.genericCodeError'))
      }
      return
    }

    if (signIn.status === 'complete') {
      finalizeRef.current = true
      void finish(() => signIn.finalize())
      return
    }

    if (signIn.status === 'needs_client_trust' && !deviceTrust) {
      setVerified(false)
      setPending('verify')
      void (async () => {
        const sent = await signIn.mfa.sendEmailCode()
        setPending(null)
        if (sent.error) {
          setError(errorMessage(sent.error, t))
          return
        }
        setDeviceTrust(true)
        setCode('')
        setNotice(t('auth.deviceTrust', { email }))
      })()
      return
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_new_password') {
      setVerified(false)
      setPending(null)
      setError(t('auth.genericCodeError'))
    }
  }, [verified, mode, signUp.status, missing, unverified, signIn.status, deviceTrust, email, t, finish])

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const address = email.trim().toLowerCase()
    if (!emailPattern.test(address)) {
      setError(t('auth.emailRequired'))
      return
    }
    if (mode === 'signup' && password.length < 15) {
      setError(t('auth.passwordTooShort'))
      return
    }
    setPending('send')
    try {
      if (mode === 'signup') {
        const created = await signUp.password({ emailAddress: address, password })
        if (created.error) {
          setError(errorMessage(created.error, t))
          return
        }
        const sent = await signUp.verifications.sendEmailCode()
        if (sent.error) {
          setError(errorMessage(sent.error, t))
          return
        }
      } else {
        const sent = await signIn.emailCode.sendCode({ emailAddress: address })
        if (sent.error) {
          setError(errorMessage(sent.error, t))
          return
        }
      }
      setEmail(address)
      setCode('')
      setVerified(false)
      finalizeRef.current = false
      setNotice(t('auth.codeSent', { email: address }))
      setStep('code')
    } finally {
      setPending(null)
    }
  }

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (code.length !== 6) {
      setError(t('auth.codeRequired'))
      return
    }
    finalizeRef.current = false
    setPending('verify')
    try {
      const result =
        mode === 'signup'
          ? await signUp.verifications.verifyEmailCode({ code })
          : deviceTrust
            ? await signIn.mfa.verifyEmailCode({ code })
            : await signIn.emailCode.verifyCode({ code })
      if (result.error) {
        if (result.error.code === 'verification_already_verified') {
          setVerified(true)
          return
        }
        setError(errorMessage(result.error, t))
        return
      }
      setVerified(true)
    } finally {
      setPending(null)
    }
  }

  const resend = async () => {
    setError('')
    setNotice('')
    setVerified(false)
    finalizeRef.current = false
    setPending('resend')
    try {
      const sent = deviceTrust
        ? await signIn.mfa.sendEmailCode()
        : mode === 'signup'
          ? await signUp.verifications.sendEmailCode()
          : await signIn.emailCode.sendCode()
      if (sent.error) {
        setError(errorMessage(sent.error, t))
        return
      }
      setNotice(t('auth.codeSent', { email }))
    } finally {
      setPending(null)
    }
  }

  const startOver = () => {
    setError('')
    setNotice('')
    setCode('')
    setDeviceTrust(false)
    setVerified(false)
    finalizeRef.current = false
    setStep('email')
    if (mode === 'signup') void signUp.reset()
    else void signIn.reset()
  }

  if (finishing) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex size-14 -rotate-2 items-center justify-center rounded-[6px_18px_8px_14px] border-2 border-foreground bg-card shadow-[4px_4px_0_hsl(var(--foreground)/0.28)]">
          <ShieldCheck className="size-7" />
        </div>
        <p className="mt-4 font-display text-xl font-semibold">{t('auth.openingNotebook')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('auth.openingNotebookHint')}</p>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <form onSubmit={verifyCode} className="space-y-4 pt-1" noValidate>
        <div className="flex items-start gap-3 border-2 border-dashed border-border px-3 py-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-[var(--margin-line)]" />
          <div>
            <p className="font-semibold">{t('auth.enterCode')}</p>
            <p className="text-sm leading-6 text-muted-foreground">{notice || t('auth.codeSent', { email })}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="clerk-code">{t('auth.codeLabel')}</Label>
          <Input
            id="clerk-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
            placeholder="000000"
            className="text-center font-mono text-xl tracking-[0.45em]"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              setError('')
            }}
            aria-invalid={Boolean(error)}
          />
        </div>

        <div id="clerk-captcha" />

        {error && (
          <p className="border-l-2 border-[var(--margin-line)] bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={pending === 'verify'}>
          {pending === 'verify' ? t('auth.verifyingCode') : t('auth.verifyCode')}
          {pending !== 'verify' && <ArrowRight className="size-4" />}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={resend}
            disabled={pending !== null}
            className="font-medium underline decoration-dashed underline-offset-4 hover:text-foreground disabled:opacity-50"
          >
            {pending === 'resend' ? t('auth.resending') : t('auth.resendCode')}
          </button>
          <button
            type="button"
            onClick={startOver}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {t('auth.changeEmail')}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="space-y-4 pt-1" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="clerk-email">{t('common.email')}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="clerk-email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="pl-10"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            aria-invalid={Boolean(error)}
          />
        </div>
      </div>

      {mode === 'signup' && (
        <div className="space-y-1.5">
          <Label htmlFor="clerk-password">{t('common.password')}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="clerk-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('auth.passwordHint')}
              className="pl-10 pr-11"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-[4px_9px_5px_8px] text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? t('auth.hide') : t('auth.show')}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      )}

      <div id="clerk-captcha" />

      {error && (
        <p className="border-l-2 border-[var(--margin-line)] bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={pending === 'send'}>
        {pending === 'send' ? t('auth.sendingCode') : t('auth.sendCode')}
        {pending !== 'send' && <ArrowRight className="size-4" />}
      </Button>
      <p className="text-center text-sm leading-6 text-muted-foreground">
        {mode === 'signup' ? t('auth.signupCodeHint') : t('auth.codeInstead')}
      </p>
    </form>
  )
}
