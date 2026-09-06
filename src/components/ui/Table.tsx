'use client'

import React, { useState } from 'react'

export const Table: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div style={{ overflowX: 'auto', width: '100%' }}>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '12.5px',
        ...style,
      }}
    >
      {children}
    </table>
  </div>
)

export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--neutral-100)' }}>
    {children}
  </thead>
)

export const TableHeaderCell: React.FC<{
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  style?: React.CSSProperties
}> = ({ children, align = 'left', style }) => (
  <th
    style={{
      padding: '7px 10px',
      fontSize: '10.5px',
      fontWeight: 700,
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      textAlign: align,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </th>
)

export const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody>{children}</tbody>
)

export const TableRow: React.FC<{
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
}> = ({ children, onClick, style }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isHovered && onClick ? 'var(--neutral-100)' : 'transparent',
        transition: 'background-color 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        ...style,
      }}
    >
      {children}
    </tr>
  )
}

export const TableCell: React.FC<{
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  style?: React.CSSProperties
}> = ({ children, align = 'left', style }) => (
  <td
    style={{
      padding: '8px 10px',
      color: 'var(--ink-900)',
      verticalAlign: 'middle',
      textAlign: align,
      ...style,
    }}
  >
    {children}
  </td>
)
