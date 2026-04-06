import type { IssueRecord } from '../../types'
import { Panel } from '../shared/Panel'

const severityTone = {
  Low: 'border-white/10 bg-white/[0.03] text-slate-300',
  Moderate: 'border-amber/30 bg-amber/10 text-amber-200',
  High: 'border-critical/30 bg-critical/10 text-red-200',
} as const

export function QcIssuesPanel({ issues }: { issues: IssueRecord[] }) {
  return (
    <Panel title="Open QC Issues" eyebrow="Current watchlist">
      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="rounded-[16px] bg-white/[0.02] px-4 py-3.5">
            <div className="space-y-2">
              <p className="text-sm font-medium leading-6 text-white">{issue.title}</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${severityTone[issue.severity]}`}>
                  {issue.severity}
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {issue.id} - {issue.owner}
                </p>
              </div>
            </div>
            <p className="mt-2.5 text-sm leading-6 text-slate-300">{issue.summary}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
