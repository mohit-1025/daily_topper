import { createClient } from '@supabase/supabase-js'
import { clerkToken } from '@/services/clerk'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        // Clerk is the identity provider; Supabase verifies its session token.
        accessToken: () => clerkToken(),
      })
    : null
