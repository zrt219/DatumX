import type { TimelineEvent } from '../../types'
import { Panel } from '../shared/Panel'

function previewHash(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`
}

export function AuditTimeline({
  events,
  getExplorerTxUrl,
}: {
  events: TimelineEvent[]
  getExplorerTxUrl: (txHash: string) => string
}) {
  return (
    <Panel title="Audit Timeline" eyebrow="Recent chain and review actions">
      {events.length === 0 ? (
        <div className="rounded-[16px] bg-white/[0.02] px-5 py-6 text-sm leading-7 text-slate-300">
          No timeline events are available yet. Live submissions and validator activity will appear here once protocol state changes are observed.
        </div>
      ) : (
      <div className="relative space-y-3">
        <div className="pointer-events-none absolute bottom-2 left-[74px] top-8 hidden w-px bg-white/[0.05] lg:block" />
        {events.map((event) => (
          <div key={event.id} className="grid gap-3 rounded-[16px] bg-white/[0.02] p-4 transition hover:bg-white/[0.034] lg:grid-cols-[150px_170px_150px_1fr_170px] lg:items-center">
            <p className="text-sm text-slate-400">{event.timestamp}</p>
            <p className="text-sm font-medium text-white">{event.actor}</p>
            <p className={`text-sm ${
              event.type.includes('Approved')
                ? 'text-green-200'
                : event.type.includes('Challenge')
                  ? 'text-amber-200'
                  : event.type.includes('Review')
                    ? 'text-blue-200'
                    : 'text-slate-200'
            }`}>{event.type}</p>
            <p className="text-sm text-slate-300">
              {event.datasetRef} / {event.description}
            </p>
            {event.txHash ? (
              <a
                href={getExplorerTxUrl(event.txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-200 underline-offset-4 transition hover:text-blue-100 hover:underline"
              >
                {previewHash(event.txHash)}
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
