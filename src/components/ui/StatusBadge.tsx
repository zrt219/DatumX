import { clsx } from 'clsx'
import type { DatasetStatus } from '../../types'

const toneMap: Record<DatasetStatus, string> = {
  Draft: 'border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.022))] text-slate-300',
  Submitted: 'border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.024))] text-slate-200',
  'In Review': 'border-sky-300/10 bg-[linear-gradient(180deg,rgba(80,120,176,0.14),rgba(255,255,255,0.024))] text-blue-200',
  Approved: 'border-uranium/10 bg-[linear-gradient(180deg,rgba(201,244,160,0.12),rgba(255,255,255,0.02))] text-green-200',
  Finalized: 'border-uranium/15 bg-[linear-gradient(180deg,rgba(201,244,160,0.18),rgba(255,255,255,0.025))] text-green-100',
  Rejected: 'border-critical/10 bg-[linear-gradient(180deg,rgba(248,113,113,0.13),rgba(255,255,255,0.022))] text-red-200',
  Challenged: 'border-amber/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(255,255,255,0.022))] text-amber-200',
  Superseded: 'border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.018))] text-slate-400',
}

const dotMap: Record<DatasetStatus, string> = {
  Draft: 'bg-slate-400/80 shadow-[0_0_10px_rgba(148,163,184,0.22)]',
  Submitted: 'bg-slate-200/90 shadow-[0_0_10px_rgba(226,232,240,0.18)]',
  'In Review': 'bg-sky-300/90 shadow-[0_0_10px_rgba(125,211,252,0.28)]',
  Approved: 'bg-[#c9f4a0] shadow-[0_0_10px_rgba(201,244,160,0.3)]',
  Finalized: 'bg-[#c9f4a0] shadow-[0_0_12px_rgba(201,244,160,0.38)]',
  Rejected: 'bg-red-300/90 shadow-[0_0_10px_rgba(252,165,165,0.26)]',
  Challenged: 'bg-amber-300/90 shadow-[0_0_10px_rgba(252,211,77,0.26)]',
  Superseded: 'bg-slate-500/80 shadow-[0_0_10px_rgba(100,116,139,0.2)]',
}

export function StatusBadge({ status }: { status: DatasetStatus }) {
  return (
    <span
      className={clsx(
        'relative inline-flex items-center gap-2 overflow-hidden rounded-[9px] border px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.22em]',
        toneMap[status],
      )}
    >
      <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,244,160,0.24),transparent)]" />
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotMap[status])} />
      {status}
    </span>
  )
}
