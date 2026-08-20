import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse } from '@/lib/api/response'
import { getOrderById } from '@/lib/repositories/ordersRepository'
import { getTenantById } from '@/lib/repositories/tenantsRepository'
import { getMockStore } from '@/lib/supabase/mockStore'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return errorResponse('Comanda não encontrada', 404)

  const tenant = await getTenantById(order.tenantId)
  return jsonResponse({ order, tenant })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const store = getMockStore()

  const order = store.orders.find((o) => o.id === id)
  if (!order) return errorResponse('Comanda não encontrada', 404)

  if (body.status !== undefined) order.status = body.status
  if (body.paymentStatus !== undefined) order.paymentStatus = body.paymentStatus
  if (body.paymentMethod !== undefined) order.paymentMethod = body.paymentMethod
  if (body.customerName !== undefined) order.customerName = body.customerName
  if (body.customerPhone !== undefined) order.customerPhone = body.customerPhone
  if (body.tableNumber !== undefined) order.tableNumber = body.tableNumber
  if (body.isTableOrder !== undefined) order.isTableOrder = body.isTableOrder
  if (body.notes !== undefined) order.notes = body.notes
  if (body.items !== undefined) {
    order.items = body.items
    const subtotal = (body.items || []).reduce((acc: number, item: any) => acc + (Number(item.lineTotal) || 0), 0)
    order.subtotal = +subtotal.toFixed(2)
    order.total = +subtotal.toFixed(2)
  }
  if (body.total !== undefined) order.total = Number(body.total)
  
  order.updatedAt = new Date().toISOString()

  return jsonResponse({ order })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const store = getMockStore()

  const idx = store.orders.findIndex((o) => o.id === id)
  if (idx === -1) return errorResponse('Comanda não encontrada', 404)

  // Soft delete or mark as CANCELLED
  const deletedOrder = store.orders[idx]
  deletedOrder.status = 'CANCELLED'
  deletedOrder.deletedAt = new Date().toISOString()
  deletedOrder.updatedAt = new Date().toISOString()

  return jsonResponse({ success: true, message: 'Pedido cancelado com sucesso', order: deletedOrder })
}
