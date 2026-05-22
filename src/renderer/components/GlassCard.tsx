import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  heading?: ReactNode
  description?: ReactNode
}

export function GlassCard({ children, className, heading, description }: GlassCardProps): JSX.Element {
  return (
    <section className={`glass-card${className ? ` ${className}` : ''}`}>
      {heading && <h2 className="glass-card__heading">{heading}</h2>}
      {description && <p className="glass-card__description">{description}</p>}
      <div className="glass-card__body">{children}</div>
    </section>
  )
}
