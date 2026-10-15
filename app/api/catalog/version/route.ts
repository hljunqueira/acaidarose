import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { resolveTenantId } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawTenant = searchParams.get('tenantId') || searchParams.get('loja') || ''
    const tenantId = await resolveTenantId(rawTenant)

    const res = await query(
      `SELECT version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary, updated_at
       FROM store_catalog_versions
       WHERE tenant_id = $1`,
      [tenantId]
    )

    let pendingStores: any[] = []
    try {
      const pendingRes = await query(`
        SELECT v.tenant_id, v.pending_changes_count,
               t.name as store_name, t.slug as store_slug
        FROM store_catalog_versions v
        LEFT JOIN tenants t ON t.id::text = v.tenant_id::text
        WHERE v.has_pending_changes = TRUE
      `)
      if (pendingRes?.rows) {
        pendingStores = pendingRes.rows.map((r: any) => ({
          tenantId: r.tenant_id,
          storeName: r.store_name || 'Loja',
          storeSlug: r.store_slug || 'loja',
          pendingCount: Number(r.pending_changes_count) || 0,
        }))
      }
    } catch {}

    if (res.rows.length === 0) {
      // Auto-inicializa se não existir registro
      await query(
        `INSERT INTO store_catalog_versions (tenant_id, version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary)
         VALUES ($1, 1, NOW(), FALSE, 0, '[]'::jsonb)
         ON CONFLICT (tenant_id) DO NOTHING`,
        [tenantId]
      )

      return NextResponse.json(
        {
          success: true,
          tenantId,
          version: 1,
          publishedAt: new Date().toISOString(),
          hasPendingChanges: false,
          pendingCount: 0,
          pendingSummary: [],
          pendingStores,
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=5, stale-while-revalidate=10',
          },
        }
      )
    }

    const row = res.rows[0]
    return NextResponse.json(
      {
        success: true,
        tenantId,
        version: Number(row.version) || 1,
        publishedAt: row.published_at,
        hasPendingChanges: Boolean(row.has_pending_changes),
        pendingCount: Number(row.pending_changes_count) || 0,
        pendingSummary: Array.isArray(row.pending_changes_summary) ? row.pending_changes_summary : [],
        pendingStores,
        updatedAt: row.updated_at,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=10',
        },
      }
    )
  } catch (err: any) {
    console.error('Erro ao consultar versão do catálogo:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao consultar versão' },
      { status: 500 }
    )
  }
}
