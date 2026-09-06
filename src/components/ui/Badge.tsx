import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', style }) => {
  let bg = 'var(--neutral-100)'
  let color = 'var(--text-secondary)'
  let border = 'var(--neutral-200)'

  if (variant === 'success') {
    bg = 'var(--status-approved-subtle)'
    color = 'var(--status-approved)'
    border = 'var(--status-approved-border)'
  } else if (variant === 'warning') {
    bg = 'var(--status-pending-subtle)'
    color = 'var(--copper-700)'
    border = 'var(--status-pending-border)'
  } else if (variant === 'danger') {
    bg = 'var(--status-rejected-subtle)'
    color = 'var(--status-rejected)'
    border = 'var(--status-rejected-border)'
  } else if (variant === 'accent') {
    bg = 'var(--status-pending-subtle)'
    color = 'var(--copper-700)'
    border = 'var(--status-pending-border)'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '3px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
