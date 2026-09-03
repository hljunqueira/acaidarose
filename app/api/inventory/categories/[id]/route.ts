import { NextRequest, NextResponse } from 'next/server'
import {
  updateInventoryCategory,
  deleteInventoryCategory,
} from '@/lib/repositories/inventoryRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, code, displayOrder } = body

    const updated = await updateInventoryCategory(id, {
      name,
      code,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : undefined,
    })

    if (!updated) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Log de auditoria para o TI
    await recordAuditLog({
      tenantId: '11111111-1111-1111-1111-111111111111',
      action: 'UPDATE_INVENTORY_CATEGORY',
      entity: 'inventory_categories',
      entityId: id,
      message: `Categoria de estoque atualizada: ${updated.name} (${updated.code})`,
      metadata: {
        name: updated.name,
        code: updated.code,
        displayOrder: updated.displayOrder,
      },
    })

    return NextResponse.json({ category: updated })
  } catch (error: any) {
    console.error('Erro na rota PUT /api/inventory/categories/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao atualizar categoria' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = await deleteInventoryCategory(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao excluir categoria' },
        { status: 400 }
      )
    }

    // Log de auditoria para o TI
    await recordAuditLog({
      tenantId: '11111111-1111-1111-1111-111111111111',
      action: 'DELETE_INVENTORY_CATEGORY',
      entity: 'inventory_categories',
      entityId: id,
      message: `Categoria de estoque removida: ID ${id}`,
      metadata: { categoryId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na rota DELETE /api/inventory/categories/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao excluir categoria' },
      { status: 500 }
    )
  }
}
