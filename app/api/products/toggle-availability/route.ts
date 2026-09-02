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

    // Franqueadora (SUPER_ADMIN / FRANCHISOR_ADMIN) pode alterar qualquer loja; franqueados apenas a sua
    const isMaster = user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN'
    if (!isMaster && user.tenantId && user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Sem permissão para alterar outra loja' }, { status: 403 })
    }

    const result = await toggleStoreItemAvailability(tenantId, productId, Boolean(available))
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao alterar disponibilidade' }, { status: 500 })
  }
}
