'use client'

import React, { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          style={{
            padding: '6px 10px',
            fontSize: '12.5px',
            borderRadius: '4px',
            border: `1px solid ${error ? 'var(--status-rejected)' : isFocused ? 'var(--copper-500)' : 'var(--border-subtle)'}`,
            backgroundColor: '#FFFFFF',
            color: 'var(--ink-900)',
            outline: 'none',
            boxShadow: isFocused ? 'var(--focus-ring)' : 'none',
            transition: 'all 180ms ease',
            width: '100%',
            ...style,
          }}
          {...props}
        />
        {error && <span style={{ fontSize: '11px', color: 'var(--status-rejected)' }}>{error}</span>}
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
  ({ label, options, error, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%' }}>
        {label && (
          <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          style={{
            padding: '6px 10px',
            fontSize: '12.5px',
            borderRadius: '4px',
            border: `1px solid ${error ? 'var(--status-rejected)' : isFocused ? 'var(--copper-500)' : 'var(--border-subtle)'}`,
            backgroundColor: '#FFFFFF',
            color: 'var(--ink-900)',
            outline: 'none',
            boxShadow: isFocused ? 'var(--focus-ring)' : 'none',
            transition: 'all 180ms ease',
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
        {error && <span style={{ fontSize: '11px', color: 'var(--status-rejected)' }}>{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
