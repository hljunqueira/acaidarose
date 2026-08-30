import { NextRequest, NextResponse } from 'next/server'
import { getTableByToken } from '@/lib/repositories/tablesRepository'

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

    const storeSlug = table.tenantId?.startsWith('11111111') ? 'aveiro' : 'torres-novas'
    return NextResponse.json({
      table: {
        id: table.id,
        number: table.number,
        code: table.code,
        nickname: table.nickname,
        tenantId: table.tenantId,
        storeSlug,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao resolver token de mesa' }, { status: 500 })
  }
}
