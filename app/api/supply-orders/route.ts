import { NextRequest, NextResponse } from 'next/server'
import {
  getSupplyOrders,
  createSupplyOrder,
} from '@/lib/repositories/inventoryRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || undefined
    const orders = await getSupplyOrders(tenantId)
    return NextResponse.json({ orders })
  } catch (err: any) {
    console.error('Erro na rota GET /api/supply-orders:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar pedidos B2B' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tenantId, items, totalAmount, totalSavings, notes } = body

    if (!tenantId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'tenantId e itens são obrigatórios' }, { status: 400 })
    }

    const order = await createSupplyOrder(
      tenantId,
      items,
      Number(totalAmount) || 0,
      Number(totalSavings) || 0,
      notes
    )

    return NextResponse.json({ order }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/supply-orders:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar pedido B2B' }, { status: 500 })
  }
}
