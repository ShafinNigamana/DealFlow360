'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  FileText,
  CheckCircle,
  Truck,
  Repeat,
  Receipt,
  Activity,
  BarChart3,
  Package,
  Sliders,
  LogOut,
} from 'lucide-react'
import { Logo } from '@/components/brand/LogoConcepts'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['REP', 'MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Quotations', href: '/quotations', icon: FileText, roles: ['REP', 'MANAGER'] },
  { label: 'Approvals', href: '/approvals', icon: CheckCircle, roles: ['MANAGER', 'FINANCE'] },
  { label: 'Fulfillment', href: '/fulfillment', icon: Truck, roles: ['FINANCE', 'ADMIN'] },
  { label: 'Subscriptions', href: '/subscriptions', icon: Repeat, roles: ['FINANCE', 'ADMIN'] },
  { label: 'Invoices', href: '/invoices', icon: Receipt, roles: ['FINANCE', 'ADMIN'] },
  { label: 'Deal Health', href: '/deal-health', icon: Activity, roles: ['MANAGER'] },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['ADMIN'] },
  { label: 'Products', href: '/admin/products', icon: Package, roles: ['ADMIN'] },
  { label: 'Discount Setup', href: '/admin/discount-config', icon: Sliders, roles: ['ADMIN', 'MANAGER'] },
]

export const InternalShell: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => {
  const pathname = usePathname()
  const { data: session } = useSession()

  const userRole = (session?.user?.role as string) || ''
  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole))

  const activeTitle =
    title || navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.label || 'Dashboard'

  if (session && userRole === 'CUSTOMER') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '24px' }}>
        <div style={{ maxWidth: '440px', textAlign: 'center', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Internal Workspace Restricted</h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
            Customer portal accounts cannot access the internal employee workspace. Please use your quotation link to view negotiations.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Persistent Left Sidebar */}
      <aside
        style={{
          width: '220px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E4E4E7',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E4E4E7',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Logo size={24} />
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#4F46E5' : '#71717A',
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                  marginBottom: '2px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? '#4F46E5' : '#71717A'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info & Sign Out */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E4E4E7', backgroundColor: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#4F46E5',
                flexShrink: 0,
              }}
            >
              {(session?.user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {session?.user?.name || 'Alex SalesRep'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: '#E0E7FF', color: '#3730A3', padding: '1px 6px', borderRadius: '4px' }}>
                  {session?.user?.role || 'REP'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#64748B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Quiet Top Bar */}
        <header
          style={{
            height: '52px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E4E4E7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: '#18181B' }}>{activeTitle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                fontWeight: 500,
              }}
            >
              Demo Workspace
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main style={{ flex: 1, padding: '24px' }}>{children}</main>
      </div>
    </div>
  )
}
