import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { getManualCategories, createManualCategory } from '@/lib/repositories/manualsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedRole = searchParams.get('role') as any

    const effectiveRole =
      user.role === 'SUPER_ADMIN' && requestedRole && requestedRole !== 'ALL'
        ? requestedRole
        : user.role

    const categories = await getManualCategories(effectiveRole)
    return NextResponse.json({ categories })
  } catch (err: any) {
    console.error('Erro ao listar categorias de manuais:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permissão negada. Apenas o Super Admin pode gerenciar categorias.' }, { status: 403 })
    }

    const body = await request.json()
    if (!body?.title?.trim()) {
      return NextResponse.json({ error: 'O título da categoria é obrigatório.' }, { status: 400 })
    }

    const category = await createManualCategory(body)
    return NextResponse.json({ category }, { status: 201 })
  } catch (err: any) {
    console.error('Erro ao criar categoria de manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
