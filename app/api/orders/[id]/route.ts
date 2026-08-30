import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getOrderById, cancelOrder } from '@/lib/repositories/ordersRepository'
import { getTenantById } from '@/lib/repositories/tenantsRepository'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await getOrderById(id)
    if (!order) return errorResponse('Comanda não encontrada', 404)

    const tenant = await getTenantById(order.tenantId)
    return jsonResponse({ order, tenant })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao carregar pedido', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const tableNum = body.tableNumber !== undefined ? (parseInt(String(body.tableNumber), 10) || null) : undefined
    const totalVal = body.total !== undefined ? Number(body.total) : undefined

    const res = await query(
      `UPDATE orders 
       SET status = COALESCE($2, status),
           payment_method = COALESCE($3, payment_method),
           customer_name = COALESCE($4, customer_name),
           customer_phone = COALESCE($5, customer_phone),
           table_number = COALESCE($6, table_number),
           total = COALESCE($7, total)
       WHERE id::text = $1
       RETURNING *`,
      [
        id,
        body.status || null,
        body.paymentMethod || null,
        body.customerName || null,
        body.customerPhone || null,
        tableNum !== undefined ? tableNum : null,
        totalVal !== undefined ? totalVal : null,
      ]
    )

    if (!res.rows || res.rows.length === 0) {
      return errorResponse('Comanda não encontrada', 404)
    }

    const updated = await getOrderById(id)
    return jsonResponse({ order: updated })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar pedido', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)

    let cancelReason = 'Cancelado pelo operador'
    let isPermanent = false
    try {
      const body = await request.json()
      if (body?.reason) cancelReason = body.reason
      if (body?.permanent || body?.delete) isPermanent = true
    } catch {}

    if (isPermanent) {
      await query(`DELETE FROM orders WHERE id::text = $1`, [id])
      return jsonResponse({ success: true, message: 'Comanda excluída definitivamente' })
    }

    const order = await cancelOrder(id, cancelReason, user)
    if (!order) {
      // Se não encontrou para update, tenta deletar diretamente
      await query(`DELETE FROM orders WHERE id::text = $1`, [id])
      return jsonResponse({ success: true, message: 'Comanda removida' })
    }

    return jsonResponse({ success: true, message: 'Pedido cancelado com sucesso', order })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao processar exclusão da comanda', 500)
  }
}
