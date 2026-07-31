import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  aside?: ReactNode
  className?: string
}

export function ScreenHeader({ title, subtitle, aside, className }: ScreenHeaderProps) {
  return (
    <header className={`screen-header ${className ?? ''}`}>
      <div className="screen-header-main">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {aside && <div className="screen-header-aside">{aside}</div>}
    </header>
  )
}
