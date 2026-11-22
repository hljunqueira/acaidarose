import { NextRequest, NextResponse } from 'next/server'
import {
  updateMasterItem,
  deleteMasterItem,
  updateStoreMinAlert,
} from '@/lib/repositories/inventoryRepository'
import { errorResponse } from '@/lib/api/response'

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
      purchaseTaxRate,
      hasPurchaseTax,
      netWeightKg,
      pricePerKg,
      isCriticalChecklist,
    } = body

    if (minAlertQuantity !== undefined && tenantId) {
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
      taxRate: taxRate !== undefined && taxRate !== null ? Number(taxRate) : undefined,
      purchaseTaxRate: purchaseTaxRate !== undefined && purchaseTaxRate !== null ? Number(purchaseTaxRate) : undefined,
      hasPurchaseTax: hasPurchaseTax !== undefined ? Boolean(hasPurchaseTax) : undefined,
      minAlertQuantity: minAlertQuantity !== undefined && minAlertQuantity !== null ? Number(minAlertQuantity) : undefined,
      netWeightKg: netWeightKg !== undefined ? Number(netWeightKg) : undefined,
      pricePerKg: pricePerKg !== undefined ? Number(pricePerKg) : undefined,
      isCriticalChecklist,
    })

    return NextResponse.json({ success: true, item: updated })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/inventory/[id]:', err)
    return errorResponse(err, 'Erro ao atualizar insumo')
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
    return errorResponse(err, 'Erro ao excluir insumo')
  }
}
