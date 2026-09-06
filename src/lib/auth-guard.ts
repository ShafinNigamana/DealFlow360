import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { AppRole } from '@/types/next-auth'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export type { AppRole }

export async function getAuthSession() {
  return await auth()
}

export async function requireAuth(allowedRoles?: AppRole[]) {
  // 1. Try NextAuth standard session cookie
  let session = await auth()

  // 2. Dev-mode Postman / API test support via headers
  if (!session?.user && process.env.NODE_ENV !== 'production') {
    try {
      const reqHeaders = await headers()
      const userEmail = reqHeaders.get('x-user-email') || reqHeaders.get('x-mock-email')
      const userRole = (reqHeaders.get('x-user-role') || reqHeaders.get('x-mock-role')) as UserRole | null

      if (userEmail) {
        const dbUser = await prisma.user.findUnique({ where: { email: userEmail } })
        if (dbUser) {
          session = {
            user: {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role,
            },
            expires: new Date(Date.now() + 86400000).toISOString(),
          } as any
        }
      } else if (userRole) {
        const dbUser = await prisma.user.findFirst({ where: { role: userRole } })
        if (dbUser) {
          session = {
            user: {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role,
            },
            expires: new Date(Date.now() + 86400000).toISOString(),
          } as any
        }
      }
    } catch {
      // Ignore header parsing errors in non-request contexts
    }
  }

  if (!session || !session.user) {
    return {
      errorResponse: NextResponse.json(
        { 
          error: 'Unauthorized: Authentication required',
          hint: 'In Postman, add header "x-user-email: admin@dealflow360.com" or "x-user-role: ADMIN"' 
        },
        { status: 401 }
      ),
      session: null,
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.user.role)) {
      return {
        errorResponse: NextResponse.json(
          { error: `Forbidden: Insufficient role permissions. Required: ${allowedRoles.join(', ')}` },
          { status: 403 }
        ),
        session: null,
      }
    }
  }

  return { errorResponse: null, session }
}

