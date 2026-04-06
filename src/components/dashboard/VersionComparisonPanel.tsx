import type { ProjectComparison } from '../../types'
import { Panel } from '../shared/Panel'

export function VersionComparisonPanel({ comparison }: { comparison: ProjectComparison }) {
  return (
    <Panel title="Version Comparison" eyebrow={comparison.title}>
      <div className="grid gap-4 xl:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-[18px] bg-white/[0.02] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-chrome/76">{comparison.fromLabel}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{comparison.summaryFrom}</p>
        </div>
        <div className="hidden items-center justify-center xl:flex">
          <div className="h-px w-14 bg-white/10" />
        </div>
        <div className="rounded-[18px] bg-uranium/[0.045] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-chrome/76">{comparison.toLabel}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{comparison.summaryTo}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {comparison.metrics.map((metric) => (
          <div key={metric.label} className="rounded-[16px] bg-white/[0.02] p-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-chrome/72">{metric.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">From {metric.from}</p>
                <p className="mt-1 font-display text-xl tracking-[-0.03em] text-white">{metric.to}</p>
              </div>
              <span className={`text-sm font-medium ${metric.direction === 'up' ? 'text-green-200' : metric.direction === 'down' ? 'text-amber-200' : 'text-slate-300'}`}>
                {metric.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
