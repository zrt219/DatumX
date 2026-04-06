import type { DatasetRecord, WorkflowPosture } from '../../types'
import { Panel } from '../shared/Panel'
import { StatusBadge } from '../ui/StatusBadge'

export function TrustScoreCard({ dataset, workflowPosture }: { dataset: DatasetRecord; workflowPosture: WorkflowPosture }) {
  return (
    <Panel title="Trust Score" eyebrow={workflowPosture.trustLabel}>
      <div className="space-y-2.5">
        <p className="font-display text-[4.55rem] font-semibold leading-none tracking-[-0.08em] text-white">{dataset.confidence.toFixed(1)}</p>
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={dataset.status} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{workflowPosture.readinessLabel}</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Finalized</p>
          <p className="mt-1 text-slate-200">{dataset.approvedAt ?? 'Pending final approval'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Supersession risk</p>
          <p className="mt-1 text-slate-200">{dataset.supersessionRisk}</p>
        </div>
      </div>
    </Panel>
  )
}
