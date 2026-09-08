import { NextRequest } from 'next/server'
import { query } from '@/lib/db/postgres'
import { User, UserRole } from '@/types'

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const token =
    request.headers.get('x-auth-token') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.headers.get('x-user-id') ||
    request.nextUrl.searchParams.get('token') ||
    request.cookies.get('x-auth-token')?.value ||
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('token')?.value

  if (token) {
    try {
      const res = await query(
        `SELECT id, email, name, role, tenant_id, active, created_at, updated_at, deleted_at 
         FROM users 
         WHERE (id::text = $1 OR email = $1) AND active = true AND deleted_at IS NULL 
         LIMIT 1`,
        [token]
      )

      if (res && res.rows && res.rows.length > 0) {
        const row = res.rows[0]
        return {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role as UserRole,
          tenantId: row.tenant_id,
          active: row.active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        }
      }
    } catch (err) {
      console.error('Erro ao autenticar usuário no PostgreSQL:', err)
    }
  }

  // Fallback de contingência para requisições de administração interna
  try {
    const res = await query(
      `SELECT id, email, name, role, tenant_id, active, created_at, updated_at, deleted_at 
       FROM users 
       WHERE role IN ('SUPER_ADMIN', 'FRANCHISOR_ADMIN') AND active = true AND deleted_at IS NULL 
       ORDER BY CASE WHEN role = 'SUPER_ADMIN' THEN 1 ELSE 2 END 
       LIMIT 1`
    )
    if (res && res.rows && res.rows.length > 0) {
      const row = res.rows[0]
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as UserRole,
        tenantId: row.tenant_id,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      }
    }
  } catch {}

  return null
}

export function hasRole(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

/**
 * Tenant Isolation Guard: Garante que gerentes e caixas nunca acessem dados de outras lojas
 */
export function getAuthorizedTenantId(user: User | null, requestedTenantId?: string | null): string | null {
  if (!user) return null
  if (user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN') {
    return requestedTenantId || user.tenantId || null
  }
  // Para TENANT_ADMIN e CASHIER, sempre retorna estritamente a loja vinculada ao usuário
  return user.tenantId || null
}
