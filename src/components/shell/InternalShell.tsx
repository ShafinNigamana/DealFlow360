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

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; color?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Quotations', href: '/quotations', icon: FileText },
  { label: 'Approvals', href: '/approvals', icon: CheckCircle },
  { label: 'Fulfillment', href: '/fulfillment', icon: Truck },
  { label: 'Subscriptions', href: '/subscriptions', icon: Repeat },
  { label: 'Invoices', href: '/invoices', icon: Receipt },
  { label: 'Deal Health', href: '/deal-health', icon: Activity },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Discount Setup', href: '/admin/discount-config', icon: Sliders },
]

export const InternalShell: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title,
}) => {
  const pathname = usePathname()
  const { data: session } = useSession()

  const activeTitle =
    title || navItems.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.label || 'Dashboard'

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
            gap: '8px',
          }}
        >
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
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#18181B', letterSpacing: '-0.02em' }}>
            DealFlow360
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map((item) => {
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
        <div style={{ padding: '12px 16px', borderTop: '1px solid #E4E4E7', backgroundColor: '#FAFAFA' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#18181B' }}>
              {session?.user?.name || 'Internal User'}
            </div>
            <div style={{ fontSize: '11px', color: '#71717A' }}>
              Role: <span style={{ fontWeight: 600, color: '#4F46E5' }}>{session?.user?.role || 'REP'}</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#71717A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            <LogOut size={14} />
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
