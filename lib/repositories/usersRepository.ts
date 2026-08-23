import { User } from '@/types'
import { supabaseServer } from '@/lib/supabase/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { v4 as uuidv4 } from 'uuid'

export async function getUsersByTenant(tenantId?: string | null): Promise<User[]> {
  if (supabaseServer) {
    let query = supabaseServer
      .from('users')
      .select('id, email, name, role, tenant_id, active, created_at, updated_at, deleted_at')
      .is('deleted_at', null)
    if (tenantId) query = query.eq('tenant_id', tenantId)
    const { data } = await query.order('created_at', { ascending: true })
    if (data) {
      return (data as any[]).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as any,
        tenantId: u.tenant_id,
        active: u.active,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        deletedAt: u.deleted_at,
      }))
    }
  }

  const store = getMockStore()
  return store.users
    .filter((u) => !u.deletedAt && (!tenantId || u.tenantId === tenantId))
    .map(({ passwordHash, ...u }) => u as User)
}

export async function getStoreOperatorCount(tenantId: string): Promise<{ current: number; max: number }> {
  const store = getMockStore()
  const current = store.users.filter(
    (u) => !u.deletedAt && u.tenantId === tenantId && u.role === 'CASHIER' && u.active
  ).length
  return { current, max: 3 }
}

export async function createUser(payload: any): Promise<User> {
  const store = getMockStore()
  const tenantId = payload.tenantId || null
  const role = payload.role || 'CASHIER'

  // Regra de Negócio: Limite de até 3 Operadores de Caixa por loja
  if (tenantId && role === 'CASHIER') {
    const { current, max } = await getStoreOperatorCount(tenantId)
    if (current >= max) {
      throw new Error(`Esta loja atingiu o limite de ${max} operadores de caixa permitidos.`)
    }
  }

  const newUser = {
    id: uuidv4(),
    email: String(payload.email).toLowerCase().trim(),
    name: payload.name,
    role,
    tenantId,
    passwordHash: payload.password || '123456',
    active: true,
    createdAt: new Date().toISOString(),
  }

  store.users.push(newUser)
  const { passwordHash, ...safeUser } = newUser
  return safeUser as User
}

export async function updateUser(id: string, payload: any): Promise<User | null> {
  const store = getMockStore()
  const idx = store.users.findIndex((u) => u.id === id)
  if (idx >= 0) {
    store.users[idx] = { ...store.users[idx], ...payload, updatedAt: new Date().toISOString() }
    const { passwordHash, ...safeUser } = store.users[idx]
    return safeUser as User
  }
  return null
}

export async function deleteUser(id: string): Promise<boolean> {
  const store = getMockStore()
  const idx = store.users.findIndex((u) => u.id === id)
  if (idx >= 0) {
    store.users[idx].deletedAt = new Date().toISOString()
    store.users[idx].active = false
    return true
  }
  return false
}
