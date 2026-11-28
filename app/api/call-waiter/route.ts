import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

export const dynamic = 'force-dynamic'

let tableEnsured = false

async function ensureWaiterCallsTable() {
  if (tableEnsured) return
  await query(`
    CREATE TABLE IF NOT EXISTS waiter_calls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      table_number INTEGER NULL DEFAULT 0,
      table_label VARCHAR(120) NULL,
      reason VARCHAR(200) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      attended_at TIMESTAMPTZ NULL,
      resolved_at TIMESTAMPTZ NULL
    )
  `)
  await query(`ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS table_label VARCHAR(120) NULL`)
  await query(`ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ NULL`)
  await query(`ALTER TABLE waiter_calls ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ NULL`)
  await query(`ALTER TABLE waiter_calls ALTER COLUMN table_number DROP NOT NULL`)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_waiter_calls_tenant_status ON waiter_calls (tenant_id, status, created_at DESC)`
  )
  tableEnsured = true
}

function parseTableNumber(label: string): number {
  const match = label.match(/\d+/)
  return match ? Number(match[0]) : 0
}

export async function GET(req: NextRequest) {
  try {
    await ensureWaiterCallsTable()
    const url = new URL(req.url)
    const tenantId = url.searchParams.get('tenantId')?.trim()

    if (!tenantId) {
      return NextResponse.json(
        { calls: [] },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const res = await query(
      `SELECT
         id,
         tenant_id AS "tenantId",
         COALESCE(
           NULLIF(TRIM(table_label), ''),
           CASE WHEN table_number IS NOT NULL AND table_number > 0 THEN 'Mesa ' || table_number::text ELSE 'Balcão' END
         ) AS "tableLabel",
         reason,
         status,
         created_at AS "createdAt"
       FROM waiter_calls
       WHERE tenant_id = $1 AND status = 'PENDING'
       ORDER BY created_at DESC
       LIMIT 30`,
      [tenantId]
    )

    return NextResponse.json(
      { calls: res.rows || [] },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err: any) {
    console.error('Erro em GET /api/call-waiter:', err)
    return NextResponse.json({ calls: [], error: err?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureWaiterCallsTable()
    const body = await req.json()
    const tenantId = String(body?.tenantId || '').trim()
    const tableLabel = String(body?.tableLabel || 'Balcão').trim().slice(0, 120)
    const tableNumber = parseTableNumber(tableLabel)
    const reason = String(body?.reason || 'Atendimento').trim().slice(0, 200)

    if (!tenantId) {
      return NextResponse.json(
        { error: 'ID da loja (tenantId) é obrigatório.' },
        { status: 400 }
      )
    }

    const res = await query(
      `INSERT INTO waiter_calls (tenant_id, table_number, table_label, reason, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING id, tenant_id AS "tenantId", table_label AS "tableLabel", reason, status, created_at AS "createdAt"`,
      [tenantId, tableNumber, tableLabel, reason]
    )

    return NextResponse.json({ success: true, call: res.rows[0] }, { status: 201 })
  } catch (err: any) {
    console.error('Erro em POST /api/call-waiter:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao registar chamado' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureWaiterCallsTable()
    const body = await req.json()
    const callId = String(body?.callId || '').trim()
    const status = String(body?.status || 'RESOLVED').trim().toUpperCase()

    if (!callId) {
      return NextResponse.json({ error: 'callId é obrigatório.' }, { status: 400 })
    }

    const isResolved = status === 'RESOLVED'

    await query(
      `UPDATE waiter_calls
       SET status = $1::text,
           resolved_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END,
           attended_at = CASE WHEN $2::boolean THEN NOW() ELSE NULL END
       WHERE id::text = $3::text`,
      [status, isResolved, callId]
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Erro em PATCH /api/call-waiter:', err)
    return NextResponse.json({ error: 'Erro ao atualizar chamado' }, { status: 500 })
  }
}
