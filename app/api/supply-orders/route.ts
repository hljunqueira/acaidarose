import { NextRequest, NextResponse } from 'next/server'
import {
  getSupplyOrders,
  createSupplyOrder,
} from '@/lib/repositories/inventoryRepository'
import { errorResponse } from '@/lib/api/response'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || undefined
    const orders = await getSupplyOrders(tenantId)
    return NextResponse.json({ orders })
  } catch (err: any) {
    console.error('Erro na rota GET /api/supply-orders:', err)
    return errorResponse(err, 'Erro ao buscar pedidos de reposição')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, items, totalAmount, totalSavings, notes, subtotalNet, taxTotal, taxBreakdown, shippingFee } = body

    if (!tenantId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'tenantId e itens são obrigatórios' }, { status: 400 })
    }

    const order = await createSupplyOrder(
      tenantId,
      items,
      Number(totalAmount) || 0,
      Number(totalSavings) || 0,
      notes,
      subtotalNet !== undefined ? Number(subtotalNet) : undefined,
      taxTotal !== undefined ? Number(taxTotal) : undefined,
      taxBreakdown,
      shippingFee !== undefined ? Number(shippingFee) : 0
    )

    return NextResponse.json({ order }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/supply-orders:', err)
    return errorResponse(err, 'Erro ao criar pedido de reposição')
  }
}
