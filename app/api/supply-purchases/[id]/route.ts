import { NextRequest, NextResponse } from 'next/server'
import {
  updateSupplierPurchase,
  deleteSupplierPurchase,
} from '@/lib/repositories/inventoryRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      supplierId,
      itemId,
      quantity,
      costUnitPrice,
      invoiceNumber,
      batchNumber,
      expirationDate,
      notes,
    } = body

    const updated = await updateSupplierPurchase(id, {
      supplierId,
      itemId,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      costUnitPrice: costUnitPrice !== undefined ? Number(costUnitPrice) : undefined,
      invoiceNumber,
      batchNumber,
      expirationDate,
      notes,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Compra com fornecedor não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, purchase: updated })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/supply-purchases/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar compra' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const success = await deleteSupplierPurchase(id)
    if (!success) {
      return NextResponse.json({ error: 'Falha ao excluir compra com fornecedor' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota DELETE /api/supply-purchases/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao excluir compra' }, { status: 500 })
  }
}
