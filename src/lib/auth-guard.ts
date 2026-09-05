import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function getAuthSession() {
  return await auth()
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await auth()

  if (!session || !session.user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
      session: null,
    }
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.user.role)) {
      return {
        errorResponse: NextResponse.json(
          { error: 'Forbidden: Insufficient role permissions' },
          { status: 403 }
        ),
        session: null,
      }
    }
  }

  return { errorResponse: null, session }
}
