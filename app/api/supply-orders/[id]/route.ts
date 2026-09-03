import { NextRequest, NextResponse } from 'next/server'
import {
  updateSupplyOrderStatus,
  updateSupplyOrderPaymentStatus,
  receiveSupplyOrder,
  deleteSupplyOrder,
} from '@/lib/repositories/inventoryRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, tenantId, receivedBy, rejectionReason, paymentStatus } = body

    if (paymentStatus) {
      const success = await updateSupplyOrderPaymentStatus(id, paymentStatus)
      return NextResponse.json({ success })
    }

    if (status === 'DELIVERED' && tenantId) {
      const success = await receiveSupplyOrder(id, tenantId, receivedBy)
      return NextResponse.json({ success })
    }

    if (status) {
      const success = await updateSupplyOrderStatus(id, status, rejectionReason)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Nenhuma ação informada' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/supply-orders/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar pedido B2B' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = await deleteSupplyOrder(id)

    if (!success) {
      return NextResponse.json({ error: 'Falha ao excluir pedido de reposição' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota DELETE /api/supply-orders/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir pedido B2B' }, { status: 500 })
  }
}
