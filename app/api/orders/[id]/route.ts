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
    const user = await getAuthUser(request)
    const authorName = user?.name || body.authorName || 'Operador Loja'
    const authorRole = user?.role || body.authorRole || 'TENANT_ADMIN'

    const tableNum = body.tableNumber !== undefined ? (parseInt(String(body.tableNumber), 10) || null) : undefined
    
    // 🛡️ Segurança Franqueadora: Franqueado não pode alterar o preço base arbitrariamente
    // Apenas SUPER_ADMIN ou FRANCHISOR_ADMIN podem sobrescrever total diretamente
    const isMaster = user?.role === 'SUPER_ADMIN' || user?.role === 'FRANCHISOR_ADMIN'
    const totalVal = isMaster && body.total !== undefined ? Number(body.total) : undefined

    const itemsJson = body.items !== undefined ? JSON.stringify(body.items) : null
    const notesVal = body.notes !== undefined ? String(body.notes) : null

    const res = await query(
      `UPDATE orders 
       SET status = COALESCE($2, status),
           payment_method = COALESCE($3, payment_method),
           customer_name = COALESCE($4, customer_name),
           customer_phone = COALESCE($5, customer_phone),
           table_number = COALESCE($6, table_number),
           total = COALESCE($7, total),
           items_json = CASE WHEN $8::text IS NOT NULL THEN $8::jsonb ELSE items_json END,
           cancel_reason = COALESCE($9, cancel_reason)
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
        itemsJson,
        notesVal,
      ]
    )

    if (!res.rows || res.rows.length === 0) {
      return errorResponse('Comanda não encontrada', 404)
    }

    const updatedRow = res.rows[0]

    // Registra evento no log de auditoria da Franqueadora Master / TI
    try {
      const { recordAuditLog } = await import('@/lib/repositories/auditRepository')
      await recordAuditLog({
        tenantId: updatedRow.tenant_id,
        authorName: authorName,
        userRole: authorRole,
        action: body.status ? `UPDATE_ORDER_STATUS_${body.status}` : 'UPDATE_ORDER',
        entity: 'ORDER',
        entityId: id,
        message: `Comanda #${updatedRow.order_number || id.slice(-4).toUpperCase()} alterada para ${updatedRow.status} por ${authorName}`,
        metadata: {
          orderId: id,
          orderNumber: updatedRow.order_number,
          status: updatedRow.status,
          customerName: updatedRow.customer_name,
          tableNumber: updatedRow.table_number,
          total: updatedRow.total,
          notes: notesVal,
        },
      })
    } catch {}

    const updated = await getOrderById(id)
    return jsonResponse({ order: updated, message: 'Pedido e auditoria atualizados com sucesso' })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao atualizar pedido', 500)
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context)
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

    const authorName = user?.name || 'Henrique Linhares Junqueira'
    const authorRole = user?.role || 'ADMIN'

    if (isPermanent) {
      const existing = await getOrderById(id)
      await query(`DELETE FROM orders WHERE id::text = $1`, [id])

      try {
        const { recordAuditLog } = await import('@/lib/repositories/auditRepository')
        await recordAuditLog({
          tenantId: existing?.tenantId,
          authorName,
          userRole: authorRole,
          action: 'DELETE_ORDER_PERMANENT',
          entity: 'ORDER',
          entityId: id,
          level: 'WARN',
          message: `Comanda #${existing?.orderNumber || id.slice(-4).toUpperCase()} excluída definitivamente da base por ${authorName}`,
          metadata: { orderId: id, orderNumber: existing?.orderNumber, customerName: existing?.customerName },
        })
      } catch {}

      return jsonResponse({ success: true, message: 'Comanda excluída definitivamente' })
    }

    const order = await cancelOrder(id, cancelReason, user)
    if (!order) {
      // Se não encontrou para update, tenta deletar diretamente
      await query(`DELETE FROM orders WHERE id::text = $1`, [id])
      return jsonResponse({ success: true, message: 'Comanda removida' })
    }

    try {
      const { recordAuditLog } = await import('@/lib/repositories/auditRepository')
      await recordAuditLog({
        tenantId: order.tenantId,
        authorName,
        userRole: authorRole,
        action: 'CANCEL_ORDER',
        entity: 'ORDER',
        entityId: id,
        level: 'WARN',
        message: `Comanda #${order.orderNumber || id.slice(-4).toUpperCase()} cancelada: ${cancelReason} (por ${authorName})`,
        metadata: { orderId: id, orderNumber: order.orderNumber, reason: cancelReason },
      })
    } catch {}

    return jsonResponse({ success: true, message: 'Pedido cancelado com sucesso', order })
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao processar exclusão da comanda', 500)
  }
}
