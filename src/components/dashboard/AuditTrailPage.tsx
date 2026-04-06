import type { TimelineEvent } from '../../types'
import { Panel } from '../shared/Panel'

export function AuditTrailPage({ events, getExplorerTxUrl }: { events: TimelineEvent[]; getExplorerTxUrl: (txHash: string) => string }) {
  return (
    <Panel title="Audit Trail" eyebrow="Forensic ledger">
      {events.length === 0 ? (
        <div className="rounded-[18px] bg-white/[0.025] px-5 py-6 text-sm leading-7 text-slate-300">
          No audit events are available for this project yet. When live submissions, validator reviews, or approval state changes are observed, they will appear here.
        </div>
      ) : (
      <div className="relative space-y-3">
        <div className="pointer-events-none absolute bottom-2 left-[78px] top-10 hidden w-px bg-white/[0.05] lg:block" />
        <div className="hidden grid-cols-[160px_150px_1fr_180px] gap-3 px-1 text-[10px] uppercase tracking-[0.2em] text-chrome/75 lg:grid">
          <span>Timestamp</span>
          <span>Event</span>
          <span>Actor / Reference</span>
          <span>Transaction</span>
        </div>
        {events.map((event) => (
          <div key={event.id} className="grid gap-3 rounded-[18px] bg-white/[0.025] p-4 transition hover:bg-white/[0.038] lg:grid-cols-[160px_150px_1fr_180px]">
            <p className="text-sm text-slate-300">{event.timestamp}</p>
            <p className={`text-sm font-medium ${
              event.type.includes('Approved')
                ? 'text-green-200'
                : event.type.includes('Challenge')
                  ? 'text-amber-200'
                  : event.type.includes('Review')
                    ? 'text-blue-200'
                    : 'text-slate-100'
            }`}>{event.type}</p>
            <div>
              <p className="text-sm text-white">{event.actor}</p>
              <p className="mt-1 text-sm text-slate-300">{event.datasetRef} / {event.description}</p>
            </div>
            {event.txHash ? (
              <a href={getExplorerTxUrl(event.txHash)} target="_blank" rel="noreferrer" className="text-sm text-blue-200 underline-offset-4 hover:underline">
                {event.txHash.slice(0, 12)}...{event.txHash.slice(-8)}
              </a>
            ) : (
              <span className="text-sm text-slate-500">State-derived event</span>
            )}
          </div>
        ))}
      </div>
      )}
    </Panel>
  )
}
