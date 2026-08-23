import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { User, UserRole } from '@/types'

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const token = request.headers.get('x-auth-token') || request.nextUrl.searchParams.get('token')
  if (!token) return null

  // Supabase Auth or Session token lookup
  if (supabaseServer) {
    const { data } = await supabaseServer
      .from('users')
      .select('id, email, name, role, tenant_id, active, created_at, updated_at, deleted_at')
      .eq('id', token)
      .is('deleted_at', null)
      .single()

    const user = data as any
    if (user && user.active) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        tenantId: user.tenant_id,
        active: user.active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        deletedAt: user.deleted_at,
      }
    }
  }

  // Fallback to local session store
  const store = getMockStore()
  const session = (store.sessions || []).find((s: any) => s.token === token)
  if (!session) return null

  const user = store.users.find((u: any) => u.id === session.userId && !u.deletedAt && u.active)
  if (!user) return null

  const { password: _, passwordHash: __, ...safeUser } = user
  return safeUser as User
}

export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}
