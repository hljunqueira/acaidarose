import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { getManualArticles, createManualArticle } from '@/lib/repositories/manualsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const onlyPublished = searchParams.get('onlyPublished') !== 'false'
    const requestedRole = searchParams.get('role') as any

    const effectiveRole =
      user.role === 'SUPER_ADMIN' && requestedRole && requestedRole !== 'ALL'
        ? requestedRole
        : user.role

    const articles = await getManualArticles({
      categoryId,
      userRole: effectiveRole,
      onlyPublished,
    })

    return NextResponse.json({ articles })
  } catch (err: any) {
    console.error('Erro ao listar manuais:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permissão negada. Apenas o Super Admin pode criar manuais.' }, { status: 403 })
    }

    const body = await request.json()
    if (!body?.title?.trim() || !body?.categoryId) {
      return NextResponse.json({ error: 'Título e categoria são obrigatórios.' }, { status: 400 })
    }

    const article = await createManualArticle(body)
    return NextResponse.json({ article }, { status: 201 })
  } catch (err: any) {
    console.error('Erro ao criar manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
