interface MetricCardProps {
  label: string
  value: string
  meta?: string
}

export function MetricCard({ label, value, meta }: MetricCardProps) {
  return (
    <div className="rounded-[16px] bg-[#111821]/72 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)] transition duration-200">
      <p className="text-[9px] uppercase tracking-[0.26em] text-chrome/80">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-[1.7rem] font-semibold tracking-[-0.05em] text-white">{value}</p>
        {meta ? <p className="text-[11px] text-slate-500">{meta}</p> : null}
      </div>
    </div>
  )
}
