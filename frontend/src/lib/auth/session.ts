import { cookies } from 'next/headers'
import type { AuthUser } from '@/components/providers/auth-provider'

// Simple session management for demo purposes
// In production, you'd want to use proper JWT tokens or session management
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie?.value) {
      return null
    }

    // Parse the session cookie (in production, verify JWT or decrypt session)
    const sessionData = JSON.parse(sessionCookie.value)
    
    return {
      email: sessionData.email,
      role: sessionData.role || 'contestant',
      teamId: sessionData.teamId,
      displayName: sessionData.displayName,
    }
  } catch (error) {
    console.error('[Session] Failed to get session user:', error)
    return null
  }
}

export async function setSessionUser(user: AuthUser): Promise<void> {
  const cookieStore = await cookies()
  
  cookieStore.set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}