import { useEffect } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/react'
import { Splash } from '@/components/layout/require-auth'
import { registerClerkBridge } from '@/services/clerk'
import { useAppStore } from '@/store/useAppStore'

/** Keeps the Zustand session and Supabase token in sync with Clerk. */
export function ClerkGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()
  const { signOut } = useClerk()

  useEffect(() => {
    registerClerkBridge({
      getToken: () => getToken(),
      signOut: () => signOut({ redirectUrl: '/' }),
      deleteUser: async () => {
        if (user) await user.delete()
      },
    })
    return () => registerClerkBridge(null)
  }, [getToken, signOut, user])

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn && userId) {
      const email = user?.primaryEmailAddress?.emailAddress ?? ''
      const name =
        user?.fullName?.trim() ||
        user?.firstName?.trim() ||
        email.split('@')[0] ||
        'Student'
      void useAppStore.getState().hydrateWithClerk({ userId, name, email })
    } else {
      void useAppStore.getState().hydrateForGuest()
    }
  }, [isLoaded, isSignedIn, userId, user])

  if (!isLoaded) return <Splash />
  return <>{children}</>
}
