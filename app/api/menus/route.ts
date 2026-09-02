import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { getMenusByTenant } from '@/lib/repositories/categoriesRepository'
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
