import { NextRequest, NextResponse } from 'next/server'
import {
  getHighlightsByTenant,
  getAllHighlightsAdmin,
  createHighlightItem,
  updateHighlightItem,
  deleteHighlightItem,
} from '@/lib/repositories/highlightsRepository'
import { getTenantByIdOrSlug, AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rawTenant =
      request.nextUrl.searchParams.get('loja') ||
      request.nextUrl.searchParams.get('tenantId') ||
      request.nextUrl.searchParams.get('tenant') ||
      '1'

    const isAdmin = request.nextUrl.searchParams.get('admin') === 'true'

    const tenant = await getTenantByIdOrSlug(rawTenant)
    const effectiveTenantId = tenant ? tenant.id : AVEIRO_HQ_ID

    const highlights = isAdmin
      ? await getAllHighlightsAdmin(effectiveTenantId)
      : await getHighlightsByTenant(effectiveTenantId)

    return NextResponse.json({
      highlights,
      tenantId: effectiveTenantId,
      tenantName: tenant?.name || 'Açaí da Rose',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar destaques' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json()
    const tenantId = body.tenantId || user?.tenantId || AVEIRO_HQ_ID

    const isMaster = user && hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])
    if (user && !isMaster && user.tenantId && user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Sem permissão para criar nesta loja' }, { status: 403 })
    }

    const created = await createHighlightItem(tenantId, body)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao criar destaque' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json()
    const id = body.id

    if (!id) {
      return NextResponse.json({ error: 'ID do destaque é obrigatório' }, { status: 400 })
    }

    const updated = await updateHighlightItem(id, body)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao atualizar destaque' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const ok = await deleteHighlightItem(id)
    return NextResponse.json({ success: ok })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao excluir destaque' },
      { status: 500 }
    )
  }
}
