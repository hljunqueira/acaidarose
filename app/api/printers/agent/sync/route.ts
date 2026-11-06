import { NextRequest, NextResponse } from 'next/server'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { getPrintersByTenantId } from '@/lib/repositories/printersRepository'
import { recordAgentHeartbeat } from '@/lib/printers/agentHeartbeatStore'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ success: false, error: 'Token da loja não informado.' }, { status: 400 })
  }

  try {
    const tenant = await getTenantByIdOrSlug(token)
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Loja não encontrada para o token informado.' }, { status: 404 })
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    recordAgentHeartbeat(tenant.id, tenant.name, ip)

    const printers = await getPrintersByTenantId(tenant.id)

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        nif: tenant.nif,
        address: tenant.address,
        phone: tenant.phone,
      },
      printers: printers.filter((p) => p.isActive),
    })
  } catch (err: any) {
    console.error('[Printer Agent Sync Error]:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao sincronizar loja.' }, { status: 500 })
  }
}

