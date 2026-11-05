import { ExternalLink, ArrowRight } from 'lucide-react'
import { AuditTimeline } from '../components/dashboard/AuditTimeline'
import { ConsensusPanel } from '../components/dashboard/ConsensusPanel'
import { DatasetDetailCard } from '../components/dashboard/DatasetDetailCard'
import { HeroStrip } from '../components/dashboard/HeroStrip'
import { KpiStrip } from '../components/dashboard/KpiStrip'
import { LineageGraph } from '../components/dashboard/LineageGraph'
import { QcIssuesPanel } from '../components/dashboard/QcIssuesPanel'
import { TrustScoreCard } from '../components/dashboard/TrustScoreCard'
import { ValidationSummaryCard } from '../components/dashboard/ValidationSummaryCard'
import { VersionComparisonPanel } from '../components/dashboard/VersionComparisonPanel'
import type { DatasetRecord, ProjectComparison, ProjectRecord, TimelineEvent, WalletState, WorkflowPosture } from '../types'
import { BOTCHAIN_MAINNET_CONFIG, BOTCHAIN_PILOT_CONFIG } from '../lib/botchainConfig'

interface OverviewPageProps {
  project: ProjectRecord
  workflowPosture: WorkflowPosture
  kpis: Array<{ label: string; value: string }>
  currentDataset: DatasetRecord
  lineageDatasets: DatasetRecord[]
  timeline: TimelineEvent[]
  comparison: ProjectComparison
  wallet: WalletState
  onConnectWallet: () => Promise<void>
  onEnsureNetwork: () => Promise<void>
  getExplorerTxUrl: (txHash: string) => string
  onNavigateToBotChain?: () => void
}

export function OverviewPage({
  project,
  workflowPosture,
  kpis,
  currentDataset,
  lineageDatasets,
  timeline,
  comparison,
  wallet,
  onConnectWallet,
  onEnsureNetwork,
  getExplorerTxUrl,
  onNavigateToBotChain,
}: OverviewPageProps) {
  const mainnetContractAddress = BOTCHAIN_MAINNET_CONFIG.registryAddress || BOTCHAIN_PILOT_CONFIG.mainnetRegistryAddress

  return (
    <div className="space-y-5">
      <HeroStrip
        project={project}
        currentDataset={currentDataset}
        workflowPosture={workflowPosture}
        wallet={wallet}
        onConnectWallet={onConnectWallet}
        onEnsureNetwork={onEnsureNetwork}
      />

      {/* DATUMX × BOT CHAIN MAINNET Banner */}
      <section className="relative overflow-hidden rounded-[20px] border border-sky-400/20 bg-gradient-to-r from-[#0d1c2e]/90 via-[#0a1522]/90 to-[#0e2238]/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-400">Mainnet Ecosystem Expansion</span>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                1 BOT Funded • Deployment Pending
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              DATUMX × BOT CHAIN MAINNET
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              DatumX extends verifiable dataset registration, on-chain integrity checks, and reproducible provenance to BOT Chain Mainnet.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-sky-400 hover:text-sky-300 hover:underline"
              >
                <span>BOT Chain Official</span>
                <ExternalLink size={13} />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-sky-400 hover:text-sky-300 hover:underline"
              >
                <span>BOT Chain Explorer</span>
                <ExternalLink size={13} />
              </a>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">
                Network: <strong className="text-slate-200">BOT Chain Mainnet (Chain ID 677)</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">
                Wallet: <strong className="text-slate-200">0x31A8...b788</strong> (1.0 BOT Verified)
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">
                Contract:{' '}
                {mainnetContractAddress ? (
                  <>
                    <span className="text-emerald-400 font-semibold">Verified on Mainnet</span> (
                    <a
                      href={`https://scan.botchain.ai/address/${mainnetContractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      {mainnetContractAddress.slice(0, 6)}...{mainnetContractAddress.slice(-4)}
                    </a>
                    )
                  </>
                ) : (
                  <>
                    <span className="text-amber-300">Pending Broadcast Authorization</span> (Deterministic:{' '}
                    <a
                      href="https://scan.botchain.ai/address/0xEe555DA23F972c5B09eAd7f9D4B215E640b9E9B7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      0xEe55...E9B7
                    </a>
                    )
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {onNavigateToBotChain ? (
              <button
                type="button"
                onClick={onNavigateToBotChain}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/30"
              >
                <span>Open BOT Chain Console</span>
                <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <KpiStrip kpis={kpis} />

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.34fr)_minmax(340px,0.82fr)]">
        <LineageGraph nodes={lineageDatasets} currentDatasetId={currentDataset.id} />

        <div className="space-y-3.5">
          <TrustScoreCard dataset={currentDataset} workflowPosture={workflowPosture} />
          <ConsensusPanel dataset={currentDataset} />
          <QcIssuesPanel issues={currentDataset.issues} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DatasetDetailCard dataset={currentDataset} />
        <ValidationSummaryCard dataset={currentDataset} />
      </section>

      <VersionComparisonPanel comparison={comparison} />
      <AuditTimeline events={timeline} getExplorerTxUrl={getExplorerTxUrl} />
    </div>
  )
}
