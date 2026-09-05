'use client'

import React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

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
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              D
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#18181B' }}>DealFlow360 Customer Portal</span>
          </div>

          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link
              href="#"
              style={{ fontSize: '13px', fontWeight: 600, color: '#4F46E5', padding: '4px 8px' }}
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
