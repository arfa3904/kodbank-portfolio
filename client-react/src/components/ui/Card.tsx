import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export default function Card({
  children,
  padded = true,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div className={`ui-card ${padded ? 'ui-card--padded' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}
