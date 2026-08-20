import { NextRequest, NextResponse } from 'next/server'
import { mockStore } from '@/lib/supabase/mockStore'
import { getAuthUser } from '@/lib/api/authGuard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenant = mockStore.tenants?.find((t) => t.id === id)
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

    const tenantIndex = mockStore.tenants?.findIndex((t) => t.id === id)
    if (tenantIndex === -1 || tenantIndex === undefined) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const current = mockStore.tenants[tenantIndex]
    const updated = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    mockStore.tenants[tenantIndex] = updated

    // Audit log
    mockStore.auditLogs?.unshift({
      id: `audit-${Date.now()}`,
      tenantId: id,
      userName: user.name,
      userEmail: user.email,
      action: 'UPDATE_COMPANY_SETTINGS',
      description: `Atualizou os dados da empresa/horários da unidade ${updated.name}`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ tenant: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
