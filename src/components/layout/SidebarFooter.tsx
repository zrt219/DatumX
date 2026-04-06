export function SidebarFooter() {
  return (
    <div className="mt-auto pt-6">
      <div className="border-t border-white/[0.04] pt-4 text-[10px] tracking-[0.01em] text-slate-600">
        <span className="font-medium text-slate-400">DatumX</span>
        <span className="mx-1.5 text-slate-600">&middot;</span>
        <span>Built by ZRT</span>
        <span className="mx-1.5 text-slate-600">&mdash;</span>{' '}
      <a
        href="https://github.com/zrt219"
        target="_blank"
        rel="noreferrer"
        className="text-slate-400 underline-offset-2 transition hover:text-slate-200 hover:underline"
      >
        github.com/zrt219
      </a>
      </div>
    </div>
  )
}
