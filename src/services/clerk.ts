export const CLERK_PUBLISHABLE_KEY = (
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
)?.trim() ?? ''

export const clerkEnabled = CLERK_PUBLISHABLE_KEY.length > 0

interface ClerkBridge {
  getToken: () => Promise<string | null>
  signOut: () => Promise<void>
  deleteUser: () => Promise<void>
}

let bridge: ClerkBridge | null = null

/** Lets non-React modules (Supabase client, store) use the live Clerk session. */
export function registerClerkBridge(next: ClerkBridge | null) {
  bridge = next
}

export function clerkToken(): Promise<string | null> {
  return bridge ? bridge.getToken() : Promise.resolve(null)
}

export function clerkSignOut(): Promise<void> {
  return bridge ? bridge.signOut() : Promise.resolve()
}

export async function clerkDeleteUser(): Promise<void> {
  if (bridge) await bridge.deleteUser()
}
