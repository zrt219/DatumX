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
}: OverviewPageProps) {
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
