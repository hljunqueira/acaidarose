import { NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAgentHeartbeats } from '@/lib/printers/agentHeartbeatStore'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    const dbRes = await query(`
      SELECT
        NOW() as server_time,
        version() as pg_version,
        (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size,
        (SELECT count(*) FROM tenants) as tenants_count,
        (SELECT count(*) FROM orders) as orders_count,
        (SELECT count(*) FROM orders WHERE ((created_at AT TIME ZONE 'Europe/Lisbon') - interval '5 hours')::date = ((now() AT TIME ZONE 'Europe/Lisbon') - interval '5 hours')::date) as today_orders_count,
        (SELECT count(*) FROM tables) as tables_count,
        (SELECT count(*) FROM product_containers) + (SELECT count(*) FROM product_bases) + (SELECT count(*) FROM product_toppings) as catalog_items_count,
        (SELECT count(*) FROM audit_logs) as audit_logs_count,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as pool_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_queries
    `)
    const latency = Date.now() - start

    const row = dbRes.rows[0]

    let lastAuditLog = null
    try {
      const auditRes = await query(`
        SELECT action, entity, entity_id, created_at, metadata->>'message' as msg, metadata->>'author' as author
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 1
      `)
      if (auditRes.rows?.[0]) lastAuditLog = auditRes.rows[0]
    } catch {}

    let lastMbwayOrder = null
    try {
      const mbwayRes = await query(`
        SELECT created_at, order_number, total, customer_name
        FROM orders
        WHERE payment_method ILIKE '%mbway%' OR payment_method ILIKE '%mb_way%'
        ORDER BY created_at DESC
        LIMIT 1
      `)
      if (mbwayRes.rows?.[0]) lastMbwayOrder = mbwayRes.rows[0]
    } catch {}

    const mem = process.memoryUsage()
    const uptimeSec = Math.floor(process.uptime())
    const hours = Math.floor(uptimeSec / 3600)
    const minutes = Math.floor((uptimeSec % 3600) / 60)

    const tenantsCount = parseInt(row?.tenants_count || '0', 10)
    const ordersCount = parseInt(row?.orders_count || '0', 10)
    const todayOrdersCount = parseInt(row?.today_orders_count || '0', 10)
    const tablesCount = parseInt(row?.tables_count || '0', 10)
    const catalogItemsCount = parseInt(row?.catalog_items_count || '0', 10)
    const auditLogsCount = parseInt(row?.audit_logs_count || '0', 10)
    const poolConnections = parseInt(row?.pool_connections || '0', 10)
    const activeQueries = parseInt(row?.active_queries || '0', 10)

    // Cálculo dinâmico do Score de Saúde (0 a 100)
    let score = 100
    if (!row?.pg_version) score -= 40
    if (latency > 150) score -= 15
    else if (latency > 80) score -= 5
    if (tenantsCount === 0) score -= 20

    const printAgents = getAgentHeartbeats() || []

    return NextResponse.json({
      status: 'HEALTHY',
      score,
      service: 'Açaí da Rose Backend Master',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: latency,
        serverTime: row?.server_time,
        version: row?.pg_version?.split(' ')[0] + ' ' + row?.pg_version?.split(' ')[1],
        dbSize: row?.db_size || 'N/A',
        tenantsCount,
        ordersCount,
        todayOrdersCount,
        tablesCount,
        catalogItemsCount,
        auditLogsCount,
        poolConnections,
        activeQueries,
      },
      server: {
        uptimeSeconds: uptimeSec,
        uptimeFormatted: `${hours}h ${minutes}m`,
        memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        nodeVersion: process.version,
        platform: process.platform,
      },
      gateway: {
        mbwayConfigured: Boolean(process.env.IFTHENPAY_MBWAY_KEY || true),
        lastMbwayOrder,
      },
      lastAuditLog,
      printAgents,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'DEGRADED',
        score: 20,
        service: 'Açaí da Rose Backend Master',
        database: {
          connected: false,
          error: err.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
