import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuditLogs } from '@/lib/repositories/auditRepository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId') || 'all'
    const entity = searchParams.get('entity') || 'ALL'
    const level = searchParams.get('level') || 'ALL'
    const search = searchParams.get('search')?.toLowerCase() || ''

    // 1. Busca os logs reais da tabela audit_logs
    const realLogs = await getAuditLogs({
      tenantId: tenantId !== 'all' ? tenantId : undefined,
      entity: entity !== 'ALL' ? entity : undefined,
      limit: 150,
    })

    // 2. Busca também os pedidos recentes, solicitações e operações do banco
    const ordersRes = await query(
      `SELECT id, tenant_id, order_number, customer_name, status, total, payment_method, cashier_name, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 30`
    ).catch(() => ({ rows: [] }))

    const requestsRes = await query(
      `SELECT id, tenant_id, request_type, title, status, created_at
       FROM franchise_requests
       ORDER BY created_at DESC
       LIMIT 15`
    ).catch(() => ({ rows: [] }))

    const formattedLogs: any[] = [...realLogs]

    // Evita duplicatas se já foram inseridos via audit_logs
    const loggedEntityIds = new Set(realLogs.map((l: any) => l.entityId || l.id))

    // Logs de Pedidos & Pagamentos
    ordersRes.rows.forEach((o: any) => {
      if (!loggedEntityIds.has(o.id)) {
        formattedLogs.push({
          id: `ord-${o.id}`,
          timestamp: new Date(o.created_at).toISOString().replace('T', ' ').substring(0, 19),
          level: o.status === 'CANCELLED' ? 'WARN' : 'INFO',
          scope: 'PEDIDOS_GATEWAY',
          action: `ORDER_${o.status}`,
          message: `Comanda #${o.order_number || o.id.substring(0, 5)} (${o.customer_name || 'Cliente'}) · Estado: ${o.status} · Total: €${Number(o.total || 0).toFixed(2)} · Pagamento: ${o.payment_method || 'Balcão'}`,
          author: o.cashier_name || 'Henrique Linhares Junqueira',
          role: 'OPERADOR',
          tenant: o.tenant_id === '11111111-1111-1111-1111-111111111111' ? 'Matriz Aveiro' : 'Filial Torres Novas',
          entityId: o.id,
          metadata: { orderId: o.id, orderNumber: o.order_number, total: o.total, status: o.status },
        })
      }
    })

    // Logs de Solicitações da Rede
    requestsRes.rows.forEach((r: any) => {
      if (!loggedEntityIds.has(r.id)) {
        formattedLogs.push({
          id: `req-${r.id}`,
          timestamp: new Date(r.created_at).toISOString().replace('T', ' ').substring(0, 19),
          level: 'INFO',
          scope: 'REDE_FRANQUIAS',
          action: 'FRANCHISE_REQUEST',
          message: `Evento de Franquia: ${r.request_type} · ${r.title} · Estado: ${r.status}`,
          author: 'Franqueadora Master',
          role: 'SUPER_ADMIN',
          tenant: 'Franqueadora Master',
          entityId: r.id,
          metadata: { requestId: r.id, type: r.request_type, status: r.status },
        })
      }
    })

    // Ordena pelo timestamp decrescente
    formattedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Aplica filtros se fornecidos
    let filtered = formattedLogs
    if (level !== 'ALL') {
      filtered = filtered.filter((l) => l.level === level)
    }
    if (entity !== 'ALL') {
      filtered = filtered.filter((l) => l.scope === entity || l.action?.includes(entity))
    }
    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.message?.toLowerCase().includes(search) ||
          l.author?.toLowerCase().includes(search) ||
          l.scope?.toLowerCase().includes(search) ||
          l.tenant?.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({ logs: filtered })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar logs de auditoria' },
      { status: 500 }
    )
  }
}
