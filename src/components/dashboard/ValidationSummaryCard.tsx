import { ArrowUpRight } from 'lucide-react'
import type { DatasetRecord } from '../../types'
import { Panel } from '../shared/Panel'

export function ValidationSummaryCard({ dataset }: { dataset: DatasetRecord }) {
  return (
    <Panel title="Validation Summary" eyebrow="Validator matrix">
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[16px] bg-white/[0.018] p-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">Approvals</p>
          <p className="mt-3 font-display text-[1.85rem] tracking-[-0.04em] text-white">{dataset.approvals}</p>
        </div>
        <div className="rounded-[16px] bg-white/[0.018] p-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">Rejections</p>
          <p className="mt-3 font-display text-[1.85rem] tracking-[-0.04em] text-white">{dataset.rejections}</p>
        </div>
        <div className="rounded-[16px] bg-white/[0.018] p-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">Mean confidence</p>
          <p className="mt-3 font-display text-[1.85rem] tracking-[-0.04em] text-white">{dataset.confidence.toFixed(1)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {dataset.reviews.length === 0 ? (
          <div className="rounded-[16px] bg-white/[0.018] px-4 py-5 text-sm text-slate-300">
            Validator attestations will populate here once the current package enters the active review queue.
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.25fr_0.75fr_0.7fr_0.95fr] gap-3 px-1 text-[10px] uppercase tracking-[0.2em] text-chrome/72 md:grid">
              <span>Validator</span>
              <span>Outcome</span>
              <span>Confidence</span>
              <span>Artifact</span>
            </div>
            {dataset.reviews.map((review) => (
              <div key={review.validatorId} className="grid gap-3 rounded-[16px] bg-white/[0.018] p-4 transition hover:bg-white/[0.03] md:grid-cols-[1.25fr_0.75fr_0.7fr_0.95fr] md:items-center">
                <div>
                  <p className="font-medium text-white">{review.validatorName}</p>
                  <p className="mt-1 text-sm text-slate-400">{review.stake}</p>
                </div>
                <p className={`text-sm font-medium ${review.approved ? 'text-green-200' : 'text-red-200'}`}>{review.approved ? 'Approve' : 'Reject'}</p>
                <p className="font-display text-lg tracking-[-0.03em] text-white">{review.confidence.toFixed(1)}</p>
                <a href={review.reviewUri} className="inline-flex items-center justify-between gap-2 text-sm text-slate-300 transition hover:text-white">
                  <span>Artifact</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            ))}
          </>
        )}
      </div>
    </Panel>
  )
}
