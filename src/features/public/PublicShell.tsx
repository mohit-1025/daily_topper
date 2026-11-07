import { Outlet } from 'react-router-dom'
import { PublicFooter } from '@/components/layout/public-footer'
import { PublicHeader } from '@/components/layout/public-header'

export function PublicShell() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      <PublicHeader />
      <main className="ruled-page pb-16">
        <Outlet />
      </main>
      <PublicFooter anchorsFromHome />
    </div>
  )
}
