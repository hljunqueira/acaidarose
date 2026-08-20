import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { cancelOrder, getOrderById } from '@/lib/repositories/ordersRepository'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request)
  if (!hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
    return errorResponse('Sem permissão para cancelar comandas', 403)
  }

  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return errorResponse('Comanda não encontrada', 404)
  if (order.status === 'CANCELLED') return errorResponse('Comanda já anulada', 400)

  try {
    const body = await request.json().catch(() => ({}))
    const reason = (body.reason || '').trim()
    if (!reason || reason.length < 3) {
      return errorResponse('Motivo obrigatório (mínimo 3 caracteres)', 400)
    }

    const updated = await cancelOrder(id, reason, user)
    return jsonResponse(updated)
  } catch (err: any) {
    return errorResponse(err?.message || 'Erro ao cancelar comanda', 500)
  }
}
