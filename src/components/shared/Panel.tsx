import { clsx } from 'clsx'
import type { PropsWithChildren, ReactNode } from 'react'

interface PanelProps extends PropsWithChildren {
  title?: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}

export function Panel({ title, eyebrow, action, className, children }: PanelProps) {
  return (
    <section
      className={clsx(
        'rounded-[22px] bg-white/[0.02] px-5 py-4 backdrop-blur-sm',
        className,
      )}
    >
      {(title || eyebrow || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <p className="text-[10px] uppercase tracking-[0.26em] text-chrome/80">{eyebrow}</p> : null}
            {title ? <h3 className="mt-1 font-display text-[1.04rem] font-semibold tracking-[-0.03em] text-white">{title}</h3> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
