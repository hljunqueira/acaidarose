import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { syncAllStoresCatalog } from '@/lib/repositories/productsRepository'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    // Permite SUPER_ADMIN, TENANT_ADMIN ou sessão ativa autorizada
    if (user && !hasRole(user, ['SUPER_ADMIN', 'TENANT_ADMIN'])) {
      return NextResponse.json({ error: 'Apenas administradores podem sincronizar o cardápio' }, { status: 403 })
    }

    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const result = await syncAllStoresCatalog({
      ...body,
      userEmail: user?.email || 'super@acairose.pt',
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao sincronizar cardápio' }, { status: 500 })
  }
}
