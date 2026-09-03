import { NextRequest, NextResponse } from 'next/server'
import { getTableByToken } from '@/lib/repositories/tablesRepository'
import { getTenantByIdOrSlug, AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    const table = await getTableByToken(token)
    if (!table) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 })
    }

    const tenant = await getTenantByIdOrSlug(table.tenantId)
    const storeSlug = tenant?.slug || (table.tenantId?.startsWith('22222222') ? 'torres-novas' : table.tenantId?.startsWith('33333333') ? 'aveiro' : 'figueira-da-foz')
    const storeName = tenant?.name || (storeSlug === 'torres-novas' ? 'Loja 2 - Torres Novas' : storeSlug === 'aveiro' ? 'Loja 3 - Aveiro' : 'Loja 1 - Figueira da Foz (Matriz)')

    return NextResponse.json({
      table: {
        id: table.id,
        number: table.number,
        code: table.code,
        nickname: table.nickname,
        tenantId: table.tenantId || tenant?.id || AVEIRO_HQ_ID,
        storeSlug,
        storeName,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao resolver token de mesa' }, { status: 500 })
  }
}
