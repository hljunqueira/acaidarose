import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getMenusByTenant, createMenu } from '@/lib/repositories/categoriesRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || searchParams.get('loja') || AVEIRO_HQ_ID
    const menus = await getMenusByTenant(tenantId)
    return NextResponse.json({ menus })
  } catch (err: any) {
    console.error('Erro na rota GET /api/menus:', err)
    return NextResponse.json({ error: err.message || 'Erro ao buscar menus' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (user && !hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { name, code, description, displayOrder, active, availableHours, tenantId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome do cardápio é obrigatório' }, { status: 400 })
    }

    const created = await createMenu({
      name: name.trim(),
      code,
      description,
      displayOrder: Number(displayOrder) || 1,
      active: active !== false,
      availableHours,
      tenantId: tenantId || user?.tenantId,
    })

    if (!created) {
      return NextResponse.json({ error: 'Falha ao criar menu' }, { status: 500 })
    }

    return NextResponse.json({ menu: created }, { status: 201 })
  } catch (err: any) {
    console.error('Erro na rota POST /api/menus:', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar menu' }, { status: 500 })
  }
}
