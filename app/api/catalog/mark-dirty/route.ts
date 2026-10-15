import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { resolveTenantId } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawTenant = body.tenantId || ''
    const tenantId = await resolveTenantId(rawTenant)
    const reason = (body.reason || 'Alteração de catálogo').trim()
    const applyToAll = Boolean(body.applyToAll)
    const changeId = body.id || `chg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const itemData = {
      id: changeId,
      reason,
      entity: body.entity || 'product',
      entityId: body.entityId || body.productId || null,
      productName: body.productName || null,
      field: body.field || null,
      previousValue: body.previousValue !== undefined ? body.previousValue : null,
      newValue: body.newValue !== undefined ? body.newValue : null,
      scope: applyToAll ? 'NETWORK' : 'STORE',
      tenantId,
      timestamp: new Date().toISOString(),
    }

    const itemJson = JSON.stringify(itemData)

    if (applyToAll) {
      // Propaga a pendência para todas as lojas ativas da rede
      const tenantsRes = await query(`SELECT id FROM tenants WHERE deleted_at IS NULL`)
      for (const t of tenantsRes.rows) {
        await query(`
          INSERT INTO store_catalog_versions (tenant_id, version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary)
          VALUES ($1, 1, NOW(), TRUE, 1, jsonb_build_array($2::jsonb))
          ON CONFLICT (tenant_id) DO UPDATE
          SET has_pending_changes = TRUE,
              pending_changes_count = store_catalog_versions.pending_changes_count + 1,
              pending_changes_summary = CASE
                WHEN jsonb_array_length(COALESCE(store_catalog_versions.pending_changes_summary, '[]'::jsonb)) >= 30
                THEN (store_catalog_versions.pending_changes_summary - 0) || jsonb_build_array($2::jsonb)
                ELSE COALESCE(store_catalog_versions.pending_changes_summary, '[]'::jsonb) || jsonb_build_array($2::jsonb)
              END,
              updated_at = NOW()
        `, [t.id, itemJson])
      }
    } else {
      await query(`
        INSERT INTO store_catalog_versions (tenant_id, version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary)
        VALUES ($1, 1, NOW(), TRUE, 1, jsonb_build_array($2::jsonb))
        ON CONFLICT (tenant_id) DO UPDATE
        SET has_pending_changes = TRUE,
            pending_changes_count = store_catalog_versions.pending_changes_count + 1,
            pending_changes_summary = CASE
              WHEN jsonb_array_length(COALESCE(store_catalog_versions.pending_changes_summary, '[]'::jsonb)) >= 30
              THEN (store_catalog_versions.pending_changes_summary - 0) || jsonb_build_array($2::jsonb)
              ELSE COALESCE(store_catalog_versions.pending_changes_summary, '[]'::jsonb) || jsonb_build_array($2::jsonb)
            END,
            updated_at = NOW()
      `, [tenantId, itemJson])
    }

    // Consulta estado atualizado da loja solicitante
    const checkRes = await query(
      `SELECT version, has_pending_changes, pending_changes_count, pending_changes_summary 
       FROM store_catalog_versions 
       WHERE tenant_id = $1`,
      [tenantId]
    )
    const row = checkRes.rows[0]

    return NextResponse.json({
      success: true,
      tenantId,
      changeId,
      applyToAll,
      hasPendingChanges: true,
      pendingCount: Number(row?.pending_changes_count) || 1,
      pendingSummary: row?.pending_changes_summary || [itemData],
    })
  } catch (err: any) {
    console.error('Erro ao marcar alterações pendentes:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao registrar pendência' },
      { status: 500 }
    )
  }
}
