import { ArrowRight, Link2 } from 'lucide-react'
import type { DatasetRecord, ProjectRecord, WalletState, WorkflowPosture } from '../../types'
import { Panel } from '../shared/Panel'

interface HeroStripProps {
  project: ProjectRecord
  currentDataset: DatasetRecord
  workflowPosture: WorkflowPosture
  wallet: WalletState
  onConnectWallet: () => Promise<void>
  onEnsureNetwork: () => Promise<void>
}

function getWalletSummary(wallet: WalletState) {
  if (wallet.isConnected && wallet.isCorrectNetwork) return 'Connected. XRPL EVM Testnet ready.'
  if (wallet.isConnected) return 'Connected. Wrong network.'
  return 'Connect MetaMask to enable live actions.'
}

export function HeroStrip({ project, currentDataset, workflowPosture, wallet, onConnectWallet, onEnsureNetwork }: HeroStripProps) {
  const openIssueCount = currentDataset.issues.filter((issue) => issue.state !== 'Resolved').length

  return (
    <section className="grid gap-5 rounded-[28px] bg-[#10161f]/88 p-6 lg:grid-cols-[1.18fr_0.82fr] xl:p-7">
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-chrome/80">Resource Integrity Console</p>
          <h1 className="mt-4 max-w-[13ch] font-display text-[2.7rem] font-semibold leading-[0.96] tracking-[-0.055em] text-white lg:text-[3.4rem]">
            Audit, validate, and approve AI-transformed exploration datasets
          </h1>
          <p className="mt-5 max-w-[52ch] text-[15px] leading-7 text-slate-300">{workflowPosture.heroSummary}</p>
        </div>

        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Project', project.name],
            ['Operator', project.operator],
            ['Region', project.region],
            ['Stage', workflowPosture.stageLabel],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[14px] bg-white/[0.015] px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/75">{label}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5 pt-0.5">
          <button className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4 py-2.5 text-sm font-medium text-black transition duration-200 hover:bg-slate-200">
            View Current Dataset
            <ArrowRight size={14} />
          </button>
          <button className="inline-flex items-center gap-2 rounded-[10px] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-white/[0.05]">
            Compare Versions
            <Link2 size={14} />
          </button>
        </div>
      </div>

      <Panel className="h-full bg-[#0d131b]" eyebrow="Release posture">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Confidence', currentDataset.confidence.toFixed(1)],
            ['Consensus', `${currentDataset.approvals}/${currentDataset.validatorCount}`],
            ['Open flags', String(openIssueCount)],
          ].map(([label, value]) => (
            <div key={label} className="bg-white/[0.018] px-3 py-3">
              <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/75">{label}</p>
              <p className="mt-3 font-display text-[1.65rem] font-semibold tracking-[-0.05em] text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/[0.018] p-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/75">Wallet + network</p>
            <p className="mt-2 max-w-[34ch] text-sm leading-6 text-slate-300">{getWalletSummary(wallet)}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{workflowPosture.chainStatus}</p>
          </div>
          <div className="flex gap-2">
            {!wallet.isConnected ? (
              <button
                onClick={() => void onConnectWallet()}
                disabled={wallet.isBusy}
                className="rounded-[10px] bg-white/[0.03] px-4 py-2 text-sm text-white transition duration-200 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {wallet.isBusy ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : null}
            {wallet.isConnected && !wallet.isCorrectNetwork ? (
              <button
                onClick={() => void onEnsureNetwork()}
                disabled={wallet.isBusy}
                className="rounded-[10px] bg-amber/10 px-4 py-2 text-sm text-amber-200 transition duration-200 hover:bg-amber/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {wallet.isBusy ? 'Switching...' : 'Switch to XRPL EVM Testnet'}
              </button>
            ) : null}
          </div>
        </div>
      </Panel>
    </section>
  )
}
