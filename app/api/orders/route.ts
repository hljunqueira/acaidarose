import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/repositories/ordersRepository'
import { getAuthUser } from '@/lib/api/authGuard'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rawTenant =
      request.nextUrl.searchParams.get('loja') ||
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('tenant')

    let tenantId = rawTenant
    if (rawTenant) {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) tenantId = t.id
    }

    let sql = `SELECT * FROM orders WHERE deleted_at IS NULL`
    const params: any[] = []

    if (tenantId) {
      sql += ` AND tenant_id::text = $1`
      params.push(tenantId)
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`

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
      { error: error.message || 'Erro ao procurar pedidos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await getAuthUser(request)

    let tenantId = body.tenantId
    if (body.loja) {
      const t = await getTenantByIdOrSlug(body.loja)
      if (t) tenantId = t.id
    }

    const payload = {
      ...body,
      tenantId,
      cashierId: user?.id || null,
      cashierName: user?.name || 'Caixa Balcão',
    }

    const order = await createOrder(payload)
    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao registar pedido' },
      { status: 500 }
    )
  }
}
