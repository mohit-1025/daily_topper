import { ClerkProvider } from '@clerk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import App from './App.tsx'
import { ClerkGate } from './components/auth/clerk-gate'
import { CLERK_PUBLISHABLE_KEY, clerkEnabled } from './services/clerk'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {clerkEnabled ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <ClerkGate>
          <App />
        </ClerkGate>
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
