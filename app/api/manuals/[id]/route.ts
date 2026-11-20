import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { getManualArticleById, updateManualArticle, deleteManualArticle } from '@/lib/repositories/manualsRepository'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 })
    }

    const { id } = await params
    const article = await getManualArticleById(id)
    if (!article) {
      return NextResponse.json({ error: 'Manual não encontrado.' }, { status: 404 })
    }

    // Valida permissão de acesso ao artigo
    if (user.role !== 'SUPER_ADMIN' && !article.targetRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Acesso negado para o seu perfil.' }, { status: 403 })
    }

    return NextResponse.json({ article })
  } catch (err: any) {
    console.error('Erro ao buscar manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permissão negada. Apenas o Super Admin pode alterar manuais.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const article = await updateManualArticle(id, body)

    return NextResponse.json({ article })
  } catch (err: any) {
    console.error('Erro ao atualizar manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Permissão negada. Apenas o Super Admin pode excluir manuais.' }, { status: 403 })
    }

    const { id } = await params
    await deleteManualArticle(id)

    return NextResponse.json({ success: true, message: 'Manual removido com sucesso.' })
  } catch (err: any) {
    console.error('Erro ao deletar manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
