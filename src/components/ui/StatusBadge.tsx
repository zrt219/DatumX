import { clsx } from 'clsx'
import type { DatasetStatus } from '../../types'

const toneMap: Record<DatasetStatus, string> = {
  Draft: 'bg-white/[0.045] text-slate-300',
  Submitted: 'bg-white/[0.05] text-slate-200',
  'In Review': 'bg-steel/12 text-blue-200',
  Approved: 'bg-uranium/12 text-green-200',
  Finalized: 'bg-uranium/18 text-green-100',
  Rejected: 'bg-critical/12 text-red-200',
  Challenged: 'bg-amber/12 text-amber-200',
  Superseded: 'bg-white/[0.045] text-slate-400',
}

export function StatusBadge({ status }: { status: DatasetStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-[9px] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.22em]',
        toneMap[status],
      )}
    >
      {status}
    </span>
  )
}
