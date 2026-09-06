'use client'

import React, { useState } from 'react'
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
  { label: 'Quotations', href: '/quotations', icon: FileText, roles: ['REP', 'MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Approvals', href: '/approvals', icon: CheckCircle, roles: ['MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Fulfillment', href: '/fulfillment', icon: Truck, roles: ['REP', 'MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Subscriptions', href: '/subscriptions', icon: Repeat, roles: ['REP', 'MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Invoices', href: '/invoices', icon: Receipt, roles: ['REP', 'MANAGER', 'FINANCE', 'ADMIN'] },
  { label: 'Deal Health', href: '/deal-health', icon: Activity, roles: ['REP', 'MANAGER', 'ADMIN'] },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['ADMIN'] },
  { label: 'Products', href: '/admin/products', icon: Package, roles: ['ADMIN'] },
  { label: 'Discount Setup', href: '/admin/discount-config', icon: Sliders, roles: ['ADMIN', 'MANAGER'] },
]

const NavLink: React.FC<{
  item: NavItem
  isActive: boolean
}> = ({ item, isActive }) => {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 14px',
        borderLeft: isActive ? '3px solid var(--copper-500)' : '3px solid transparent',
        fontSize: '12.5px',
        fontWeight: isActive ? 600 : 500,
        color: isActive || isHovered ? '#FFFFFF' : 'var(--sidebar-text)',
        backgroundColor: isActive
          ? 'rgba(192, 133, 82, 0.10)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.04)'
          : 'transparent',
        marginBottom: '2px',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      }}
    >
      <Icon size={15} color={isActive ? 'var(--copper-500)' : isHovered ? '#FFFFFF' : 'var(--sidebar-text)'} />
      <span>{item.label}</span>
    </Link>
  )
}

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--canvas-bg)', padding: '24px' }}>
        <div style={{ maxWidth: '440px', textAlign: 'center', backgroundColor: 'var(--surface-card)', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink-900)', marginBottom: '8px' }}>Internal Workspace Restricted</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
            Customer portal accounts cannot access the internal employee workspace. Please use your quotation link to view negotiations.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              padding: '7px 16px',
              backgroundColor: 'var(--copper-500)',
              color: '#FFFFFF',
              borderRadius: '4px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 180ms ease',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--canvas-bg)' }}>
      {/* Persistent Left Sidebar — Ink-900 Dark Architecture */}
      <aside
        style={{
          width: '210px',
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
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
            padding: '14px 16px',
            borderBottom: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div>
            <Logo size={22} dark={true} />
          </div>
        </div>

        {/* Dense Section Label */}
        <div style={{ padding: '12px 14px 6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-400)' }}>
          Operations Console
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto' }}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return <NavLink key={item.href} item={item} isActive={isActive} />
          })}
        </nav>

        {/* User Info & Sign Out Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sidebar-border)', backgroundColor: 'var(--ink-800)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '3px',
                backgroundColor: 'var(--ink-700)',
                border: '1px solid var(--copper-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--copper-300)',
                flexShrink: 0,
              }}
            >
              {(session?.user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {session?.user?.name || 'Alex SalesRep'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                <span style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', backgroundColor: 'rgba(192, 133, 82, 0.15)', color: 'var(--copper-300)', padding: '0 5px', borderRadius: '2px', border: '1px solid rgba(192, 133, 82, 0.3)' }}>
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
              fontSize: '11.5px',
              fontWeight: 500,
              color: 'var(--sidebar-text)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 0',
              transition: 'color 180ms ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--status-rejected)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--sidebar-text)')}
          >
            <LogOut size={12} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: '210px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Quiet Top Bar */}
        <header
          style={{
            height: '46px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-900)', letterSpacing: '-0.01em' }}>{activeTitle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '3px',
                backgroundColor: 'var(--status-pending-subtle)',
                color: 'var(--copper-700)',
                border: '1px solid var(--status-pending-border)',
                fontWeight: 600,
              }}
            >
              Enterprise Demo
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main style={{ flex: 1, padding: '16px 20px' }}>{children}</main>
      </div>
    </div>
  )
}
