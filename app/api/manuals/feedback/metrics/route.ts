import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { getManualFeedbackMetrics, updateFeedbackSuggestionStatus } from '@/lib/repositories/manualsRepository'

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
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin.' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Parâmetros id e status são obrigatórios.' }, { status: 400 })
    }

    const success = await updateFeedbackSuggestionStatus(id, status)
    return NextResponse.json({ success })
  } catch (err: any) {
    console.error('Erro ao atualizar status de sugestão:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
