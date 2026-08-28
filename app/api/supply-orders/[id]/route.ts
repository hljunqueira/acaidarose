import { NextRequest, NextResponse } from 'next/server'
import {
  updateSupplyOrderStatus,
  receiveSupplyOrder,
} from '@/lib/repositories/inventoryRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, tenantId, receivedBy } = body

    if (status === 'DELIVERED' && tenantId) {
      const success = await receiveSupplyOrder(id, tenantId, receivedBy)
      return NextResponse.json({ success })
    }

    if (status) {
      const success = await updateSupplyOrderStatus(id, status)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Status não informado' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/supply-orders/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar pedido B2B' }, { status: 500 })
  }
}
