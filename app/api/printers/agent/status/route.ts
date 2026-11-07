import { NextRequest, NextResponse } from 'next/server'
import { getAgentHeartbeat, getAgentHeartbeats } from '@/lib/printers/agentHeartbeatStore'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const tenantParam = request.nextUrl.searchParams.get('tenantId') || request.nextUrl.searchParams.get('token')

  try {
    if (!tenantParam) {
      // Retorna todos os agentes conhecidos
      return NextResponse.json({
        success: true,
        agents: getAgentHeartbeats(),
      })
    }

    const tenant = await getTenantByIdOrSlug(tenantParam)
    const tenantId = tenant ? tenant.id : tenantParam
    const heartbeat = getAgentHeartbeat(tenantId)

    if (!heartbeat) {
      return NextResponse.json({
        success: true,
        online: false,
        message: 'Nenhum servidor de impressão conectado recentemente para esta unidade.',
      })
    }

    const lastSeen = new Date(heartbeat.lastSeenAt).getTime()
    const now = Date.now()
    const diffSeconds = Math.round((now - lastSeen) / 1000)

    // Considera online se fez polling nos últimos 20 segundos (o agente faz poll a cada 2 segundos)
    const isOnline = diffSeconds <= 20

    return NextResponse.json({
      success: true,
      online: isOnline,
      source: 'CLOUD_HEARTBEAT',
      service: 'Açaí da Rose Print Agent (Windows)',
      tenantId: heartbeat.tenantId,
      tenantName: heartbeat.tenantName,
      lastSeenAt: heartbeat.lastSeenAt,
      diffSeconds,
      ip: heartbeat.ip,
      message: isOnline
        ? `Servidor Windows ativo e sincronizado (${diffSeconds}s atrás)`
        : `Servidor Windows ausente há ${diffSeconds}s`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

