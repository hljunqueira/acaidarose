import { NextRequest, NextResponse } from 'next/server'
import { getTenantByIdOrSlug, updateTenant } from '@/lib/repositories/tenantsRepository'
import { getAuthUser } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenant = await getTenantByIdOrSlug(id)
    if (!tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ tenant })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const tenant = await getTenantByIdOrSlug(id)
    if (!tenant) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const updated = await updateTenant(tenant.id, body)
    return NextResponse.json({ tenant: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
