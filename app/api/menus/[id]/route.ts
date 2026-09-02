import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { updateMenu } from '@/lib/repositories/categoriesRepository'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req)
    if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { tenantId } = body

    const updated = await updateMenu(id, {
      ...body,
      tenantId: tenantId || user?.tenantId,
    })

    if (!updated) {
      return NextResponse.json({ error: 'Menu não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ menu: updated })
  } catch (err: any) {
    console.error('Erro na rota PUT /api/menus/[id]:', err)
    return NextResponse.json({ error: err.message || 'Erro ao atualizar menu' }, { status: 500 })
  }
}
