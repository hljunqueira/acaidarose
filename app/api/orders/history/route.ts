import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { getAuthUser } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rawTenant =
      request.nextUrl.searchParams.get('loja') ||
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('tenant')

    let tenantId: string | null = null
    if (rawTenant && rawTenant !== 'ALL' && rawTenant !== 'all') {
      const t = await getTenantByIdOrSlug(rawTenant)
      tenantId = t ? t.id : rawTenant
    }

    const periodo = (request.nextUrl.searchParams.get('periodo') || 'today').toLowerCase()
    const startDateParam = request.nextUrl.searchParams.get('startDate')
    const endDateParam = request.nextUrl.searchParams.get('endDate')
    const statusParam = request.nextUrl.searchParams.get('status') || 'ALL'
    const paymentMethodParam = request.nextUrl.searchParams.get('paymentMethod') || 'ALL'
    const consumptionTypeParam = request.nextUrl.searchParams.get('consumptionType') || 'ALL'
    const mesaParam = request.nextUrl.searchParams.get('mesa') || request.nextUrl.searchParams.get('table') || 'ALL'
    const q = (request.nextUrl.searchParams.get('q') || '').trim()

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(10, parseInt(request.nextUrl.searchParams.get('limit') || '25', 10) || 25))
    const offset = (page - 1) * limit

    const whereClauses: string[] = []
    const params: any[] = []

    // 1. Filtro de Loja / Tenant
    if (tenantId) {
      params.push(tenantId)
      whereClauses.push(`o.tenant_id::text = $${params.length}`)
    }

    // 2. Filtro de Período Temporal (Fuso Canônico Portugal 'Europe/Lisbon')
    let dateFormatted = ''
    const now = new Date()

    if (periodo === 'today') {
      whereClauses.push(`(o.created_at AT TIME ZONE 'Europe/Lisbon')::date = (now() AT TIME ZONE 'Europe/Lisbon')::date`)
      dateFormatted = now.toLocaleDateString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else if (periodo === 'yesterday') {
      whereClauses.push(`(o.created_at AT TIME ZONE 'Europe/Lisbon')::date = ((now() AT TIME ZONE 'Europe/Lisbon')::date - INTERVAL '1 day')`)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      dateFormatted = yesterday.toLocaleDateString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } else if (periodo === '7d') {
      whereClauses.push(`(o.created_at AT TIME ZONE 'Europe/Lisbon')::date >= ((now() AT TIME ZONE 'Europe/Lisbon')::date - INTERVAL '6 days')`)
      dateFormatted = 'Últimos 7 dias'
    } else if (periodo === '30d') {
      whereClauses.push(`(o.created_at AT TIME ZONE 'Europe/Lisbon')::date >= ((now() AT TIME ZONE 'Europe/Lisbon')::date - INTERVAL '29 days')`)
      dateFormatted = 'Últimos 30 dias'
    } else if (periodo === 'month') {
      whereClauses.push(`date_trunc('month', o.created_at AT TIME ZONE 'Europe/Lisbon') = date_trunc('month', now() AT TIME ZONE 'Europe/Lisbon')`)
      dateFormatted = now.toLocaleDateString('pt-PT', { timeZone: 'Europe/Lisbon', month: 'long', year: 'numeric' })
    } else if (periodo === 'custom' && (startDateParam || endDateParam)) {
      let s = startDateParam || endDateParam!
      let e = endDateParam || startDateParam!
      if (s > e) {
        const tmp = s
        s = e
        e = tmp
      }
      params.push(s)
      const p1 = params.length
      params.push(e)
      const p2 = params.length
      whereClauses.push(`(o.created_at AT TIME ZONE 'Europe/Lisbon')::date BETWEEN $${p1}::date AND $${p2}::date`)

      const sParts = s.split('-')
      const eParts = e.split('-')
      const sFmt = sParts.length === 3 ? `${sParts[2]}/${sParts[1]}/${sParts[0]}` : s
      const eFmt = eParts.length === 3 ? `${eParts[2]}/${eParts[1]}/${eParts[0]}` : e
      dateFormatted = s === e ? sFmt : `${sFmt} até ${eFmt}`
    } else {
      // Default: today
      whereClauses.push(`(o.created_at AT TIME ZONE 'Europe/Lisbon')::date = (now() AT TIME ZONE 'Europe/Lisbon')::date`)
      dateFormatted = now.toLocaleDateString('pt-PT', {
        timeZone: 'Europe/Lisbon',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    if (dateFormatted) {
      dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)
    }

    // 3. Filtro de Status
    if (statusParam && statusParam !== 'ALL') {
      if (statusParam === 'PAID_OR_COMPLETED') {
        whereClauses.push(`o.status IN ('PAID', 'COMPLETED')`)
      } else if (statusParam === 'PREPARING_OR_READY') {
        whereClauses.push(`o.status IN ('PREPARING', 'READY')`)
      } else {
        params.push(statusParam)
        whereClauses.push(`o.status = $${params.length}`)
      }
    }

    // 4. Filtro de Método de Pagamento
    if (paymentMethodParam && paymentMethodParam !== 'ALL') {
      if (paymentMethodParam === 'MBWAY') {
        whereClauses.push(`o.payment_method IN ('MBWAY', 'MB_WAY')`)
      } else if (paymentMethodParam === 'MULTIBANCO') {
        whereClauses.push(`o.payment_method IN ('MULTIBANCO', 'CARD')`)
      } else if (paymentMethodParam === 'NUMERARIO') {
        whereClauses.push(`o.payment_method IN ('NUMERARIO', 'CASH')`)
      } else {
        params.push(paymentMethodParam)
        whereClauses.push(`o.payment_method = $${params.length}`)
      }
    }

    // 5. Filtro de Tipo de Consumo (Mesa, Balcão, Takeaway)
    if (consumptionTypeParam && consumptionTypeParam !== 'ALL') {
      if (consumptionTypeParam === 'TAKEAWAY') {
        whereClauses.push(`(o.is_takeaway = true OR COALESCE(o.cancel_reason, o.notes, '') ILIKE '%takeaway%' OR COALESCE(o.cancel_reason, o.notes, '') ILIKE '%levar%')`)
      } else if (consumptionTypeParam === 'DINE_IN') {
        whereClauses.push(`o.is_table_order = true AND o.table_number IS NOT NULL`)
      } else if (consumptionTypeParam === 'COUNTER') {
        whereClauses.push(`(o.is_table_order = false OR o.table_number IS NULL) AND (o.is_takeaway IS NOT TRUE AND COALESCE(o.cancel_reason, o.notes, '') NOT ILIKE '%takeaway%' AND COALESCE(o.cancel_reason, o.notes, '') NOT ILIKE '%levar%')`)
      }
    }

    // 5.1 Filtro Específico por Mesa
    if (mesaParam && mesaParam !== 'ALL') {
      if (mesaParam === 'BALCAO') {
        whereClauses.push(`(o.table_number IS NULL OR o.is_table_order = false)`)
      } else {
        const num = parseInt(String(mesaParam).replace(/\D/g, ''), 10)
        if (!isNaN(num) && num > 0) {
          params.push(num)
          whereClauses.push(`o.table_number = $${params.length}`)
        }
      }
    }

    // 6. Busca Textual (comanda, cliente, telefone, nif, mesa)
    if (q) {
      const cleanSeq = q.replace(/^#/, '').trim()
      params.push(`%${q}%`)
      const pQ = params.length

      if (/^\d+$/.test(cleanSeq)) {
        params.push(parseInt(cleanSeq, 10))
        const pSeq = params.length
        whereClauses.push(`(o.order_number = $${pSeq} OR o.table_number = $${pSeq} OR o.customer_name ILIKE $${pQ} OR o.customer_phone ILIKE $${pQ} OR o.customer_nif ILIKE $${pQ})`)
      } else {
        whereClauses.push(`(o.customer_name ILIKE $${pQ} OR o.customer_phone ILIKE $${pQ} OR o.customer_nif ILIKE $${pQ})`)
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    // 7. Agregações Globais do Período Filtrado (Summary)
    const summarySql = `
      SELECT 
        COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total ELSE 0 END), 0) AS total_revenue,
        COUNT(CASE WHEN o.status != 'CANCELLED' THEN 1 END) AS total_orders,
        COUNT(CASE WHEN o.status = 'CANCELLED' THEN 1 END) AS cancelled_count,
        COALESCE(SUM(CASE WHEN o.status = 'CANCELLED' THEN o.total ELSE 0 END), 0) AS cancelled_total,
        COUNT(*) AS grand_total_count
      FROM orders o
      ${whereSql}
    `
    const summaryRes = await query(summarySql, params)
    const summaryRow = summaryRes.rows[0] || {}

    const totalRevenue = Number(summaryRow.total_revenue) || 0
    const totalOrders = Number(summaryRow.total_orders) || 0
    const cancelledCount = Number(summaryRow.cancelled_count) || 0
    const cancelledTotal = Number(summaryRow.cancelled_total) || 0
    const grandTotalCount = Number(summaryRow.grand_total_count) || 0
    const averageTicket = totalOrders > 0 ? +(totalRevenue / totalOrders).toFixed(2) : 0

    // 8. Consulta dos Pedidos Paginados
    const listSql = `
      SELECT 
        o.*,
        t.name AS tenant_name,
        t.slug AS tenant_slug
      FROM orders o
      LEFT JOIN tenants t ON o.tenant_id = t.id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const listParams = [...params, limit, offset]
    const listRes = await query(listSql, listParams)

    const orders = (listRes.rows || []).map((o: any) => {
      let items: any[] = []
      try {
        items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items_json || [])
      } catch {}

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
      const consumptionType = isTakeaway ? 'TAKEAWAY' : o.table_number ? 'DINE_IN' : 'COUNTER'

      const isPaid = Boolean(
        o.status === 'PAID' ||
        o.status === 'COMPLETED' ||
        o.payment_status === 'PAID'
      )

      return {
        id: o.id,
        tenantId: o.tenant_id,
        tenantName: o.tenant_name || 'Loja',
        tenantSlug: o.tenant_slug || '',
        orderNumber: o.order_number,
        cashierId: o.cashier_id,
        cashierName: o.cashier_name || 'Balcão',
        customerName: o.customer_name || 'Anónimo',
        customerPhone: o.customer_phone || null,
        customerNif: o.customer_nif || null,
        subtotal: Number(o.subtotal) || 0,
        vatTotal: Number(o.vat_total) || 0,
        total: Number(o.total) || 0,
        status: o.status,
        paymentStatus: isPaid ? 'PAID' : o.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
        paymentMethod: o.payment_method || 'MBWAY',
        tableNumber: o.table_number,
        isTableOrder: o.is_table_order !== false,
        consumptionType,
        isTakeaway,
        needBag,
        bagQuantity,
        bagFee,
        cancelReason: o.cancel_reason || null,
        cancelledAt: o.cancelled_at || null,
        cancelledByName: o.cancelled_by_name || null,
        notes: notesStr,
        items,
        createdAt: o.created_at,
      }
    })

    const totalPages = Math.ceil(grandTotalCount / limit) || 1

    return NextResponse.json({
      success: true,
      dateFormatted,
      summary: {
        totalRevenue,
        totalOrders,
        averageTicket,
        cancelledCount,
        cancelledTotal,
        grandTotalCount,
      },
      pagination: {
        page,
        limit,
        totalOrders: grandTotalCount,
        totalPages,
      },
      orders,
    })
  } catch (error: any) {
    console.error('Erro na rota /api/orders/history:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar histórico de pedidos' },
      { status: 500 }
    )
  }
}
