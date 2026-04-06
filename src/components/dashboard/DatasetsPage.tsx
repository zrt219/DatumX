import { useState } from 'react'
import type { DatasetRecord, DatasetSubmissionDraft, TransactionState, ProjectRecord, WalletState } from '../../types'
import { Panel } from '../shared/Panel'
import { StatusBadge } from '../ui/StatusBadge'

interface DatasetsPageProps {
  project: ProjectRecord
  datasets: DatasetRecord[]
  selectedDataset: DatasetRecord
  search: string
  statusFilter: string
  typeFilter: string
  wallet: WalletState
  protocolMode: 'mock' | 'live-loading' | 'live-ready' | 'live-unavailable'
  submissionState: TransactionState
  getExplorerTxUrl: (txHash: string) => string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: 'All' | DatasetRecord['status']) => void
  onTypeFilterChange: (value: 'All' | DatasetRecord['stage']) => void
  onSelectDataset: (datasetId: string) => void
  onSubmitDataset: (draft: DatasetSubmissionDraft) => Promise<void>
}

interface SubmitDatasetFormProps {
  project: ProjectRecord
  selectedDataset: DatasetRecord
  wallet: WalletState
  protocolMode: 'mock' | 'live-loading' | 'live-ready' | 'live-unavailable'
  submissionState: TransactionState
  getExplorerTxUrl: (txHash: string) => string
  onSubmitDataset: (draft: DatasetSubmissionDraft) => Promise<void>
}

const controlClass =
  'w-full rounded-[14px] bg-white/[0.02] px-4 py-3 text-white outline-none transition placeholder:text-slate-500 hover:bg-white/[0.03] focus:bg-white/[0.035]'

const infoCardClass = 'rounded-[14px] bg-white/[0.02] px-4 py-3.5'

function preview(value: string) {
  if (!value.startsWith('0x') || value.length <= 24) return value
  return `${value.slice(0, 10)}...${value.slice(-6)}`
}

function getProjectSubmissionPrefix(projectKey: string) {
  if (projectKey === 'SHIRLEY_CENTRAL') return 'SC-'
  if (projectKey === 'SHIRLEY_EAST') return 'SE-'
  return 'DC-'
}

const stageFlow: DatasetRecord['stage'][] = [
  'Raw Scan Batch',
  'Extracted Gamma Traces',
  'Interpreted Mineralized Intervals',
  'Composite Summary',
  'Targeting Package',
]

function getNextStage(dataset: DatasetRecord) {
  const currentIndex = stageFlow.indexOf(dataset.stage)
  return stageFlow[Math.min(currentIndex + 1, stageFlow.length - 1)]
}

