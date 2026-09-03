import { NextRequest, NextResponse } from 'next/server'
import {
  updateMasterItem,
  deleteMasterItem,
  updateStoreMinAlert,
} from '@/lib/repositories/inventoryRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      tenantId,
      minAlertQuantity,
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

    if (tenantId && minAlertQuantity !== undefined) {
      await updateStoreMinAlert(tenantId, id, Number(minAlertQuantity))
    }

    const updated = await updateMasterItem(id, {
      name,
      unit,
      category,
      supplyCode,
      marketPrice: marketPrice !== undefined ? Number(marketPrice) : undefined,
      supplyPrice: supplyPrice !== undefined ? Number(supplyPrice) : undefined,
      lastCostPrice: lastCostPrice !== undefined ? Number(lastCostPrice) : undefined,
      centralStock: centralStock !== undefined ? Number(centralStock) : undefined,
      taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
      netWeightKg: netWeightKg !== undefined ? Number(netWeightKg) : undefined,
      pricePerKg: pricePerKg !== undefined ? Number(pricePerKg) : undefined,
      isCriticalChecklist,
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/inventory/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar insumo' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = await deleteMasterItem(id)
    if (!success) {
      return NextResponse.json({ error: 'Falha ao excluir insumo' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota DELETE /api/inventory/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir insumo' }, { status: 500 })
  }
}
