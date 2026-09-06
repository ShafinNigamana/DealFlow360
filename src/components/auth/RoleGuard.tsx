'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid #E2E8F0',
              borderTopColor: '#4F46E5',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Verifying access permissions...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const userRole = (session?.user?.role as string) || ''

  if (!allowedRoles.includes(userRole)) {
    if (fallback) return <>{fallback}</>

    // Default Access Denied display
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '55vh',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
          Access Restricted
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '420px', lineHeight: '1.5', marginBottom: '20px' }}>
          Your current role (<strong style={{ color: '#0F172A' }}>{userRole || 'UNKNOWN'}</strong>) does not have
          permission to access this section.
        </p>
        <button
          onClick={() => {
            if (userRole === 'CUSTOMER') {
              router.push('/login')
            } else {
              router.push('/dashboard')
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <ArrowLeft size={15} />
          <span>{userRole === 'CUSTOMER' ? 'Back to Portal / Sign In' : 'Return to Dashboard'}</span>
        </button>
      </div>
    )
  }

  return <>{children}</>
}
