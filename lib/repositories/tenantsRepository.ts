import { Tenant, FranchiseNetworkOverview, StoreOverview } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export async function getTenants(): Promise<Tenant[]> {
  const res = await query(
    `SELECT id, name, slug, nif, address, phone, mbway_phone, 
            currency, royalty_percentage, marketing_fund_percentage, 
            is_headquarters, active, created_at, updated_at, deleted_at
     FROM tenants 
     WHERE deleted_at IS NULL 
     ORDER BY is_headquarters DESC, created_at ASC`
  )

  return (res.rows || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    nif: t.nif,
    address: t.address,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency || 'EUR',
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    deletedAt: t.deleted_at,
  }))
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const res = await query(
    `SELECT id, name, slug, nif, address, phone, mbway_phone, 
            currency, royalty_percentage, marketing_fund_percentage, 
            is_headquarters, active, created_at, updated_at, deleted_at
     FROM tenants 
     WHERE (id::text = $1 OR slug = $1) AND deleted_at IS NULL 
     LIMIT 1`,
    [id]
  )

  if (!res.rows || res.rows.length === 0) return null
  const t = res.rows[0]

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    nif: t.nif,
    address: t.address,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency || 'EUR',
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    deletedAt: t.deleted_at,
  }
}

export async function getNetworkOverview(): Promise<FranchiseNetworkOverview> {
  const tenants = await getTenants()

  // Consulta faturamento de hoje e contagem de pedidos por loja
  const ordersRes = await query(
    `SELECT tenant_id, 
            COUNT(id) as orders_count, 
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(CASE WHEN payment_method = 'MBWAY' THEN 1 END) as mbway_count
     FROM orders 
     WHERE payment_status = 'PAID' AND deleted_at IS NULL
     GROUP BY tenant_id`
  )

  // Consulta operadores ativos por loja
  const usersRes = await query(
    `SELECT id, name, email, role, tenant_id, active 
     FROM users 
     WHERE active = true AND deleted_at IS NULL`
  )

  const ordersByTenant = new Map<string, any>()
  ordersRes.rows.forEach((r: any) => ordersByTenant.set(r.tenant_id, r))

  const usersByTenant = new Map<string, any[]>()
  usersRes.rows.forEach((u: any) => {
    if (u.tenant_id) {
      const list = usersByTenant.get(u.tenant_id) || []
      list.push(u)
      usersByTenant.set(u.tenant_id, list)
    }
  })

  let totalRevenue = 0
  let totalOrders = 0
  let totalOperators = 0

  const storeOverviews: StoreOverview[] = tenants.map((t) => {
    const oData = ordersByTenant.get(t.id) || { orders_count: 0, revenue: 0, mbway_count: 0 }
    const storeUsers = usersByTenant.get(t.id) || []

    const storeRevenue = Number(oData.revenue) || 0
    const storeOrderCount = Number(oData.orders_count) || 0
    const avgTicket = storeOrderCount > 0 ? +(storeRevenue / storeOrderCount).toFixed(2) : 0
    const mbwayOrders = Number(oData.mbway_count) || 0
    const mbwayShare = storeOrderCount > 0 ? Math.round((mbwayOrders / storeOrderCount) * 100) : 0

    const operators = storeUsers
      .filter((u: any) => u.role === 'CASHIER')
      .map((u: any) => ({ id: u.id, name: u.name, email: u.email, active: u.active }))

    const manager = storeUsers.find((u: any) => u.role === 'TENANT_ADMIN')

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
    totalStores: tenants.length,
    activeStores: tenants.filter((t) => t.active).length,
    totalOperators,
    stores: storeOverviews,
  }
}

export async function createTenant(payload: Partial<Tenant>): Promise<Tenant> {
  const id = payload.id || uuidv4()
  const name = payload.name || 'Nova Loja Açaí da Rose'
  const slug = payload.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const res = await query(
    `INSERT INTO tenants (id, name, slug, nif, address, phone, mbway_phone, currency, is_headquarters, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      name,
      slug,
      payload.nif || null,
      payload.address || null,
      payload.phone || null,
      payload.mbwayPhone || null,
      payload.currency || 'EUR',
      !!payload.isHeadquarters,
      payload.active !== undefined ? payload.active : true,
    ]
  )

  const t = res.rows[0]
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    nif: t.nif,
    address: t.address,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency,
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}

export async function updateTenant(id: string, payload: Partial<Tenant>): Promise<Tenant | null> {
  const res = await query(
    `UPDATE tenants 
     SET name = COALESCE($2, name),
         nif = COALESCE($3, nif),
         address = COALESCE($4, address),
         phone = COALESCE($5, phone),
         mbway_phone = COALESCE($6, mbway_phone),
         active = COALESCE($7, active),
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING *`,
    [
      id,
      payload.name || null,
      payload.nif || null,
      payload.address || null,
      payload.phone || null,
      payload.mbwayPhone || null,
      payload.active,
    ]
  )

  if (!res.rows || res.rows.length === 0) return null
  const t = res.rows[0]

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    nif: t.nif,
    address: t.address,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency,
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}
