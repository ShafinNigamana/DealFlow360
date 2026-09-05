import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: '1px solid #E4E4E7',
        padding: '16px 20px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}
    >
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#18181B' }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: '12px', color: '#71717A', marginTop: '2px' }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
