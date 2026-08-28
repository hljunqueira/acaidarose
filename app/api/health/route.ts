import { NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    const dbRes = await query('SELECT NOW() as server_time, version() as pg_version, count(*) as tenants_count FROM tenants')
    const latency = Date.now() - start

    const row = dbRes.rows[0]

    return NextResponse.json({
      status: 'HEALTHY',
      service: 'Açaí da Rose Backend',
      environment: process.env.NODE_ENV || 'production',
      database: {
        connected: true,
        latencyMs: latency,
        serverTime: row?.server_time,
        version: row?.pg_version?.split(' ')[0] + ' ' + row?.pg_version?.split(' ')[1],
        tenantsCount: parseInt(row?.tenants_count || '0', 10),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'DEGRADED',
        service: 'Açaí da Rose Backend',
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
