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

    let sql = `SELECT * FROM orders`
    const params: any[] = []

    if (tenantId) {
      sql += ` WHERE tenant_id::text = $1`
      params.push(tenantId)
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`

    const res = await query(sql, params)

    const orders = (res.rows || []).map((o: any) => {
      let items = []
      try {
        items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items_json || [])
      } catch {}

      const isQRCode = Boolean(
        o.is_qr_code === true ||
        o.channel === 'QR_CODE' ||
        (o.cashier_name && (o.cashier_name.toLowerCase().includes('qr') || o.cashier_name.toLowerCase().includes('autoatendimento')))
      )

      const isPaid = Boolean(
        (o.payment_status === 'PAID' || o.status === 'PAID' || o.status === 'COMPLETED') &&
        o.status !== 'AWAITING_PAYMENT' &&
        o.status !== 'WAITING_PAYMENT' &&
        o.payment_status !== 'PENDING'
      )

      const bagItem = items.find((it: any) => it.isBagItem || it.containerId === 'saco-transporte')
      const bagQuantity = bagItem ? Math.max(0, Number(bagItem.quantity) || 1) : 0
      const needBag = bagQuantity > 0
      const bagFee = +(bagQuantity * 0.10).toFixed(2)

      const notesStr = String(o.cancel_reason || o.notes || '')
      const isTakeaway =
        o.is_takeaway === true ||
        notesStr.toLowerCase().includes('levar') ||
        notesStr.toLowerCase().includes('takeaway') ||
        bagQuantity > 0
      const consumptionType = isTakeaway ? 'TAKEAWAY' : 'DINE_IN'

      return {
        id: o.id,
        tenantId: o.tenant_id,
        cashierId: o.cashier_id,
        cashierName: o.cashier_name,
        isQRCode,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        orderNumber: o.order_number,
        subtotal: Number(o.subtotal) || 0,
        total: Number(o.total) || 0,
        status: o.status,
        paymentStatus: isPaid ? 'PAID' : 'PENDING',
        paymentMethod: o.payment_method || 'MBWAY',
        tableNumber: o.table_number,
        isTableOrder: o.is_table_order !== false,
        consumptionType,
        isTakeaway,
        needBag,
        bagQuantity,
        bagFee,
        notes: notesStr,
        items,
        createdAt: o.created_at,
      }
    })

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

    const isCustomerQRCode = Boolean(
      body.channel === 'QR_CODE' ||
      body.isQRCode === true ||
      (!user && !body.cashierId)
    )

    const payload = {
      ...body,
      tenantId,
      cashierId: isCustomerQRCode ? null : (user?.id || body.cashierId || null),
      cashierName: isCustomerQRCode
        ? (body.cashierName || 'Autoatendimento QR Code')
        : (user ? user.name : (body.cashierName || 'Caixa Balcão')),
      isQRCode: isCustomerQRCode,
      channel: isCustomerQRCode ? 'QR_CODE' : (body.channel || 'POS'),
      paymentStatus: body.paymentStatus || (body.status === 'PAID' || body.status === 'COMPLETED' ? 'PAID' : 'PENDING'),
    }

    // Se o pedido for associado a uma mesa física (esplanada/salão), valida no banco de dados se a mesa realmente existe na loja
    const tableNumStr = payload.tableNumber ? String(payload.tableNumber).trim().toLowerCase() : ''
    const isPhysicalTable = Boolean(payload.isTableOrder) && Boolean(payload.tableNumber) && tableNumStr !== 'balcão' && tableNumStr !== 'balcao'

    if (isPhysicalTable) {
      const cleanNum = Number(payload.tableNumber)
      if (!cleanNum || isNaN(cleanNum)) {
        return NextResponse.json(
          { error: 'Número da mesa inválido para pedido na esplanada.' },
          { status: 400 }
        )
      }

      const tableCheck = await query(
        `SELECT id, status FROM tables WHERE tenant_id::text = $1 AND table_number = $2 AND deleted_at IS NULL LIMIT 1`,
        [tenantId, cleanNum]
      )

      if (!tableCheck.rows || tableCheck.rows.length === 0) {
        return NextResponse.json(
          { error: `A Esplanada ${payload.tableNumber} não existe ou não está registada nesta unidade. Por favor, faça o pedido no balcão ou consulte a equipa.` },
          { status: 400 }
        )
      }
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
