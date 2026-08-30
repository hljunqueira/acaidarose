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
           items = CASE WHEN $8::text IS NOT NULL THEN $8::jsonb ELSE items END,
           notes = COALESCE($9, notes),
           updated_at = NOW()
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

    // Registra evento no log de auditoria da Franqueadora Master / TI
    try {
      await query(
        `INSERT INTO system_logs (level, category, message, metadata, created_at)
         VALUES ('INFO', 'FRANCHISE_ORDER_AUDIT', $1, $2::jsonb, NOW())`,
        [
          `Pedido #${id.slice(-4).toUpperCase()} alterado na loja por ${authorName}`,
          JSON.stringify({
            orderId: id,
            author: authorName,
            role: authorRole,
            changes: body.items ? 'Itens/Acompanhamentos alterados' : 'Status/Notas alterados',
            notes: notesVal,
            updatedAt: new Date().toISOString(),
          }),
        ]
      ).catch(() => {})
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
