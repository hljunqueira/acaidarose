import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const q = (request.nextUrl.searchParams.get('q') || '').toLowerCase().trim()
    const rawTenant =
      request.nextUrl.searchParams.get('loja') ||
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('tenant')

    let tenantId: string | null = null
    if (rawTenant) {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) tenantId = t.id
    }

    let sql = `SELECT * FROM orders WHERE deleted_at IS NULL`
    const params: any[] = []

    if (tenantId) {
      params.push(tenantId)
      sql += ` AND tenant_id::text = $${params.length}`
    }

    if (q) {
      params.push(`%${q}%`)
      sql += ` AND (customer_name ILIKE $${params.length} OR customer_phone ILIKE $${params.length} OR daily_order_seq::text ILIKE $${params.length})`
    }

    sql += ` ORDER BY created_at DESC LIMIT 20`

    const res = await query(sql, params)

    const orders = (res.rows || []).map((o: any) => ({
      id: o.id,
      tenantId: o.tenant_id,
      cashierId: o.cashier_id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      orderNumber: o.daily_order_seq,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total_amount) || 0,
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      tableNumber: o.table_number,
      isTableOrder: o.order_type === 'DINE_IN',
      notes: o.notes,
      createdAt: o.created_at,
    }))

    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
}
