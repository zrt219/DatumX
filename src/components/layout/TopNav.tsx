import { Bell, Search } from 'lucide-react'
import { clsx } from 'clsx'
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
  if (!wallet.isConnected) {
    return {
      shell: 'border-white/[0.05] bg-white/[0.03] text-slate-300',
      dot: 'bg-slate-400/80 shadow-[0_0_10px_rgba(148,163,184,0.25)]',
    }
  }

  if (wallet.isCorrectNetwork) {
    return {
      shell: 'border-sky-300/10 bg-[linear-gradient(180deg,rgba(80,120,176,0.12),rgba(255,255,255,0.025))] text-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
      dot: 'bg-[#c9f4a0] shadow-[0_0_12px_rgba(201,244,160,0.42)]',
    }
  }

  return {
    shell: 'border-amber-300/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.13),rgba(255,255,255,0.022))] text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
    dot: 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.34)]',
  }
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
  const networkTone = getNetworkTone(wallet)

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
          <div
            className={clsx(
              'relative overflow-hidden rounded-[10px] border px-3 py-2 text-[9px] font-medium uppercase tracking-[0.24em]',
              networkTone.shell,
            )}
          >
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,244,160,0.34),transparent)]" />
            <span className="inline-flex items-center gap-2">
              <span className={clsx('h-1.5 w-1.5 rounded-full', networkTone.dot)} />
              <span>{getNetworkLabel(wallet)}</span>
            </span>
          </div>
          <div className="relative overflow-hidden rounded-[10px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.018))] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.24em] text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(127,184,255,0.22),transparent)]" />
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300/85 shadow-[0_0_10px_rgba(125,211,252,0.28)]" />
              <span>Admin / Validator</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void (wallet.isConnected && !wallet.isCorrectNetwork ? onEnsureNetwork() : onConnectWallet())}
            disabled={wallet.isBusy}
            className="relative overflow-hidden rounded-[10px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] px-3.5 py-2 text-sm text-white transition duration-200 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.028))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,244,160,0.26),transparent)]" />
            <span className="inline-flex items-center gap-2">
              <span
                className={clsx(
                  'h-1.5 w-1.5 rounded-full transition',
                  wallet.isConnected ? 'bg-[#c9f4a0] shadow-[0_0_10px_rgba(201,244,160,0.36)]' : 'bg-slate-400/80 shadow-[0_0_10px_rgba(148,163,184,0.2)]',
                )}
              />
              <span>{wallet.isBusy ? 'Working...' : wallet.isConnected && !wallet.isCorrectNetwork ? 'Switch to XRPL EVM Testnet' : shortenAddress(wallet.account)}</span>
            </span>
          </button>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.015))] text-slate-300 transition duration-200 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.042),rgba(255,255,255,0.024))]"
          >
            <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(127,184,255,0.22),transparent)]" />
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
