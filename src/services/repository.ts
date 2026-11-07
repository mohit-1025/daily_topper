import type { User } from '@supabase/supabase-js'
import type { AppData, AppSession } from '@/types'
import { getFile, putFile, deleteFile, clearFiles } from '@/lib/files'
import { supabase, authRedirectUrl } from '@/services/supabase'

const ACCOUNTS_KEY = 'dt-accounts-v1'
const SESSION_KEY = 'dt-session-v1'
const LEGACY_SUPABASE_SESSION_KEY = 'dt-sb-session-v1'
const GUEST_ID = 'guest'
const storageKey = (userId: string) => `dt-data-${userId}`

export interface SignUpResult {
  session: AppSession | null
  /** True when Supabase needs the emailed link opened before the account works. */
  needsEmailConfirmation: boolean
}

export interface AppRepository {
  mode: 'local' | 'supabase'
  signUp(name: string, email: string, password: string): Promise<SignUpResult>
  signIn(email: string, password: string): Promise<AppSession>
  resendConfirmation(email: string): Promise<void>
  signOut(): Promise<void>
  getSession(): Promise<AppSession | null>
  loadData(userId: string): Promise<AppData | null>
  saveData(userId: string, data: AppData): Promise<void>
  deleteAccount(userId: string): Promise<void>
  putFile(fileId: string, blob: Blob): Promise<void>
  getFile(fileId: string): Promise<Blob | null>
  deleteFile(fileId: string): Promise<void>
  clearFiles(): Promise<void>
}

interface LocalAccount {
  userId: string
  name: string
  email: string
  salt: string
  hash: string
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  if (crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Fallback for non-secure contexts (demo only)
  let hash = 0
  for (const byte of data) hash = (hash << 5) - hash + byte
  return String(hash)
}

function readAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

class LocalRepository implements AppRepository {
  mode = 'local' as const

  async signUp(name: string, email: string, password: string): Promise<SignUpResult> {
    const normalized = email.trim().toLowerCase()
    if (!normalized || !password) throw new Error('Email and password are required')
    const accounts = readAccounts()
    if (accounts.some((a) => a.email === normalized)) {
      throw new Error('An account with this email already exists. Try logging in.')
    }
    const salt = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    const account: LocalAccount = {
      userId: `user_${salt.slice(0, 8)}`,
      name: name.trim(),
      email: normalized,
      salt,
      hash: await hashPassword(password, salt),
    }
    writeAccounts([...accounts, account])
    const session: AppSession = {
      userId: account.userId,
      name: account.name,
      email: account.email,
      guest: false,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return { session, needsEmailConfirmation: false }
  }

  async signIn(email: string, password: string): Promise<AppSession> {
    const normalized = email.trim().toLowerCase()
    const account = readAccounts().find((a) => a.email === normalized)
    if (!account) throw new Error('No account found with that email.')
    const hash = await hashPassword(password, account.salt)
    if (hash !== account.hash) throw new Error('Incorrect password. Please try again.')
    const session: AppSession = {
      userId: account.userId,
      name: account.name,
      email: account.email,
      guest: false,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  }

  async resendConfirmation(): Promise<void> {
    /* Local accounts never need an email confirmation. */
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY)
  }

  async getSession(): Promise<AppSession | null> {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      return JSON.parse(raw) as AppSession
    } catch {
      return null
    }
  }

  async loadData(userId: string): Promise<AppData | null> {
    try {
      const raw = localStorage.getItem(storageKey(userId))
      return raw ? (JSON.parse(raw) as AppData) : null
    } catch {
      return null
    }
  }

  async saveData(userId: string, data: AppData): Promise<void> {
    localStorage.setItem(storageKey(userId), JSON.stringify(data))
  }

  async deleteAccount(userId: string): Promise<void> {
    writeAccounts(readAccounts().filter((a) => a.userId !== userId))
    localStorage.removeItem(storageKey(userId))
    localStorage.removeItem(SESSION_KEY)
  }

  putFile = putFile
  getFile = getFile
  deleteFile = deleteFile
  clearFiles = clearFiles