function TransactionNotice({ state, getExplorerTxUrl }: { state: TransactionState; getExplorerTxUrl: (txHash: string) => string }) {
  if (state.status === 'idle') return null

  const tone =
    state.status === 'success'
      ? 'border-uranium/30 bg-uranium/10 text-green-100'
      : state.status === 'error'
        ? 'border-critical/30 bg-critical/10 text-red-100'
        : 'border-steel/30 bg-steel/10 text-blue-100'

  return (
    <div className={`rounded-[16px] px-4 py-3 text-sm ${tone}`}>
      {state.message}
      {state.txHash ? (
        <a
          href={getExplorerTxUrl(state.txHash)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block font-mono text-xs underline decoration-white/25 underline-offset-4 hover:decoration-white/70"
        >
          {state.txHash}
        </a>
      ) : null}
    </div>
  )
}

function SubmitDatasetForm({
  project,
  selectedDataset,
  wallet,
  protocolMode,
  submissionState,
  getExplorerTxUrl,
  onSubmitDataset,
}: SubmitDatasetFormProps) {
  const nextDatasetStage = getNextStage(selectedDataset)
  const stageLocked = selectedDataset.stage !== 'Targeting Package'
  const [submitForm, setSubmitForm] = useState({
    datasetType: nextDatasetStage,
    uri: 'ipfs://bafybeidatumx-new-package',
    transformHash: '0x44c6f8f9f2aa8f7157ad2ce521fe9d6f38e8b77f89d487bd9dcf2b49e2e3314a',
    parentHash: selectedDataset.transformedHash,
    sourceHash: selectedDataset.transformedHash,
    schemaVersion: selectedDataset.schemaVersion,
    recordCount: String(selectedDataset.holeCount),
    confidence: selectedDataset.confidence.toFixed(1),
  })

  return (
    <form className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Project</span>
        <input value={project.name} readOnly className={controlClass} />
      </label>
      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Dataset Type</span>
        <select
          value={submitForm.datasetType}
          onChange={(event) => setSubmitForm((state) => ({ ...state, datasetType: event.target.value as DatasetRecord['stage'] }))}
          className={controlClass}
          disabled={stageLocked}
        >
          {stageFlow.map((item) => (
            <option key={item} value={item} className="bg-[#10151c]">
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">URI / CID</span>
        <input value={submitForm.uri} onChange={(event) => setSubmitForm((state) => ({ ...state, uri: event.target.value }))} className={controlClass} />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Source Hash</span>
        <input value={submitForm.sourceHash} onChange={(event) => setSubmitForm((state) => ({ ...state, sourceHash: event.target.value }))} className={controlClass} />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Transform Hash</span>
        <input value={submitForm.transformHash} onChange={(event) => setSubmitForm((state) => ({ ...state, transformHash: event.target.value }))} className={controlClass} />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Parent Dataset Hash</span>
        <input value={submitForm.parentHash} onChange={(event) => setSubmitForm((state) => ({ ...state, parentHash: event.target.value }))} className={controlClass} />
      </label>
      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Schema Version</span>
        <input value={submitForm.schemaVersion} onChange={(event) => setSubmitForm((state) => ({ ...state, schemaVersion: event.target.value }))} className={controlClass} />
      </label>
      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Record Count</span>
        <input value={submitForm.recordCount} onChange={(event) => setSubmitForm((state) => ({ ...state, recordCount: event.target.value }))} className={controlClass} />
      </label>
      <label className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Claimed Confidence</span>
        <input value={submitForm.confidence} onChange={(event) => setSubmitForm((state) => ({ ...state, confidence: event.target.value }))} className={controlClass} />
      </label>
      <div className={`${infoCardClass} text-sm leading-6 text-slate-300`}>
        {protocolMode === 'live-ready'
          ? 'Live XRPL submission mode is active. The next valid stage and parent hash are derived from the selected onchain dataset.'
          : 'Mock or unavailable live mode. Submission payloads remain visible for workflow review, but live lineage progression depends on XRPL connectivity.'}
      </div>
      {stageLocked ? (
        <div className={`${infoCardClass} text-sm leading-6 text-slate-300 md:col-span-2`}>
          Next lineage step is locked to <span className="text-white">{nextDatasetStage}</span>. DatumX V5 only permits exact next-stage promotion from a finalized parent dataset.
        </div>
      ) : null}
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            void onSubmitDataset({
              projectKey: project.key,
              datasetType: submitForm.datasetType as DatasetRecord['stage'],
              uri: submitForm.uri,
              sourceHash: submitForm.sourceHash as `0x${string}`,
              transformHash: submitForm.transformHash as `0x${string}`,
              parentDatasetHash: submitForm.parentHash ? (submitForm.parentHash as `0x${string}`) : undefined,
              schemaVersion: Number.parseInt(submitForm.schemaVersion, 10),
              recordCount: Number.parseInt(submitForm.recordCount, 10),
              claimedConfidenceBps: Math.round(Number.parseFloat(submitForm.confidence || '0') * 100),
              submissionId: `${getProjectSubmissionPrefix(project.key)}${selectedDataset.onChainId}-V${selectedDataset.version + 1}`,
            })
          }
          disabled={!wallet.isConnected || !wallet.isCorrectNetwork || submissionState.status === 'pending'}
          className="rounded-[10px] bg-white px-4 py-2.5 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {wallet.isConnected && wallet.isCorrectNetwork ? 'Submit via MetaMask' : 'Wallet required for submit'}
        </button>
        <button type="button" className="rounded-[10px] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.07]">
          Dry-run Adapter Validation
        </button>
      </div>
      <div className="md:col-span-2">
        <TransactionNotice state={submissionState} getExplorerTxUrl={getExplorerTxUrl} />
      </div>
    </form>
  )
}

export function DatasetsPage({
  project,
  datasets,
  selectedDataset,
  search,
  statusFilter,
  typeFilter,
  wallet,
  protocolMode,
  submissionState,
  getExplorerTxUrl,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onSelectDataset,
  onSubmitDataset,
}: DatasetsPageProps) {
  return (
    <div className="space-y-6">
      <Panel title="Dataset Registry" eyebrow={`${project.name} registry`}>
        <div className="grid gap-3 rounded-[16px] bg-white/[0.015] p-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search datasets, hashes, submitters"
            className={controlClass}
          />
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as 'All' | DatasetRecord['status'])} className={controlClass}>
            {['All', 'Draft', 'Submitted', 'In Review', 'Approved', 'Finalized', 'Rejected', 'Challenged', 'Superseded'].map((item) => (
              <option key={item} value={item} className="bg-[#10151c]">
                {item}
              </option>
            ))}
          </select>
          <select value={typeFilter} onChange={(event) => onTypeFilterChange(event.target.value as 'All' | DatasetRecord['stage'])} className={controlClass}>
            {['All', 'Raw Scan Batch', 'Extracted Gamma Traces', 'Interpreted Mineralized Intervals', 'Composite Summary', 'Targeting Package'].map((item) => (
              <option key={item} value={item} className="bg-[#10151c]">
                {item}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <div className="space-y-3">
        {datasets.length === 0 ? (
          <Panel className="bg-[#0f151d]/72">
            <p className="text-sm text-slate-300">No datasets match the active registry filters. Clear search or reset stage and status controls.</p>
          </Panel>
        ) : (
          datasets.map((dataset) => (
            <button key={dataset.id} type="button" onClick={() => onSelectDataset(dataset.id)} className="block w-full text-left">
              <Panel
                className={`transition duration-150 ease-out hover:bg-white/[0.032] ${
                  selectedDataset.id === dataset.id ? 'bg-steel/[0.06] shadow-[inset_0_0_0_1px_rgba(108,145,190,0.16)]' : 'bg-[#0f151d]/80'
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[140px_1fr_1fr_0.9fr_0.8fr_0.8fr_0.9fr] lg:items-center">
                  <div>
                    <p className="font-display text-[1.62rem] tracking-[-0.04em] text-white">{dataset.id}</p>
                    <p className="mt-1 text-sm text-slate-400">On-chain #{dataset.onChainId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">{dataset.stage}</p>
                    <p className="mt-2 text-sm text-slate-300">{preview(dataset.uri)}</p>
                  </div>
                  <div className="space-y-2">
                    <StatusBadge status={dataset.status} />
                    <p className="text-sm text-slate-300">{preview(dataset.transformedHash)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Confidence</p>
                    <p className="mt-2 font-display text-[1.42rem] leading-none tracking-[-0.04em] text-white">{dataset.confidence.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Reviews</p>
                    <p className="mt-2 text-white">
                      {dataset.approvals} / {dataset.rejections}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Submitter</p>
                    <p className="mt-2 text-sm text-white">{dataset.submitter}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Chain state</p>
                    <p className="mt-2 text-sm text-slate-300">{dataset.chainAnchored ? 'XRPL EVM linked' : 'Explorer pending'}</p>
                  </div>
                </div>
              </Panel>
            </button>
          ))
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Inspect Dataset" eyebrow={`${selectedDataset.id} selected`}>
          {protocolMode === 'live-ready' && selectedDataset.onChainId > 0 ? (
            <div className="mb-4 rounded-[14px] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-slate-300">
              Onchain dataset selected. Downstream stages will appear here only after additional lineage datasets are submitted and finalized on XRPL EVM Testnet.
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Project', selectedDataset.projectName],
              ['Dataset Type', selectedDataset.stage],
              ['Status', selectedDataset.status],
              ['Parent', selectedDataset.parentId ?? 'None'],
              ['URI', preview(selectedDataset.uri)],
              ['Transformed Hash', preview(selectedDataset.transformedHash)],
              ['Schema Version', selectedDataset.schemaVersion],
              ['Submission Timestamp', selectedDataset.submittedAt],
            ].map(([label, value]) => (
              <div key={label} className={infoCardClass}>
                <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/76">{label}</p>
                <p className="mt-2 text-sm text-white">{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Submit Next Version" eyebrow="Registry handoff">
          <SubmitDatasetForm
            key={selectedDataset.id}
            project={project}
            selectedDataset={selectedDataset}
            wallet={wallet}
            protocolMode={protocolMode}
            submissionState={submissionState}
            getExplorerTxUrl={getExplorerTxUrl}
            onSubmitDataset={onSubmitDataset}
          />
        </Panel>
      </div>
    </div>
  )
}
