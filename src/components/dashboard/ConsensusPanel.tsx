import type { DatasetRecord } from '../../types'
import { Panel } from '../shared/Panel'

export function ConsensusPanel({ dataset }: { dataset: DatasetRecord }) {
  const approvalRatio = dataset.validatorCount === 0 ? 0 : (dataset.approvals / dataset.validatorCount) * 100

  return (
    <Panel title="Consensus Panel" eyebrow="Validator quorum">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Approve</p>
            <p className="mt-2 font-display text-[2.55rem] font-semibold leading-none tracking-[-0.06em] text-white">{dataset.approvals}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Reject</p>
            <p className="mt-2 font-display text-[2.55rem] font-semibold leading-none tracking-[-0.06em] text-white">{dataset.rejections}</p>
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 sm:text-right">{dataset.validatorCount} seats active</p>
      </div>
      <div className="mt-4 space-y-4 border-t border-white/[0.05] pt-4">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
          <span>Finalization</span>
          <span className="text-white">{approvalRatio >= 66 ? 'Quorum satisfied' : 'Awaiting quorum'}</span>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-chrome/75">
            <span>Weighted review bar</span>
            <span>{approvalRatio.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05]">
            <div className={`h-2 rounded-full ${approvalRatio >= 66 ? 'bg-uranium' : 'bg-amber'}`} style={{ width: `${approvalRatio}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Quorum progress</span>
          <span>{dataset.validatorCount} / 6 seats filled</span>
        </div>
      </div>
    </Panel>
  )
}
