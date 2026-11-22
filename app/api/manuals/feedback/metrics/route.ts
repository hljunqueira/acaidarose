import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import {
  getManualFeedbackMetrics,
  updateFeedbackSuggestionStatus,
  updateFeedbackSuggestionText,
  deleteFeedbackSuggestion,
  resetArticleVotes,
} from '@/lib/repositories/manualsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin.' }, { status: 403 })
    }

    const metrics = await getManualFeedbackMetrics()
    return NextResponse.json(metrics)
  } catch (err: any) {
    console.error('Erro ao buscar métricas de feedback de manuais:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, suggestionText } = body

    if (!id) {
      return NextResponse.json({ error: 'Parâmetro id é obrigatório.' }, { status: 400 })
    }

    if (suggestionText !== undefined) {
      const success = await updateFeedbackSuggestionText(id, suggestionText)
      return NextResponse.json({ success })
    }

    if (status) {
      if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Acesso restrito ao Super Admin.' }, { status: 403 })
      }
      const success = await updateFeedbackSuggestionStatus(id, status)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Nenhuma ação informada.' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro ao atualizar sugestão:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const feedbackId = searchParams.get('feedbackId')
    const articleId = searchParams.get('articleId')

    if (feedbackId) {
      const success = await deleteFeedbackSuggestion(feedbackId)
      return NextResponse.json({ success })
    }

    if (articleId) {
      const success = await resetArticleVotes(articleId)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: 'Parâmetro feedbackId ou articleId obrigatório.' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro ao excluir/resetar feedback de manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
