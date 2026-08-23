import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { toggleStoreItemAvailability } from '@/lib/repositories/productsRepository'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const tenantId = body.tenantId || user.tenantId || 'tenant-torres-novas'
    const productId = body.productId || body.id
    const available = body.available !== undefined ? body.available : body.active

    if (!productId || available === undefined) {
      return NextResponse.json({ error: 'Parâmetros productId e available/active são obrigatórios' }, { status: 400 })
    }

    // Se não for super admin, só pode alterar da sua própria loja
    if (user.role !== 'SUPER_ADMIN' && user.tenantId && user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Sem permissão para alterar outra loja' }, { status: 403 })
    }

    const result = await toggleStoreItemAvailability(tenantId, productId, Boolean(available))
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao alterar disponibilidade' }, { status: 500 })
  }
}
