import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/api/authGuard'
import { voteManualFeedback } from '@/lib/repositories/manualsRepository'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const isHelpful = Boolean(body?.isHelpful)

    const result = await voteManualFeedback(id, isHelpful)
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('Erro ao registrar feedback do manual:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