  static guestId = GUEST_ID
}

type AuthLikeError = { message?: string; code?: string; status?: number }

function friendlyAuthError(error: AuthLikeError): string {
  const code = error.code ?? ''
  const message = (error.message ?? '').toLowerCase()
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the link.'
  }
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'An account with this email already exists. Try logging in.'
  }
  if (code === 'weak_password' || message.includes('password should be')) {
    return 'Choose a stronger password (at least 6 characters).'
  }
  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit')) {
    return 'This project hit its email limit (2 confirmation emails per hour). Please try again a little later, or set up custom SMTP in Supabase.'
  }
  if (code === 'over_request_rate_limit' || message.includes('rate limit')) {
    return 'Too many attempts. Wait a minute and try again.'
  }
  if (code === 'signup_disabled') return 'New signups are currently disabled for this project.'
  if (code === 'email_address_invalid' || message.includes('invalid email')) {
    return 'Enter a valid email address.'
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Could not reach the authentication server. Check your connection and try again.'
  }
  return error.message || 'Authentication failed. Please try again.'
}

class SupabaseRepository implements AppRepository {
  mode = 'supabase' as const
  private client: NonNullable<typeof supabase>

  constructor(client: NonNullable<typeof supabase>) {
    this.client = client
    try {
      localStorage.removeItem(LEGACY_SUPABASE_SESSION_KEY)
    } catch {
      /* storage blocked — nothing to migrate */
    }
  }

  private toSession(user: User): AppSession {
    const metadataName = user.user_metadata?.name
    const name = typeof metadataName === 'string' ? metadataName.trim() : ''
    return {
      userId: user.id,
      name: name || user.email?.split('@')[0] || 'Student',
      email: user.email ?? '',
      guest: false,
    }
  }

  async signUp(name: string, email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await this.client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: authRedirectUrl(),
      },
    })
    if (error) throw new Error(friendlyAuthError(error))
    if (!data.session) {
      if (!data.user) throw new Error('Could not create your account. Please try again.')
      return { session: null, needsEmailConfirmation: true }
    }
    return { session: this.toSession(data.session.user), needsEmailConfirmation: false }
  }

  async signIn(email: string, password: string): Promise<AppSession> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) throw new Error(friendlyAuthError(error))
    if (!data.session) throw new Error('Could not sign you in. Please try again.')
    return this.toSession(data.session.user)
  }

  async resendConfirmation(email: string): Promise<void> {
    const { error } = await this.client.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: authRedirectUrl() },
    })
    if (error) throw new Error(friendlyAuthError(error))
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut()
  }

  async getSession(): Promise<AppSession | null> {
    const { data, error } = await this.client.auth.getSession()
    if (error) {
      console.warn('Supabase session lookup failed', error.message)
      return null
    }
    return data.session?.user ? this.toSession(data.session.user) : null
  }

  async loadData(userId: string): Promise<AppData | null> {
    const { data, error } = await this.client
      .from('app_state')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.warn('Supabase data load failed', error.message)
      return null
    }
    return (data?.data as AppData | undefined) ?? null
  }

  async saveData(userId: string, data: AppData): Promise<void> {
    const { error } = await this.client
      .from('app_state')
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
    if (error) console.warn('Supabase data save failed', error.message)
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.client.from('app_state').delete().eq('user_id', userId)
    await this.signOut()
  }

  async putFile(fileId: string, blob: Blob): Promise<void> {
    const { error } = await this.client.storage.from('uploads').upload(fileId, blob, {
      upsert: true,
      contentType: blob.type || 'application/octet-stream',
    })
    if (error) console.warn('Supabase upload failed', error.message)
  }

  async getFile(fileId: string): Promise<Blob | null> {
    const { data, error } = await this.client.storage.from('uploads').download(fileId)
    return error || !data ? null : data
  }

  async deleteFile(fileId: string): Promise<void> {
    const { error } = await this.client.storage.from('uploads').remove([fileId])
    if (error) console.warn('Supabase file delete failed', error.message)
  }

  async clearFiles(): Promise<void> {
    /* Supabase objects are scoped to the account and removed with it. */
  }
}

export const repo: AppRepository = supabase ? new SupabaseRepository(supabase) : new LocalRepository()

export const GUEST_USER_ID = GUEST_ID
