import { useState } from 'react'
import type { ProjectRecord } from '../../types'
import { Panel } from '../shared/Panel'

export function GovernancePage({ projects }: { projects: ProjectRecord[] }) {
  const [thresholds, setThresholds] = useState({
    minValidators: '5',
    approvalRatio: '66.67%',
    minConfidence: '75.0',
  })

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Panel title="Project Management" eyebrow="Protocol control">
        <div className="mb-4 grid gap-4 rounded-[18px] bg-white/[0.025] p-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-chrome/80">Project key</span>
            <input placeholder="SHIRLEY_CENTRAL" className="rounded-[14px] bg-[#0f151d] px-4 py-3 text-white outline-none placeholder:text-slate-500" />
          </label>
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-chrome/80">Adapter address</span>
            <input placeholder="0x..." className="rounded-[14px] bg-[#0f151d] px-4 py-3 text-white outline-none placeholder:text-slate-500" />
          </label>
          <button type="button" className="rounded-[10px] border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-slate-200">
            Register Project
          </button>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.slug} className="grid gap-3 rounded-[18px] bg-white/[0.025] p-4 transition hover:bg-white/[0.036] lg:grid-cols-[1fr_1fr_160px_140px]">
              <div>
                <p className="font-medium text-white">{project.name}</p>
                <p className="mt-1 text-sm text-slate-300">{project.adapter}</p>
              </div>
              <p className="text-sm text-slate-300">{project.jurisdiction} - {project.depositType}</p>
              <div>
                <p className="text-sm text-white">{project.adapterStatus}</p>
                <p className="mt-1 text-sm text-slate-400">{project.stage}</p>
              </div>
              <button type="button" className="rounded-[10px] bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]">
                Toggle Active
              </button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Threshold Controls" eyebrow="Validation module">
        <div className="space-y-4">
          {[
            ['Minimum validators', 'minValidators', 'Seats required before finalization can evaluate quorum.'],
            ['Minimum approval ratio', 'approvalRatio', 'Threshold for protocol approval across active reviews.'],
            ['Minimum aggregate confidence', 'minConfidence', 'Lower bound for accepted dataset confidence.'],
          ].map(([label, key, description]) => (
            <label key={label} className="grid gap-2 rounded-[18px] bg-white/[0.025] p-4">
              <span className="text-[10px] uppercase tracking-[0.22em] text-chrome/80">{label}</span>
              <span className="text-sm text-slate-400">{description}</span>
              <input
                value={thresholds[key as keyof typeof thresholds]}
                onChange={(event) => setThresholds((current) => ({ ...current, [key]: event.target.value }))}
                className="rounded-[14px] bg-[#0f151d] px-4 py-3 text-white outline-none"
              />
            </label>
          ))}
          <button type="button" className="rounded-[10px] border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-slate-200">
            Save Threshold Settings
          </button>
        </div>
      </Panel>
    </div>
  )
}
