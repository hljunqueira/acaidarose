import { User, UserRole } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export async function getUsersByTenant(tenantId?: string | null): Promise<User[]> {
  let sql = `SELECT id, email, name, role, tenant_id, active, created_at, updated_at, deleted_at 
             FROM users 
             WHERE deleted_at IS NULL`
  const params: any[] = []

  if (tenantId) {
    sql += ` AND tenant_id::text = $1`
    params.push(tenantId)
  }

  sql += ` ORDER BY created_at ASC`

  const res = await query(sql, params)

  return (res.rows || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    tenantId: u.tenant_id,
    active: u.active,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    deletedAt: u.deleted_at,
  }))
}

export async function getStoreOperatorCount(tenantId: string): Promise<{ current: number; max: number }> {
  const res = await query(
    `SELECT COUNT(id) as count 
     FROM users 
     WHERE tenant_id::text = $1 AND role = 'CASHIER' AND active = true AND deleted_at IS NULL`,
    [tenantId]
  )

  const current = Number(res.rows?.[0]?.count) || 0
  return { current, max: 3 }
}

export async function createUser(payload: any): Promise<User> {
  const tenantId = payload.tenantId || null
  const role = payload.role || 'CASHIER'

  // Regra de Negócio: Limite de até 3 Operadores de Caixa por loja
  if (tenantId && role === 'CASHIER') {
    const { current, max } = await getStoreOperatorCount(tenantId)
    if (current >= max) {
      throw new Error(`Esta loja atingiu o limite de ${max} operadores de caixa permitidos.`)
    }
  }

  const id = uuidv4()
  const cleanEmail = String(payload.email).toLowerCase().trim()
  const passwordHash = payload.password || '123456'

  const res = await query(
    `INSERT INTO users (id, email, name, password_hash, role, tenant_id, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name, role, tenant_id, active, created_at, updated_at`,
    [id, cleanEmail, payload.name, passwordHash, role, tenantId, true]
  )

  const u = res.rows[0]
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    tenantId: u.tenant_id,
    active: u.active,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }
}

export async function updateUser(id: string, payload: any): Promise<User | null> {
  const res = await query(
    `UPDATE users 
     SET name = COALESCE($2, name),
         role = COALESCE($3, role),
         active = COALESCE($4, active),
         password_hash = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE password_hash END,
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING id, email, name, role, tenant_id, active, created_at, updated_at`,
    [
      id,
      payload.name || null,
      payload.role || null,
      payload.active,
      payload.password || null,
    ]
  )

  if (!res.rows || res.rows.length === 0) return null
  const u = res.rows[0]

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    tenantId: u.tenant_id,
    active: u.active,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await query(
    `UPDATE users 
     SET deleted_at = timezone('utc'::text, now()), active = false 
     WHERE id::text = $1`,
    [id]
  )
  return (res.rowCount || 0) > 0
}
