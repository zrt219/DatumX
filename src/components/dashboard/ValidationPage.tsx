import { useMemo, useState } from 'react'
import type { LiveProtocolThresholds } from '../../lib/liveProtocol'
import type { DatasetRecord, ReviewSubmissionDraft, TransactionState } from '../../types'
import { Panel } from '../shared/Panel'

const controlClass =
  'w-full rounded-[14px] bg-white/[0.02] px-4 py-3 text-white outline-none transition hover:bg-white/[0.03] focus:bg-white/[0.035]'

function TransactionNotice({
  state,
  getExplorerTxUrl,
}: {
  state: TransactionState
  getExplorerTxUrl: (txHash: string) => string
}) {
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

function approvalRatio(approvals: number, rejections: number) {
  const total = approvals + rejections
  if (total === 0) return 0
  return Math.round((approvals / total) * 10_000)
}

function isConfidenceInputValid(value: string) {
  if (!value.trim()) return false
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
}

function isIpfsUri(value: string) {
  return value.startsWith('ipfs://')
}

export function ValidationPage({
  dataset,
  reviewSubmissionState,
  finalizeSubmissionState,
  thresholds,
  getExplorerTxUrl,
  onSubmitReview,
  onFinalizeDataset,
}: {
  dataset: DatasetRecord
  reviewSubmissionState: TransactionState
  finalizeSubmissionState: TransactionState
  thresholds: LiveProtocolThresholds
  getExplorerTxUrl: (txHash: string) => string
  onSubmitReview: (draft: ReviewSubmissionDraft) => Promise<void>
  onFinalizeDataset: (datasetId: number) => Promise<void>
}) {
  const [decision, setDecision] = useState<'Approve' | 'Reject'>('Approve')
  const [confidence, setConfidence] = useState(dataset.confidence > 0 ? dataset.confidence.toFixed(1) : '')
  const [reviewUri, setReviewUri] = useState('ipfs://datumx-live/xrpl/review-attestation')

  const totalReviews = dataset.approvals + dataset.rejections
  const currentApprovalRatio = approvalRatio(dataset.approvals, dataset.rejections)
  const finalizeReady =
    dataset.status === 'Approved' &&
    totalReviews >= thresholds.minValidatorCount &&
    currentApprovalRatio >= thresholds.minApprovalRatioBps &&
    Math.round(dataset.confidence * 100) >= thresholds.minConfidenceBps

  const reviewDraftReady = isConfidenceInputValid(confidence) && isIpfsUri(reviewUri)

  const finalizeStateNote =
    dataset.status === 'Finalized'
      ? 'Dataset is already finalized onchain.'
      : finalizeReady
        ? 'Dataset satisfies live quorum thresholds and can be finalized by an auditor.'
        : 'Dataset must remain approved and satisfy live quorum thresholds before finalization.'

  const reviewReadinessNote = useMemo(() => {
    if (!reviewUri.trim()) return 'Review URI is required.'
    if (!isIpfsUri(reviewUri)) return 'Review URI should use an ipfs:// address so the review artifact remains portable.'
    if (!isConfidenceInputValid(confidence)) return 'Confidence must be a value between 0.0 and 100.0.'
    return 'Review payload is ready for MetaMask submission.'
  }, [confidence, reviewUri])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Validator Review Panel" eyebrow="Decision surface">
        <form className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Dataset</span>
            <input value={dataset.id} readOnly className={controlClass} />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Decision</span>
            <select
              value={decision}
              onChange={(event) => setDecision(event.target.value as 'Approve' | 'Reject')}
              className={controlClass}
            >
              <option className="bg-[#10151c]">Approve</option>
              <option className="bg-[#10151c]">Reject</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Confidence</span>
            <input
              value={confidence}
              onChange={(event) => setConfidence(event.target.value)}
              placeholder="84.5"
              className={`${controlClass} font-display text-[1.1rem] tracking-[-0.03em]`}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Review URI</span>
            <input
              value={reviewUri}
              onChange={(event) => setReviewUri(event.target.value)}
              placeholder="ipfs://review/validator-attestation"
              className={controlClass}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">Adapter validation feedback</span>
            <textarea
              defaultValue={`${dataset.projectName} adapter checks passed. Payload shape, project key, schema version, and confidence bounds remain consistent with DatumX canonical input requirements.`}
              rows={4}
              className={controlClass}
            />
          </label>
          <div className="rounded-[16px] bg-white/[0.018] p-4 text-sm leading-6 text-slate-300 md:col-span-2">
            Review contribution: one validator, one vote. Live quorum requires at least {thresholds.minValidatorCount}{' '}
            reviews, an approval ratio of {(thresholds.minApprovalRatioBps / 100).toFixed(2)}%, and aggregate
            confidence of {(thresholds.minConfidenceBps / 100).toFixed(2)} or higher.
          </div>
          <div className="rounded-[16px] bg-white/[0.018] p-4 text-sm leading-6 text-slate-300 md:col-span-2">
            {reviewReadinessNote}
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() =>
                void onSubmitReview({
                  datasetId: dataset.onChainId,
                  approved: decision === 'Approve',
                  confidenceBps: Math.round(Number.parseFloat(confidence || '0') * 100),
                  reviewUri,
                })
              }
              disabled={!reviewDraftReady || reviewSubmissionState.status === 'pending'}
              className="rounded-[10px] bg-white px-5 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Review Transaction
            </button>
            <button
              type="button"
              onClick={() => void onFinalizeDataset(dataset.onChainId)}
              disabled={!finalizeReady || finalizeSubmissionState.status === 'pending'}
              className="rounded-[10px] bg-white/[0.08] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finalize Dataset
            </button>
          </div>
          <div className="space-y-3 md:col-span-2">
            <TransactionNotice state={reviewSubmissionState} getExplorerTxUrl={getExplorerTxUrl} />
            <TransactionNotice state={finalizeSubmissionState} getExplorerTxUrl={getExplorerTxUrl} />
          </div>
        </form>
      </Panel>

      <Panel title="Live Review State" eyebrow="Quorum context">
        <div className="space-y-4">
          <div className="rounded-[16px] bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Current package</p>
            <p className="mt-2 font-display text-[1.22rem] tracking-[-0.04em] text-white">{dataset.id}</p>
            <p className="mt-1 text-sm text-slate-400">{dataset.stage} · {dataset.status}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[16px] bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Accepted range</p>
              <p className="mt-2 text-sm text-white">0.00 to 100.00 confidence</p>
              <p className="mt-1 text-sm text-slate-400">
                Finalize threshold: {(thresholds.minConfidenceBps / 100).toFixed(2)} aggregate confidence.
              </p>
            </div>
            <div className="rounded-[16px] bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Review posture</p>
              <p className="mt-2 text-sm text-white">{totalReviews} live reviews</p>
              <p className="mt-1 text-sm text-slate-400">
                {dataset.approvals} approve / {dataset.rejections} reject
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[16px] bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Approval ratio</p>
              <p className="mt-2 text-sm text-white">{(currentApprovalRatio / 100).toFixed(2)}%</p>
              <p className="mt-1 text-sm text-slate-400">
                Threshold: {(thresholds.minApprovalRatioBps / 100).toFixed(2)}%
              </p>
            </div>
            <div className="rounded-[16px] bg-white/[0.02] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Finalize readiness</p>
              <p className="mt-2 text-sm text-white">{finalizeReady ? 'Ready now' : 'Not ready yet'}</p>
              <p className="mt-1 text-sm text-slate-400">{finalizeStateNote}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm leading-7 text-slate-300">
            <p>One review per validator is enforced at the protocol layer. Each submission directly contributes to final quorum outcome.</p>
            <p>
              Finalization remains auditor-gated even after approval quorum is reached. This surface reads live XRPL protocol state first, while narrative context stays fixture-enriched only where the contracts do not expose prose-level metadata.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
