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

    const res = await query(
      `UPDATE orders 
       SET status = COALESCE($2, status),
           payment_status = COALESCE($3, payment_status),
           payment_method = COALESCE($4, payment_method),
           customer_name = COALESCE($5, customer_name),
           customer_phone = COALESCE($6, customer_phone),
           table_number = COALESCE($7, table_number),
           notes = COALESCE($8, notes),
           total_amount = COALESCE($9, total_amount),
           updated_at = timezone('utc'::text, now())
       WHERE id::text = $1 AND deleted_at IS NULL
       RETURNING *`,
      [
        id,
        body.status || null,
        body.paymentStatus || null,
        body.paymentMethod || null,
        body.customerName || null,
        body.customerPhone || null,
        body.tableNumber || null,
        body.notes || null,
        body.total !== undefined ? Number(body.total) : null,
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
    try {
      const body = await request.json()
      if (body.reason) cancelReason = body.reason
    } catch {}

    const order = await cancelOrder(id, cancelReason, user)
    if (!order) return errorResponse('Comanda não encontrada', 404)

    return jsonResponse({ success: true, message: 'Pedido cancelado com sucesso', order })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao cancelar pedido', 500)
  }
}
