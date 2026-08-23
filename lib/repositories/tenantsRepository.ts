import { Tenant, FranchiseNetworkOverview, StoreOverview } from '@/types'
import { supabaseServer } from '@/lib/supabase/server'
import { getMockStore } from '@/lib/supabase/mockStore'
import { v4 as uuidv4 } from 'uuid'

export async function getTenants(): Promise<Tenant[]> {
  if (supabaseServer) {
    const { data } = await supabaseServer
      .from('tenants')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (data) {
      return (data as any[]).map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        nif: t.nif,
        address: t.address,
        phone: t.phone,
        mbwayPhone: t.mbway_phone,
        currency: t.currency,
        isHeadquarters: t.is_headquarters,
        active: t.active,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        deletedAt: t.deleted_at,
      }))
    }
  }

  const store = getMockStore()
  return store.tenants.filter((t) => !t.deletedAt)
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const tenants = await getTenants()
  return tenants.find((t) => t.id === id) || null
}

export async function getNetworkOverview(): Promise<FranchiseNetworkOverview> {
  const store = getMockStore()
  const allTenants = store.tenants.filter((t) => !t.deletedAt)
  const allOrders = store.orders.filter((o) => !o.deletedAt)
  const allUsers = store.users.filter((u) => !u.deletedAt && u.active)

  let totalRevenue = 0
  let totalOrders = 0
  let totalOperators = 0

  const storeOverviews: StoreOverview[] = allTenants.map((t) => {
    const storeOrders = allOrders.filter((o) => o.tenantId === t.id && o.paymentStatus === 'PAID')
    const storeRevenue = +storeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)
    const storeOrderCount = storeOrders.length
    const avgTicket = storeOrderCount > 0 ? +(storeRevenue / storeOrderCount).toFixed(2) : 0

    const mbwayOrders = storeOrders.filter((o) => o.paymentMethod === 'MBWAY').length
    const mbwayShare = storeOrderCount > 0 ? Math.round((mbwayOrders / storeOrderCount) * 100) : 0

    const storeUsers = allUsers.filter((u) => u.tenantId === t.id)
    const operators = storeUsers
      .filter((u) => u.role === 'CASHIER')
      .map((u) => ({ id: u.id, name: u.name, email: u.email, active: u.active }))

    const manager = storeUsers.find((u) => u.role === 'TENANT_ADMIN')

    totalRevenue += storeRevenue
    totalOrders += storeOrderCount
    totalOperators += operators.length

    return {
      tenant: t,
      metrics: {
        todayRevenue: storeRevenue,
        todayOrdersCount: storeOrderCount,
        averageTicket: avgTicket,
        activeOperatorsCount: operators.length,
        maxOperators: 3,
        mbwaySharePercent: mbwayShare,
      },
      operators,
      manager: manager ? { id: manager.id, name: manager.name, email: manager.email } : undefined,
    }
  })

  totalRevenue = +totalRevenue.toFixed(2)
  const networkAvg = totalOrders > 0 ? +(totalRevenue / totalOrders).toFixed(2) : 0

  return {
    totalRevenue,
    totalOrders,
    networkAverageTicket: networkAvg,
    totalStores: allTenants.length,
    activeStores: allTenants.filter((t) => t.active).length,
    totalOperators,
    stores: storeOverviews,
  }
}

export async function createTenant(payload: Partial<Tenant>): Promise<Tenant> {
  const store = getMockStore()
  const newTenant: Tenant = {
    id: payload.id || uuidv4(),
    name: payload.name || 'Nova Loja Açaí da Rose',
    slug: payload.slug || (payload.name || 'loja').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    nif: payload.nif || null,
    address: payload.address || null,
    phone: payload.phone || null,
    mbwayPhone: payload.mbwayPhone || null,
    currency: payload.currency || 'EUR',
    isHeadquarters: !!payload.isHeadquarters,
    active: payload.active !== undefined ? payload.active : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  store.tenants.push(newTenant)
  return newTenant
}

export async function updateTenant(id: string, payload: Partial<Tenant>): Promise<Tenant | null> {
  const store = getMockStore()
  const idx = store.tenants.findIndex((t) => t.id === id)
  if (idx >= 0) {
    store.tenants[idx] = { ...store.tenants[idx], ...payload, updatedAt: new Date().toISOString() }
    return store.tenants[idx]
  }
  return null
}
