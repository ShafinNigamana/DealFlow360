'use client'

import React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Logo } from '@/components/brand/LogoConcepts'

export const PortalShell: React.FC<{ children: React.ReactNode; customerName?: string }> = ({
  children,
  customerName,
}) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column' }}>
      {/* Portal Top Bar */}
      <header
        style={{
          height: '56px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E4E4E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Logo size={24} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--copper-700)',
                backgroundColor: 'var(--status-pending-subtle)',
                border: '1px solid var(--status-pending-border)',
                padding: '1px 7px',
                borderRadius: '3px',
                letterSpacing: '0.04em',
                marginLeft: '6px',
              }}
            >
              PORTAL
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link
              href="#"
              style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--copper-500)', padding: '4px 8px' }}
            >
              My Quotation
            </Link>
            <Link
              href="#"
              style={{ fontSize: '13px', fontWeight: 500, color: '#71717A', padding: '4px 8px' }}
            >
              Messages
            </Link>
            <Link
              href="#"
              style={{ fontSize: '13px', fontWeight: 500, color: '#71717A', padding: '4px 8px' }}
            >
              Profile
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#71717A' }}>
            Customer: <strong style={{ color: '#18181B' }}>{customerName || 'Customer Portal'}</strong>
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              fontSize: '12px',
              color: '#71717A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
