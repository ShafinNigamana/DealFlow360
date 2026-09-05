import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#18181B' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: `1px solid ${error ? '#EF4444' : '#E4E4E7'}`,
            backgroundColor: '#FFFFFF',
            color: '#18181B',
            outline: 'none',
            transition: 'border-color 0.15s ease',
            width: '100%',
            ...style,
          }}
          {...props}
        />
        {error && <span style={{ fontSize: '11px', color: '#EF4444' }}>{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { label: string; value: string | number }[]
  error?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '12px', fontWeight: 500, color: '#18181B' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: `1px solid ${error ? '#EF4444' : '#E4E4E7'}`,
            backgroundColor: '#FFFFFF',
            color: '#18181B',
            outline: 'none',
            width: '100%',
            cursor: 'pointer',
            ...style,
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span style={{ fontSize: '11px', color: '#EF4444' }}>{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
