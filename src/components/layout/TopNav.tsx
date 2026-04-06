import { Bell, Search } from 'lucide-react'
import type { ProjectRecord, WalletState } from '../../types'
import { TopRightIdentity } from './TopRightIdentity'

function shortenAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'
}

function getNetworkLabel(wallet: WalletState) {
  if (!wallet.isConnected) return 'Disconnected'
  if (wallet.isCorrectNetwork) return 'XRPL EVM Testnet'
  return 'Wrong network'
}

function getNetworkTone(wallet: WalletState) {
  if (!wallet.isConnected) return 'bg-white/[0.028] text-slate-300'
  if (wallet.isCorrectNetwork) return 'bg-steel/10 text-blue-200'
  return 'bg-amber/10 text-amber-200'
}

interface TopNavProps {
  projects: ProjectRecord[]
  activeProjectSlug: string
  onProjectChange: (slug: ProjectRecord['slug']) => void
  search: string
  onSearchChange: (value: string) => void
  wallet: WalletState
  onConnectWallet: () => Promise<void>
  onEnsureNetwork: () => Promise<void>
}

export function TopNav({
  projects,
  activeProjectSlug,
  onProjectChange,
  search,
  onSearchChange,
  wallet,
  onConnectWallet,
  onEnsureNetwork,
}: TopNavProps) {
  return (
    <header className="grid gap-3 rounded-[22px] bg-[#0f151d]/88 px-4 py-3 backdrop-blur xl:grid-cols-[240px_minmax(360px,1fr)_auto] xl:items-start">
      <div className="flex items-center gap-3 xl:min-w-[230px]">
        <div>
          <p className="text-[9px] uppercase tracking-[0.26em] text-chrome/80">Console</p>
          <p className="text-sm font-medium tracking-[0.01em] text-white">Resource Integrity Console</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 xl:pt-0.5">
        <label className="flex min-w-[220px] items-center gap-3 rounded-[13px] bg-white/[0.02] px-3.5 py-2.5 text-sm text-white">
          <span className="text-[9px] uppercase tracking-[0.26em] text-chrome/75">Project</span>
          <select
            value={activeProjectSlug}
            onChange={(event) => onProjectChange(event.target.value as ProjectRecord['slug'])}
            className="w-full bg-transparent text-white outline-none"
          >
            {projects.map((project) => (
              <option key={project.slug} value={project.slug} className="bg-[#10151c]">
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 items-center gap-3 rounded-[13px] bg-white/[0.02] px-3.5 py-2.5 text-sm text-white">
          <Search size={16} className="text-chrome/80" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search datasets, URIs, submitters"
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 xl:items-end">
        <div className="flex flex-wrap items-center gap-2.5 xl:justify-end">
          <div className={`rounded-[10px] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.24em] ${getNetworkTone(wallet)}`}>
            {getNetworkLabel(wallet)}
          </div>
          <div className="rounded-[10px] bg-white/[0.02] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.24em] text-slate-300">
            Admin / Validator
          </div>
          <button
            type="button"
            onClick={() => void (wallet.isConnected && !wallet.isCorrectNetwork ? onEnsureNetwork() : onConnectWallet())}
            disabled={wallet.isBusy}
            className="rounded-[10px] bg-white/[0.028] px-3.5 py-2 text-sm text-white transition duration-200 hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {wallet.isBusy ? 'Working...' : wallet.isConnected && !wallet.isCorrectNetwork ? 'Switch to XRPL EVM Testnet' : shortenAddress(wallet.account)}
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/[0.02] text-slate-300 transition duration-200 hover:bg-white/[0.04]"
          >
            <Bell size={15} />
          </button>
        </div>
        <div className="xl:self-end">
          <TopRightIdentity />
        </div>
      </div>
    </header>
  )
}
