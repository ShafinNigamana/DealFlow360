import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

export type AppRole = UserRole | 'CUSTOMER'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name: string
    role: AppRole
  }

  interface Session {
    user: {
      id: string
      role: AppRole
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: AppRole
  }
}

