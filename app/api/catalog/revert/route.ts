import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'
import { normalizeTenantId } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json().catch(() => ({}))
    const rawTenant = body.tenantId || ''
    const targetTenantId = normalizeTenantId(rawTenant)

    const authorName = user?.name || 'Operador da Loja'
    const authorRole = user?.role || 'TENANT_ADMIN'

    // 1. Busca status e data da última publicação desta loja
    const verRes = await query(
      `SELECT version, published_at, has_pending_changes, pending_changes_count 
       FROM store_catalog_versions 
       WHERE tenant_id = $1`,
      [targetTenantId]
    )

    const currentVersionRow = verRes.rows[0]
    const publishedAt = currentVersionRow?.published_at

    // 2. Se existirem overrides de disponibilidade criados/alterados APÓS a última publicação, reverte-os
    if (publishedAt) {
      await query(
        `DELETE FROM store_product_overrides
         WHERE tenant_id = $1 AND updated_at >= $2`,
        [targetTenantId, publishedAt]
      )
    }

    // 3. Reseta os flags de alterações pendentes em store_catalog_versions
    const res = await query(
      `UPDATE store_catalog_versions
       SET has_pending_changes = FALSE,
           pending_changes_count = 0,
           pending_changes_summary = '[]'::jsonb,
           updated_at = NOW()
       WHERE tenant_id = $1
       RETURNING version, published_at, has_pending_changes`,
      [targetTenantId]
    )

    await recordAuditLog({
      tenantId: targetTenantId,
      userId: user?.id || null,
      authorName,
      userRole: authorRole,
      action: 'CATALOG_CHANGES_REVERTED',
      entity: 'CATALOG',
      message: `Alterações pendentes do cardápio foram revertidas/descartadas para a loja (${targetTenantId}).`,
      metadata: {
        tenantId: targetTenantId,
        previousPendingCount: currentVersionRow?.pending_changes_count || 0,
      },
    })

    return NextResponse.json({
      success: true,
      tenantId: targetTenantId,
      message: 'Alterações pendentes revertidas com sucesso!',
      version: res.rows[0]?.version || currentVersionRow?.version || 1,
    })
  } catch (err: any) {
    console.error('Erro ao reverter alterações do catálogo:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao reverter alterações' },
      { status: 500 }
    )
  }
}
