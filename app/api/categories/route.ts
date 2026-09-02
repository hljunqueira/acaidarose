import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getCategoriesByTenant, createCategory } from '@/lib/repositories/categoriesRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || searchParams.get('loja') || AVEIRO_HQ_ID
    const categories = await getCategoriesByTenant(tenantId)
    return NextResponse.json({ categories })
  } catch (err: any) {
    console.error('Erro na rota GET /api/categories:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar categorias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { name, slug, description, emoji, menuId, displayOrder, active, defaultPrice, weightGrams, tenantId } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 })
    }

    const category = await createCategory({
      name,
      slug,
      description,
      emoji,
      menuId,
      displayOrder: Number(displayOrder) || 1,
      active: active !== undefined ? active : true,
      defaultPrice: Number(defaultPrice) || 0,
      weightGrams: weightGrams ? Number(weightGrams) : undefined,
      tenantId: tenantId || user?.tenantId || AVEIRO_HQ_ID,
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/categories:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar categoria' }, { status: 500 })
  }
}
