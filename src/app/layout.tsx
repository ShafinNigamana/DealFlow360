import type { Metadata } from 'next'
import './globals.css'
import { NextAuthProvider } from '@/components/providers/NextAuthProvider'

export const metadata: Metadata = {
  title: 'DealFlow360 — B2B Sales Operations Platform',
  description: 'Self-governing B2B sales operations platform for quotation governance, discount risk scoring, multi-warehouse fulfillment, and customer negotiation.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  )
}
