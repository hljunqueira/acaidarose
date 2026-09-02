import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { reorderCategories } from '@/lib/repositories/categoriesRepository'

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (user && !hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { items, tenantId } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Lista de ordenação inválida' }, { status: 400 })
    }

    const success = await reorderCategories(items, tenantId || user?.tenantId)
    if (!success) {
      return NextResponse.json({ error: 'Falha ao salvar reordenação' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/categories/reorder:', err)
    return NextResponse.json({ error: err.message || 'Erro ao reordenar categorias' }, { status: 500 })
  }
}
