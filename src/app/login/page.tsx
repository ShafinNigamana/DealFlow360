'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('rep1@dealflow360.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
      setIsLoading(false)
    }
  }

  const fillQuickUser = (userEmail: string) => {
    setEmail(userEmail)
    setPassword('password123')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#4F46E5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '18px',
              marginBottom: '8px',
            }}
          >
            D
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#18181B' }}>DealFlow360</h1>
          <p style={{ fontSize: '13px', color: '#71717A', marginTop: '4px' }}>
            B2B Sales Operations & Governance Platform
          </p>
        </div>

        {/* Login Form Card */}
        <Card style={{ padding: '28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Email address"
              type="email"
              placeholder="user@dealflow360.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  color: '#B91C1C',
                  fontSize: '12px',
                }}
              >
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={isLoading} style={{ width: '100%', marginTop: '4px' }}>
              Log In
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E4E4E7' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#71717A', marginBottom: '8px', textTransform: 'uppercase' }}>
              Quick Login Demo Presets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                type="button"
                onClick={() => fillQuickUser('rep1@dealflow360.com')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Badge variant="accent">Sales Rep</Badge>
              </button>
              <button
                type="button"
                onClick={() => fillQuickUser('manager@dealflow360.com')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Badge variant="warning">Sales Manager</Badge>
              </button>
              <button
                type="button"
                onClick={() => fillQuickUser('finance@dealflow360.com')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Badge variant="success">Finance</Badge>
              </button>
              <button
                type="button"
                onClick={() => fillQuickUser('admin@dealflow360.com')}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Badge variant="neutral">Admin</Badge>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Note */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#A1A1AA', marginTop: '16px' }}>
          Internal users access Sales Dashboard • Customers land on Quotation Portal
        </p>
      </div>
    </div>
  )
}
