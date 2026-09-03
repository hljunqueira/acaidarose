import { Tenant, FranchiseNetworkOverview, StoreOverview } from '@/types'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export const FIGUEIRA_HQ_ID = '11111111-1111-1111-1111-111111111111'
export const TORRES_NOVAS_ID = '22222222-2222-2222-2222-222222222222'
export const AVEIRO_FRANCHISE_ID = '33333333-3333-3333-3333-333333333333'
export const AVEIRO_HQ_ID = FIGUEIRA_HQ_ID // retrocompatibilidade temporária

export function normalizeTenantId(tenantId?: string | null): string {
  if (!tenantId) return FIGUEIRA_HQ_ID
  const clean = String(tenantId).trim().toLowerCase()
  if (clean === '2' || clean === 'torres-novas' || clean === 'filial-1' || clean.includes('torres-novas')) {
    return TORRES_NOVAS_ID
  }
  if (clean === '3' || clean === 'aveiro' || clean === 'franquia' || clean.includes('aveiro')) {
    return AVEIRO_FRANCHISE_ID
  }
  if (clean === '1' || clean === 'figueira' || clean === 'figueira-da-foz' || clean === 'matriz' || clean.includes('figueira')) {
    return FIGUEIRA_HQ_ID
  }
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)
  if (!isUuid) {
    return FIGUEIRA_HQ_ID
  }
  return clean
}

export async function getTenants(): Promise<Tenant[]> {
  const res = await query(
    `SELECT id, name, slug, nif, address, city, postal_code, phone, mbway_phone, 
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
    city: t.city,
    postalCode: t.postal_code,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency || 'EUR',
    royaltyPercentage: Number(t.royalty_percentage) || 0,
    marketingFundPercentage: Number(t.marketing_fund_percentage) || 0,
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    deletedAt: t.deleted_at,
  }))
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  return await getTenantByIdOrSlug(id)
}

export async function getTenantByIdOrSlug(identifier: string): Promise<Tenant | null> {
  if (!identifier) return null

  const clean = String(identifier).trim().toLowerCase()

  // 1. Resolução inteligente de aliases: Loja 1 (Figueira), Loja 2 (Torres Novas) e Loja 3 (Aveiro)
  let targetIdOrSlug = clean
  if (clean === '1' || clean === 'figueira' || clean === 'figueira-da-foz' || clean === 'matriz' || clean.includes('figueira')) {
    targetIdOrSlug = FIGUEIRA_HQ_ID
  } else if (clean === '2' || clean === 'torres-novas-2' || clean === 'torres-novas' || clean === 'filial-1' || clean === 'filial-torres-novas') {
    targetIdOrSlug = TORRES_NOVAS_ID
  } else if (clean === '3' || clean === 'aveiro' || clean === 'franquia-aveiro' || clean === 'franquia') {
    targetIdOrSlug = AVEIRO_FRANCHISE_ID
  }

  const res = await query(
    `SELECT id, name, slug, nif, address, city, postal_code, phone, mbway_phone, 
            currency, royalty_percentage, marketing_fund_percentage, 
            is_headquarters, active, created_at, updated_at, deleted_at
     FROM tenants 
     WHERE (id::text = $1 OR LOWER(slug) = $1 OR LOWER(slug) = $2) AND deleted_at IS NULL 
     LIMIT 1`,
    [targetIdOrSlug, clean]
  )

  if (!res.rows || res.rows.length === 0) return null
  const t = res.rows[0]

  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    nif: t.nif,
    address: t.address,
    city: t.city,
    postalCode: t.postal_code,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency || 'EUR',
    royaltyPercentage: Number(t.royalty_percentage) || 0,
    marketingFundPercentage: Number(t.marketing_fund_percentage) || 0,
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    deletedAt: t.deleted_at,
  }
}

export async function getNetworkOverview(): Promise<FranchiseNetworkOverview> {
  const tenants = await getTenants()

  // Consulta faturamento e contagem de pedidos reais por loja
  const ordersRes = await query(
    `SELECT tenant_id, 
            COUNT(id) as orders_count, 
            COALESCE(SUM(total), 0) as revenue,
            COUNT(CASE WHEN payment_method = 'MBWAY' THEN 1 END) as mbway_count
     FROM orders 
     WHERE (status != 'CANCELLED' OR status IS NULL)
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
    `INSERT INTO tenants (id, name, slug, nif, address, city, postal_code, phone, mbway_phone, currency, is_headquarters, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      id,
      name,
      slug,
      payload.nif || null,
      payload.address || null,
      payload.city || null,
      payload.postalCode || null,
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
    city: t.city,
    postalCode: t.postal_code,
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
         city = COALESCE($5, city),
         postal_code = COALESCE($6, postal_code),
         phone = COALESCE($7, phone),
         mbway_phone = COALESCE($8, mbway_phone),
         active = COALESCE($9, active),
         royalty_percentage = COALESCE($10, royalty_percentage),
         marketing_fund_percentage = COALESCE($11, marketing_fund_percentage),
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING *`,
    [
      id,
      payload.name || null,
      payload.nif || null,
      payload.address || null,
      payload.city || null,
      payload.postalCode || null,
      payload.phone || null,
      payload.mbwayPhone || null,
      payload.active,
      payload.royaltyPercentage !== undefined ? payload.royaltyPercentage : null,
      payload.marketingFundPercentage !== undefined ? payload.marketingFundPercentage : null,
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
    city: t.city,
    postalCode: t.postal_code,
    phone: t.phone,
    mbwayPhone: t.mbway_phone,
    currency: t.currency,
    royaltyPercentage: Number(t.royalty_percentage) || 0,
    marketingFundPercentage: Number(t.marketing_fund_percentage) || 0,
    isHeadquarters: !!t.is_headquarters,
    active: t.active,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}
