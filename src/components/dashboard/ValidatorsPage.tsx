import type { ValidatorRecord } from '../../types'
import { Panel } from '../shared/Panel'

export function ValidatorsPage({ validators }: { validators: ValidatorRecord[] }) {
  return (
    <Panel title="Validator Network" eyebrow="Active validation seats">
      <div className="space-y-3">
        {validators.map((validator, index) => (
          <div key={validator.id} className="grid gap-3 rounded-[18px] bg-white/[0.025] p-4 transition hover:bg-white/[0.038] lg:grid-cols-[90px_1.05fr_1fr_1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-chrome/76">Rank</p>
              <p className="mt-2 font-display text-[1.28rem] tracking-[-0.04em] text-white">{index + 1}</p>
            </div>
            <div>
              <p className="font-medium text-white">{validator.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{validator.id}</p>
            </div>
            <p className="text-sm text-slate-300">{validator.role}</p>
            <p className="text-sm text-slate-300">{validator.stake}</p>
            <div>
              <p className="text-sm text-white">{validator.approvalRate}% approval rate</p>
              <div className="mt-2 h-[3px] rounded-full bg-white/[0.05]">
                <div className="h-[3px] rounded-full bg-uranium/80" style={{ width: `${validator.approvalRate}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
