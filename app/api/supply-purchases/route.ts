import { NextRequest, NextResponse } from 'next/server'
import { getSupplierPurchases, recordSupplierPurchase } from '@/lib/repositories/inventoryRepository'

export async function GET() {
  try {
    const purchases = await getSupplierPurchases()
    return NextResponse.json({ purchases })
  } catch (err: any) {
    console.error('Erro na rota GET /api/supply-purchases:', err)
    return NextResponse.json({ error: err.message || 'Erro ao consultar compras' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { supplierId, itemId, quantity, costUnitPrice, invoiceNumber, batchNumber, expirationDate, notes } = body

    if (!supplierId || !itemId || !quantity || !costUnitPrice) {
      return NextResponse.json({ error: 'Fornecedor, insumo, quantidade e preço de custo são obrigatórios' }, { status: 400 })
    }

    const purchase = await recordSupplierPurchase({
      supplierId,
      itemId,
      quantity: Number(quantity),
      costUnitPrice: Number(costUnitPrice),
      invoiceNumber,
      batchNumber,
      expirationDate,
      notes,
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Falha ao registrar compra com fornecedor' }, { status: 500 })
    }

    return NextResponse.json({ purchase }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/supply-purchases:', err)
    return NextResponse.json({ error: err.message || 'Erro ao registrar compra com fornecedor' }, { status: 500 })
  }
}
