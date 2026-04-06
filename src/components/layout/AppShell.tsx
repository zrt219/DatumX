import type { PropsWithChildren } from 'react'
import type { NavKey, ProjectRecord, WalletState } from '../../types'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

interface AppShellProps extends PropsWithChildren {
  activeNav: NavKey
  onNavChange: (key: NavKey) => void
  projects: ProjectRecord[]
  activeProjectSlug: string
  onProjectChange: (slug: ProjectRecord['slug']) => void
  search: string
  onSearchChange: (value: string) => void
  wallet: WalletState
  onConnectWallet: () => Promise<void>
  onEnsureNetwork: () => Promise<void>
}

export function AppShell({
  activeNav,
  onNavChange,
  projects,
  activeProjectSlug,
  onProjectChange,
  search,
  onSearchChange,
  wallet,
  onConnectWallet,
  onEnsureNetwork,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen px-4 py-5 text-white md:px-6 xl:px-7">
      <div className="mx-auto grid max-w-[1720px] gap-5 xl:grid-cols-[240px_1fr]">
        <Sidebar active={activeNav} onChange={onNavChange} />
        <main className="space-y-5">
          <TopNav
            projects={projects}
            activeProjectSlug={activeProjectSlug}
            onProjectChange={onProjectChange}
            search={search}
            onSearchChange={onSearchChange}
            wallet={wallet}
            onConnectWallet={onConnectWallet}
            onEnsureNetwork={onEnsureNetwork}
          />
          {children}
        </main>
      </div>
    </div>
  )
}
