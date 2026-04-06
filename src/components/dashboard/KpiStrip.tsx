export function KpiStrip({ kpis }: { kpis: Array<{ label: string; value: string }> }) {
  return (
    <section className="rounded-[18px] bg-[#111821]/68 px-2.5">
      <div className="grid md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((metric) => (
          <div key={metric.label} className="px-4 py-3 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-white/[0.035]">
            <p className="text-[9px] uppercase tracking-[0.24em] text-chrome/72">{metric.label}</p>
            <p className="mt-2.5 font-display text-[1.82rem] font-semibold leading-none tracking-[-0.055em] text-white">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
