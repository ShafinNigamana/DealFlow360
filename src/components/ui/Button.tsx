import React from 'react'

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
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 500,
    borderRadius: '6px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    border: '1px solid transparent',
    outline: 'none',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13px',
    padding: size === 'sm' ? '4px 10px' : size === 'lg' ? '10px 20px' : '7px 14px',
  }

  let variantStyle: React.CSSProperties = {}

  if (variant === 'primary') {
    variantStyle = {
      backgroundColor: '#4F46E5',
      color: '#FFFFFF',
      borderColor: '#4F46E5',
    }
  } else if (variant === 'secondary') {
    variantStyle = {
      backgroundColor: '#FFFFFF',
      color: '#18181B',
      borderColor: '#E4E4E7',
    }
  } else if (variant === 'danger') {
    variantStyle = {
      backgroundColor: '#FFFFFF',
      color: '#B91C1C',
      borderColor: '#FECACA',
    }
  } else if (variant === 'ghost') {
    variantStyle = {
      backgroundColor: 'transparent',
      color: '#71717A',
      borderColor: 'transparent',
    }
  }

  return (
    <button
      disabled={disabled || isLoading}
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
