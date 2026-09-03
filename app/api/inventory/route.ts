import { NextRequest, NextResponse } from 'next/server'
import {
  getAllMasterItems,
  getStoreInventory,
  createMasterItem,
} from '@/lib/repositories/inventoryRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const scope = searchParams.get('scope')

    if (scope === 'master' || !tenantId) {
      const items = await getAllMasterItems()
      return NextResponse.json({ items })
    }

    const items = await getStoreInventory(tenantId)
    return NextResponse.json({ items })
  } catch (err: any) {
    console.error('Erro na rota GET /api/inventory:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar inventário' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      unit,
      category,
      supplyCode,
      marketPrice,
      supplyPrice,
      lastCostPrice,
      centralStock,
      taxRate,
      netWeightKg,
      pricePerKg,
      isCriticalChecklist,
    } = body

    if (!name || !category || !unit) {
      return NextResponse.json({ error: 'Nome, categoria e unidade são obrigatórios' }, { status: 400 })
    }

    const newItem = await createMasterItem({
      name,
      unit,
      category,
      supplyCode,
      marketPrice: Number(marketPrice) || 0,
      supplyPrice: Number(supplyPrice) || 0,
      lastCostPrice: lastCostPrice !== undefined ? Number(lastCostPrice) : undefined,
      centralStock: centralStock !== undefined ? Number(centralStock) : undefined,
      taxRate: taxRate !== undefined ? Number(taxRate) : 23.00,
      netWeightKg: netWeightKg !== undefined ? Number(netWeightKg) : undefined,
      pricePerKg: pricePerKg !== undefined ? Number(pricePerKg) : undefined,
      isCriticalChecklist: Boolean(isCriticalChecklist),
    })

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/inventory:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar insumo' }, { status: 500 })
  }
}
