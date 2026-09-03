import { NextRequest, NextResponse } from 'next/server'
import { transferCentralToLocal } from '@/lib/repositories/inventoryRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { itemId, quantity, tenantId } = body

    if (!itemId || !quantity || quantity <= 0 || !tenantId) {
      return NextResponse.json(
        { error: 'Insumo, quantidade positiva e unidade são obrigatórios' },
        { status: 400 }
      )
    }

    const success = await transferCentralToLocal({
      itemId,
      quantity: Number(quantity),
      tenantId,
    })

    if (!success) {
      return NextResponse.json({ error: 'Falha na transferência interna' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota POST /api/inventory/transfer:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
