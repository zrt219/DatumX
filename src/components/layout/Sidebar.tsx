import { Database, FileCheck2, GanttChartSquare, Scale, ScrollText, Settings, ShieldCheck, Cpu } from 'lucide-react'
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
    label: 'Pilot Integrations',
    items: [{ key: 'botchain', label: 'BOT Chain Pilot', icon: Cpu }],
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
    variant: 'xrpl',
  },
  {
    label: 'Wallet',
    value: 'Connected',
  },
  {
    label: 'Registry',
    value: 'Live',
  },
  {
    label: 'Lineage',
    value: 'Partial',
  },
]

export function Sidebar({ active, onChange }: { active: NavKey; onChange: (key: NavKey) => void }) {
  return (
    <aside className="sticky top-5 flex h-fit w-full max-w-[240px] flex-col rounded-[26px] bg-[#0f151d]/92 px-4.5 py-5 backdrop-blur md:min-h-[860px]">
      <div className="border-b border-white/[0.05] pb-5">
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

      <nav className="mt-6 space-y-5">
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

      <div className="system-status">
        <div className="system-status__header">
          <div className="system-status__copy">
            <p className="system-status__title">System Status</p>
            <p className="system-status__subtitle">Protocol posture nominal</p>
          </div>
          <span className="system-status__signal" aria-hidden="true" />
        </div>
        <div className="mt-4 space-y-2.5">
          {systemStatus.map((row) => (
            <div
              key={row.label}
              className={clsx('status-row', row.variant === 'xrpl' && 'status-row--xrpl')}
            >
              <span className="status-row__label">{row.label}</span>
              <span className="status-row__value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <SidebarFooter />
    </aside>
  )
}
