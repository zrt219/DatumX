import type { DatasetRecord } from '../../types'
import { Panel } from '../shared/Panel'
import { StatusBadge } from '../ui/StatusBadge'

function preview(value: string) {
  if (!value.startsWith('0x') || value.length <= 24) return value
  return `${value.slice(0, 12)}...${value.slice(-8)}`
}

export function DatasetDetailCard({ dataset }: { dataset: DatasetRecord }) {
  const primaryFields = [
    ['Dataset ID', dataset.id],
    ['Version', `v${dataset.version}`],
    ['Type', dataset.stage],
  ] as const

  const metadataFields = [
    ['Parent', dataset.parentId ?? 'None'],
    ['Hole Count', dataset.holeCount.toLocaleString()],
    ['Schema Version', dataset.schemaVersion],
    ['Submitted By', dataset.submitter],
    ['IPFS CID', preview(dataset.uri)],
    ['Source Hash', preview(dataset.sourceHash)],
    ['Transformed Hash', preview(dataset.transformedHash)],
    ['Submission Timestamp', dataset.submittedAt],
  ] as const

  return (
    <Panel title="Current Dataset Detail" eyebrow={dataset.id}>
      <div className="space-y-3.5">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr_auto]">
          {primaryFields.map(([label, value]) => (
            <div key={label} className="rounded-[16px] bg-white/[0.025] p-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">{label}</p>
              <p className="mt-3 font-display text-[1.22rem] tracking-[-0.04em] text-white">{value}</p>
            </div>
          ))}
          <div className="rounded-[16px] bg-white/[0.025] p-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">Status</p>
            <div className="mt-3">
              <StatusBadge status={dataset.status} />
            </div>
          </div>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2">
          {metadataFields.map(([label, value]) => (
            <div key={label} className="rounded-[16px] bg-white/[0.025] p-4">
              <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">{label}</p>
              <p className="mt-2 text-sm leading-6 text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}
