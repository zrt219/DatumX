import { lazy, Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { useDrillProof } from './hooks/useDrillProof'
import { useDrillProofTransactions } from './hooks/useDrillProofTransactions'
import { useWallet } from './hooks/useWallet'

const OverviewPage = lazy(async () => ({ default: (await import('./pages/OverviewPage')).OverviewPage }))
const AuditTrailPage = lazy(async () => ({ default: (await import('./components/dashboard/AuditTrailPage')).AuditTrailPage }))
const DatasetsPage = lazy(async () => ({ default: (await import('./components/dashboard/DatasetsPage')).DatasetsPage }))
const GovernancePage = lazy(async () => ({ default: (await import('./components/dashboard/GovernancePage')).GovernancePage }))
const SettingsPage = lazy(async () => ({ default: (await import('./components/dashboard/SettingsPage')).SettingsPage }))
const ValidationPage = lazy(async () => ({ default: (await import('./components/dashboard/ValidationPage')).ValidationPage }))
const ValidatorsPage = lazy(async () => ({ default: (await import('./components/dashboard/ValidatorsPage')).ValidatorsPage }))

function PageFallback() {
  return <div className="rounded-[18px] bg-white/[0.025] px-5 py-4 text-sm text-slate-300">Loading console view...</div>
}

export default function App() {
  const datumx = useDrillProof()
  const { wallet, connectWallet, ensureNetwork } = useWallet()
  const transactions = useDrillProofTransactions(wallet, datumx.refreshLiveState)

  return (
    <AppShell
      activeNav={datumx.activeNav}
      onNavChange={datumx.setActiveNav}
      projects={datumx.projects}
      activeProjectSlug={datumx.projectSlug}
      onProjectChange={datumx.setProjectSlug}
      search={datumx.search}
      onSearchChange={datumx.setSearch}
      wallet={wallet}
      onConnectWallet={connectWallet}
      onEnsureNetwork={ensureNetwork}
    >
      {!wallet.isMetaMaskAvailable ? (
        <div className="flex items-center gap-3 rounded-[18px] bg-amber/10 px-5 py-4 text-sm text-amber-100">
          <AlertTriangle size={18} />
          MetaMask not detected. The UI remains fully explorable in mock mode, but live XRPL EVM wallet actions require a browser wallet.
        </div>
      ) : null}

      {wallet.error ? <div className="rounded-[18px] bg-critical/10 px-5 py-4 text-sm text-red-100">{wallet.error}</div> : null}

      <Suspense fallback={<PageFallback />}>
        {datumx.activeNav === 'overview' ? (
          <OverviewPage
            project={datumx.activeProject}
            workflowPosture={datumx.activeProjectStory.workflowPosture}
            kpis={datumx.kpis}
            currentDataset={datumx.currentDataset}
            lineageDatasets={datumx.lineageDatasets}
            timeline={datumx.timeline}
            comparison={datumx.targetingComparison}
            wallet={wallet}
            onConnectWallet={connectWallet}
            onEnsureNetwork={ensureNetwork}
            getExplorerTxUrl={datumx.getExplorerTxUrl}
          />
        ) : null}

        {datumx.activeNav === 'datasets' ? (
          <DatasetsPage
            project={datumx.activeProject}
            datasets={datumx.filteredDatasets}
            selectedDataset={datumx.selectedDataset}
            search={datumx.search}
            statusFilter={datumx.statusFilter}
            typeFilter={datumx.typeFilter}
            wallet={wallet}
            protocolMode={datumx.protocolMode}
            submissionState={transactions.datasetSubmissionState}
            getExplorerTxUrl={datumx.getExplorerTxUrl}
            onSearchChange={datumx.setSearch}
            onStatusFilterChange={datumx.setStatusFilter}
            onTypeFilterChange={datumx.setTypeFilter}
            onSelectDataset={datumx.setSelectedDatasetId}
            onSubmitDataset={transactions.submitDataset}
          />
        ) : null}

        {datumx.activeNav === 'validation' ? (
          <ValidationPage
            dataset={datumx.currentDataset}
            reviewSubmissionState={transactions.reviewSubmissionState}
            finalizeSubmissionState={transactions.finalizeSubmissionState}
            thresholds={datumx.thresholds}
            getExplorerTxUrl={datumx.getExplorerTxUrl}
            onSubmitReview={transactions.submitReview}
            onFinalizeDataset={transactions.finalizeDataset}
          />
        ) : null}
        {datumx.activeNav === 'validators' ? <ValidatorsPage validators={datumx.validatorsList} /> : null}
        {datumx.activeNav === 'audit' ? <AuditTrailPage events={datumx.timeline} getExplorerTxUrl={datumx.getExplorerTxUrl} /> : null}
        {datumx.activeNav === 'governance' ? <GovernancePage projects={datumx.projects} /> : null}
        {datumx.activeNav === 'settings' ? <SettingsPage compatibilityNotice={datumx.liveCompatibilityNotice} /> : null}
      </Suspense>
    </AppShell>
  )
}
