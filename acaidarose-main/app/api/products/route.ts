import { NextRequest, NextResponse } from 'next/server'
import { getCatalogByTenant } from '@/lib/repositories/productsRepository'
import { DEFAULT_TENANT } from '@/lib/supabase/mockStore'

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId') || DEFAULT_TENANT.id
    const catalog = await getCatalogByTenant(tenantId)
    return NextResponse.json(catalog)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar cardápio' }, { status: 500 })
  }
}
