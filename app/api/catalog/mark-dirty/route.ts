import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { normalizeTenantId } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawTenant = body.tenantId || ''
    const tenantId = normalizeTenantId(rawTenant)
    const reason = (body.reason || 'Alteração de catálogo').trim()

    const itemJson = JSON.stringify({
      reason,
      timestamp: new Date().toISOString(),
    })

    const res = await query(`
      INSERT INTO store_catalog_versions (tenant_id, version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary)
      VALUES ($1, 1, NOW(), TRUE, 1, jsonb_build_array($2::jsonb))
      ON CONFLICT (tenant_id) DO UPDATE
      SET has_pending_changes = TRUE,
          pending_changes_count = store_catalog_versions.pending_changes_count + 1,
          pending_changes_summary = CASE
            WHEN jsonb_array_length(COALESCE(store_catalog_versions.pending_changes_summary, '[]'::jsonb)) >= 20
            THEN (store_catalog_versions.pending_changes_summary - 0) || jsonb_build_array($2::jsonb)
            ELSE COALESCE(store_catalog_versions.pending_changes_summary, '[]'::jsonb) || jsonb_build_array($2::jsonb)
          END,
          updated_at = NOW()
      RETURNING version, has_pending_changes, pending_changes_count, pending_changes_summary
    `, [tenantId, itemJson])

    const row = res.rows[0]

    return NextResponse.json({
      success: true,
      tenantId,
      hasPendingChanges: true,
      pendingCount: Number(row?.pending_changes_count) || 1,
      pendingSummary: row?.pending_changes_summary || [],
    })
  } catch (err: any) {
    console.error('Erro ao marcar alterações pendentes:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao registrar pendência' },
      { status: 500 }
    )
  }
}
