import { clsx } from 'clsx'

const logoAsset = new URL('../../../New folder/removed background.png', import.meta.url).href

interface DatumXLogoProps {
  variant?: 'sidebar' | 'topbar'
  className?: string
}

export function DatumXLogo({ variant = 'sidebar', className }: DatumXLogoProps) {
  const sizing = variant === 'sidebar' ? 'w-[204px] md:w-[216px]' : 'w-[96px] md:w-[108px]'

  return (
    <div className={clsx('flex items-center bg-transparent', className)}>
      <svg
        className={clsx('block h-auto select-none', sizing)}
        viewBox="0 0 1024 1024"
        role="img"
        aria-label="DatumX"
        xmlns="http://www.w3.org/2000/svg"
      >
        <image href={logoAsset} width="1024" height="1024" preserveAspectRatio="xMidYMid meet" />
      </svg>
    </div>
  )
}
