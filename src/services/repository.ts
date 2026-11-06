import type { AppData, AppSession } from '@/types'
import { getFile, putFile, deleteFile, clearFiles } from '@/lib/files'

const ACCOUNTS_KEY = 'dt-accounts-v1'
const SESSION_KEY = 'dt-session-v1'
const GUEST_ID = 'guest'
const storageKey = (userId: string) => `dt-data-${userId}`

export interface AppRepository {
  mode: 'local' | 'supabase'
  signUp(name: string, email: string, password: string): Promise<AppSession>
  signIn(email: string, password: string): Promise<AppSession>
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

  async signUp(name: string, email: string, password: string): Promise<AppSession> {
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
    return session
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

interface SupabaseSession {
  access_token: string
  user: { id: string; email?: string; user_metadata?: { name?: string } }
}

class SupabaseRepository implements AppRepository {
  mode = 'supabase' as const
  private url: string
  private key: string
  private sessionStoreKey = 'dt-sb-session-v1'

  constructor(url: string, key: string) {
    this.url = url.replace(/\/$/, '')
    this.key = key
  }

  private headers(extra: Record<string, string> = {}) {
    const session = this.readSession()
    return {
      apikey: this.key,
      Authorization: `Bearer ${session?.access_token ?? this.key}`,
      'Content-Type': 'application/json',
      ...extra,
    }
  }

  private readSession(): SupabaseSession | null {
    try {
      const raw = localStorage.getItem(this.sessionStoreKey)
      return raw ? (JSON.parse(raw) as SupabaseSession) : null
    } catch {
      return null
    }
  }

  private async authRequest<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.url}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: this.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.msg ?? json?.error_description ?? 'Authentication failed')
    return json as T
  }

  private toSession(raw: SupabaseSession, fallbackName = 'Student'): AppSession {
    localStorage.setItem(this.sessionStoreKey, JSON.stringify(raw))
    return {
      userId: raw.user.id,
      name: raw.user.user_metadata?.name?.trim() || fallbackName,
      email: raw.user.email ?? '',
      guest: false,
    }
  }

  async signUp(name: string, email: string, password: string): Promise<AppSession> {
    const raw = await this.authRequest<SupabaseSession>('signup', {
      email,
      password,
      data: { name },
    })
    if (!raw.access_token) {
      throw new Error('Check your email to confirm your account, then log in.')
    }
    return this.toSession(raw, name)
  }

  async signIn(email: string, password: string): Promise<AppSession> {
    const raw = await this.authRequest<SupabaseSession>('token?grant_type=password', {
      email,
      password,
    })
    return this.toSession(raw)
  }

  async signOut(): Promise<void> {
    const session = this.readSession()
    if (session) {
      await fetch(`${this.url}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${session.access_token}`,
        },
      }).catch(() => undefined)
    }
    localStorage.removeItem(this.sessionStoreKey)
  }

  async getSession(): Promise<AppSession | null> {
    const raw = this.readSession()
    if (!raw) return null
    return {
      userId: raw.user.id,
      name: raw.user.user_metadata?.name ?? 'Student',
      email: raw.user.email ?? '',
      guest: false,
    }
  }

  async loadData(userId: string): Promise<AppData | null> {
    const res = await fetch(
      `${this.url}/rest/v1/app_state?user_id=eq.${encodeURIComponent(userId)}&select=data`,
      { headers: this.headers() },
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { data: AppData }[]
    return rows[0]?.data ?? null
  }

  async saveData(userId: string, data: AppData): Promise<void> {
    await fetch(`${this.url}/rest/v1/app_state?on_conflict=user_id`, {
      method: 'POST',
      headers: this.headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify([{ user_id: userId, data, updated_at: new Date().toISOString() }]),
    })
  }

  async deleteAccount(userId: string): Promise<void> {
    await fetch(`${this.url}/rest/v1/app_state?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: this.headers(),
    })
    await this.signOut()
  }

  async putFile(fileId: string, blob: Blob): Promise<void> {
    await fetch(`${this.url}/storage/v1/object/uploads/${fileId}`, {
      method: 'POST',
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.readSession()?.access_token ?? this.key}`,
        'x-upsert': 'true',
        'Content-Type': blob.type || 'application/octet-stream',
      },
      body: blob,
    })
  }

  async getFile(fileId: string): Promise<Blob | null> {
    const res = await fetch(`${this.url}/storage/v1/object/uploads/${fileId}`, {
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.readSession()?.access_token ?? this.key}`,
      },
    })
    return res.ok ? res.blob() : null
  }

  async deleteFile(fileId: string): Promise<void> {
    await fetch(`${this.url}/storage/v1/object/uploads/${fileId}`, {
      method: 'DELETE',
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.readSession()?.access_token ?? this.key}`,
      },
    })
  }

  async clearFiles(): Promise<void> {
    /* Supabase objects are scoped to the account and removed with it. */
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const repo: AppRepository =
  supabaseUrl && supabaseKey
    ? new SupabaseRepository(supabaseUrl, supabaseKey)
    : new LocalRepository()

export const GUEST_USER_ID = GUEST_ID
