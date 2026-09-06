'use client'

import React, { useState } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  style = {},
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 600,
    borderRadius: '4px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid transparent',
    outline: 'none',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '14px' : '13px',
    padding: size === 'sm' ? '4px 10px' : size === 'lg' ? '9px 18px' : '6px 14px',
    letterSpacing: '-0.01em',
  }

  let variantStyle: React.CSSProperties = {}

  if (variant === 'primary') {
    variantStyle = {
      backgroundColor: isHovered && !disabled && !isLoading ? 'var(--copper-700)' : 'var(--copper-500)',
      color: '#FFFFFF',
      borderColor: isHovered && !disabled && !isLoading ? 'var(--copper-700)' : 'var(--copper-500)',
    }
  } else if (variant === 'secondary') {
    variantStyle = {
      backgroundColor: isHovered && !disabled && !isLoading ? 'var(--neutral-100)' : '#FFFFFF',
      color: 'var(--ink-900)',
      borderColor: isHovered && !disabled && !isLoading ? 'var(--neutral-300)' : 'var(--neutral-200)',
    }
  } else if (variant === 'danger') {
    variantStyle = {
      backgroundColor: isHovered && !disabled && !isLoading ? 'var(--status-rejected-subtle)' : '#FFFFFF',
      color: 'var(--status-rejected)',
      borderColor: 'var(--status-rejected-border)',
    }
  } else if (variant === 'ghost') {
    variantStyle = {
      backgroundColor: isHovered && !disabled && !isLoading ? 'var(--neutral-100)' : 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    }
  }

  return (
    <button
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ ...baseStyle, ...variantStyle, ...style }}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : null}
      {children}
    </button>
  )
}
