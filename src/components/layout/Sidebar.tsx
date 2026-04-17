import { ChevronDown, Database, FileCheck2, GanttChartSquare, Scale, ScrollText, Settings, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import type { NavKey } from '../../types'
import { datumTagline } from '../../content/settingsContent'
import { DatumXLogo } from './DatumXLogo'
import { SidebarFooter } from './SidebarFooter'

const navGroups = [
  {
    label: 'Primary',
    items: [
      { key: 'overview', label: 'Overview', icon: GanttChartSquare },
      { key: 'datasets', label: 'Datasets', icon: Database },
      { key: 'validation', label: 'Validation', icon: ShieldCheck },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'validators', label: 'Validators', icon: FileCheck2 },
      { key: 'audit', label: 'Audit Trail', icon: ScrollText },
      { key: 'governance', label: 'Governance', icon: Scale },
    ],
  },
  {
    label: 'System',
    items: [{ key: 'settings', label: 'Settings', icon: Settings }],
  },
] satisfies Array<{
  label: string
  items: Array<{ key: NavKey; label: string; icon: typeof GanttChartSquare }>
}>

const systemStatus = [
  {
    label: 'Network',
    value: 'XRPL EVM (Testnet)',
    tone: 'bg-sky-300/80 shadow-[0_0_10px_rgba(125,211,252,0.38)]',
    valueClass: 'text-slate-100',
  },
  {
    label: 'Wallet',
    value: 'Connected',
    tone: 'bg-[#c9f4a0] shadow-[0_0_12px_rgba(201,244,160,0.42)]',
    valueClass: 'text-[#dff6c8]',
  },
  {
    label: 'Registry',
    value: 'Live',
    tone: 'bg-emerald-300/85 shadow-[0_0_12px_rgba(110,231,183,0.38)]',
    valueClass: 'text-emerald-100',
  },
  {
    label: 'Lineage',
    value: 'Partial',
    tone: 'bg-amber-300/85 shadow-[0_0_12px_rgba(252,211,77,0.34)]',
    valueClass: 'text-amber-100',
    hint: 'Root-to-child lineage proofs are live on XRPL. Deeper downstream continuity and richer narrative metadata remain partially enriched.',
  },
]

export function Sidebar({ active, onChange }: { active: NavKey; onChange: (key: NavKey) => void }) {
  const [isLineageExpanded, setIsLineageExpanded] = useState(false)

  return (
    <aside className="sticky top-5 flex h-fit w-full max-w-[240px] flex-col rounded-[26px] bg-[#0f151d]/92 px-4.5 py-5 backdrop-blur md:min-h-[860px]">
      <div className="border-b border-white/[0.05] pb-6">
        <div className="space-y-2.5">
          <span className="sr-only">DatumX</span>
          <DatumXLogo variant="sidebar" className="-ml-1" />
          <div className="space-y-1 pl-1">
            <p className="text-[15px] font-semibold tracking-[0.01em] text-white">DatumX</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Resource Integrity Console</p>
            <p className="sr-only">{datumTagline}</p>
          </div>
        </div>
      </div>

      <nav className="mt-7 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = active === item.key

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onChange(item.key)}
                    className={clsx(
                      'group relative flex w-full items-center gap-3 rounded-[13px] px-3.5 py-2.5 text-left transition duration-200',
                      isActive
                        ? 'bg-white/[0.045] text-white'
                        : 'text-slate-400/88 hover:bg-white/[0.02] hover:text-slate-200',
                    )}
                  >
                    <span
                      className={clsx(
                        'absolute inset-y-2 left-0 w-[3px] rounded-full transition',
                        isActive ? 'bg-amber/80' : 'bg-transparent',
                      )}
                    />
                    <Icon size={17} className={clsx('transition', isActive ? 'text-white' : 'text-slate-400/75 group-hover:text-slate-200')} />
                    <span className="text-[15px] font-medium tracking-[0.01em]">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative mt-8 overflow-hidden rounded-[20px] border border-white/[0.06] bg-[radial-gradient(circle_at_top_right,rgba(201,244,160,0.09),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.018))] p-4.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,244,160,0.42),transparent)]" />
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 pl-[1px]">
            <p className="text-[10px] uppercase tracking-[0.26em] text-chrome/80">System Status</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Protocol posture nominal</p>
          </div>
          <div className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute h-5 w-5 rounded-full border border-[#d8f7b7]/30 bg-[#d8f7b7]/[0.06]" />
            <span className="absolute h-3.5 w-3.5 animate-pulse rounded-full bg-[#c9f4a0]/15" />
            <span className="h-2 w-2 rounded-full bg-[#c9f4a0] shadow-[0_0_12px_rgba(201,244,160,0.45)]" />
          </div>
        </div>
        <div className="relative mt-4 space-y-2.5 pl-3">
          <div className="pointer-events-none absolute bottom-3 left-[5px] top-3 w-px bg-[linear-gradient(180deg,rgba(201,244,160,0.28),rgba(255,255,255,0.04),rgba(252,211,77,0.2))]" />
          <div className="status-scan-bead pointer-events-none absolute left-[1px] top-3 h-3 w-3 rounded-full border border-[#d8f7b7]/35 bg-[#d8f7b7]/10" />
          {systemStatus.map((row) => (
            <div key={row.label} className="space-y-1.5">
              {row.hint ? (
                <button
                  type="button"
                  onClick={() => setIsLineageExpanded((current) => !current)}
                  className="group relative flex w-full items-center justify-between gap-3 rounded-[12px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(0,0,0,0.08))] px-3 py-2.5 text-[12px] leading-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:border-white/[0.08] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.034),rgba(0,0,0,0.1))]"
                >
                  <span className="pointer-events-none absolute -left-[15px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[#0f151d] bg-[#0f151d] shadow-[0_0_0_2px_rgba(255,255,255,0.03)]" />
                  <span className={`pointer-events-none absolute -left-[13px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${row.tone}`} />
                  <span className="pl-[1px] uppercase tracking-[0.14em] text-slate-500 transition group-hover:text-slate-400">{row.label}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className={`text-right font-medium ${row.valueClass}`}>{row.value}</span>
                    <ChevronDown
                      size={14}
                      className={clsx(
                        'text-slate-500 transition duration-200',
                        isLineageExpanded ? 'rotate-180 text-slate-300' : 'group-hover:text-slate-300',
                      )}
                    />
                  </span>
                </button>
              ) : (
                <div className="group relative flex items-center justify-between gap-3 rounded-[12px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(0,0,0,0.08))] px-3 py-2.5 text-[12px] leading-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-200 hover:border-white/[0.08] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.034),rgba(0,0,0,0.1))]">
                  <span className="pointer-events-none absolute -left-[15px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[#0f151d] bg-[#0f151d] shadow-[0_0_0_2px_rgba(255,255,255,0.03)]" />
                  <span className={`pointer-events-none absolute -left-[13px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${row.tone}`} />
                  <span className="pl-[1px] uppercase tracking-[0.14em] text-slate-500 transition group-hover:text-slate-400">{row.label}</span>
                  <span className={`text-right font-medium ${row.valueClass}`}>{row.value}</span>
                </div>
              )}
              {row.hint && isLineageExpanded ? (
                <div className="status-hint-enter ml-3 rounded-[11px] border border-amber-200/10 bg-amber-200/[0.04] px-3 py-2.5 text-[11px] leading-5 text-slate-400">
                  {row.hint}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <SidebarFooter />
    </aside>
  )
}
