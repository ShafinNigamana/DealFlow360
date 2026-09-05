'use client'

import { SessionProvider } from 'next-auth/react'

export const NextAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>
}
