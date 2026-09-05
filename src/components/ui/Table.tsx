import React from 'react'

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
        fontSize: '13px',
        ...style,
      }}
    >
      {children}
    </table>
  </div>
)

export const TableHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead style={{ borderBottom: '1px solid #E4E4E7', backgroundColor: '#FAFAFA' }}>
    {children}
  </thead>
)

export const TableHeaderCell: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <th
    style={{
      padding: '10px 12px',
      fontSize: '11px',
      fontWeight: 600,
      color: '#71717A',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
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
}> = ({ children, onClick, style }) => (
  <tr
    onClick={onClick}
    style={{
      borderBottom: '1px solid #F4F4F5',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background-color 0.15s ease',
      ...style,
    }}
  >
    {children}
  </tr>
)

export const TableCell: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <td style={{ padding: '12px', color: '#18181B', verticalAlign: 'middle', ...style }}>
    {children}
  </td>
)
