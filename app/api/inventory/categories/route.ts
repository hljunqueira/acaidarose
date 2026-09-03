import { NextRequest, NextResponse } from 'next/server'
import {
  getInventoryCategories,
  createInventoryCategory,
} from '@/lib/repositories/inventoryRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'

export async function GET() {
  try {
    const categories = await getInventoryCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Erro na rota GET /api/inventory/categories:', error)
    return NextResponse.json(
      { error: 'Falha ao buscar categorias de estoque' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, code, displayOrder } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Nome e código da categoria são obrigatórios' },
        { status: 400 }
      )
    }

    const created = await createInventoryCategory({
      name,
      code,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
    })

    // Log de auditoria para o TI
    await recordAuditLog({
      tenantId: '11111111-1111-1111-1111-111111111111',
      action: 'CREATE_INVENTORY_CATEGORY',
      entity: 'inventory_categories',
      entityId: created.id,
      message: `Categoria de estoque criada: ${created.name} (${created.code})`,
      metadata: {
        categoryName: created.name,
        categoryCode: created.code,
        displayOrder: created.displayOrder,
      },
    })

    return NextResponse.json({ category: created }, { status: 201 })
  } catch (error: any) {
    console.error('Erro na rota POST /api/inventory/categories:', error)
    return NextResponse.json(
      { error: error.message || 'Falha ao criar categoria de estoque' },
      { status: 500 }
    )
  }
}
