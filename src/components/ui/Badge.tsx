import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: React.CSSProperties
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', style }) => {
  let bg = '#F4F4F5'
  let color = '#71717A'
  let border = '#E4E4E7'

  if (variant === 'success') {
    bg = '#F0FDF4'
    color = '#15803D'
    border = '#DCFCE7'
  } else if (variant === 'warning') {
    bg = '#FFFBEB'
    color = '#B45309'
    border = '#FEF3C7'
  } else if (variant === 'danger') {
    bg = '#FEF2F2'
    color = '#B91C1C'
    border = '#FEE2E2'
  } else if (variant === 'accent') {
    bg = '#EEF2FF'
    color = '#4F46E5'
    border = '#E0E7FF'
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 500,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
