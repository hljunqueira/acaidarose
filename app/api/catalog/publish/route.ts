import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser, hasRole } from '@/lib/api/authGuard'
import { normalizeTenantId } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json().catch(() => ({}))
    const rawTenant = body.tenantId || ''
    const targetTenantId = normalizeTenantId(rawTenant)
    const replicateAll = Boolean(body.replicateAll)
    const note = body.note || ''

    const isSuperOrFranchisor = user ? hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN']) : true
    const authorName = user?.name || 'Operador da Loja'
    const authorRole = user?.role || 'TENANT_ADMIN'

    // Se for publicação para toda a rede
    if (replicateAll && isSuperOrFranchisor) {
      const updateRes = await query(`
        UPDATE store_catalog_versions
        SET version = version + 1,
            published_at = NOW(),
            has_pending_changes = FALSE,
            pending_changes_count = 0,
            pending_changes_summary = '[]'::jsonb,
            last_published_by = $1,
            updated_at = NOW()
        RETURNING tenant_id, version, published_at
      `, [user?.id || null])

      await recordAuditLog({
        tenantId: targetTenantId,
        userId: user?.id || null,
        authorName,
        userRole: authorRole,
        action: 'CATALOG_PUBLISHED_GLOBAL',
        entity: 'CATALOG',
        message: `Publicação global de cardápio e configurações aplicada para todas as ${updateRes.rowCount} lojas da rede. ${note}`.trim(),
        metadata: {
          replicateAll: true,
          storesCount: updateRes.rowCount,
          note,
        },
      })

      return NextResponse.json({
        success: true,
        replicateAll: true,
        storesUpdated: updateRes.rowCount,
        publishedAt: new Date().toISOString(),
        message: 'Cardápio e configurações publicados com sucesso em toda a rede!',
      })
    }

    // Publicação individual para a loja ativa
    const res = await query(`
      INSERT INTO store_catalog_versions (tenant_id, version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary, last_published_by)
      VALUES ($1, 2, NOW(), FALSE, 0, '[]'::jsonb, $2)
      ON CONFLICT (tenant_id) DO UPDATE
      SET version = store_catalog_versions.version + 1,
          published_at = NOW(),
          has_pending_changes = FALSE,
          pending_changes_count = 0,
          pending_changes_summary = '[]'::jsonb,
          last_published_by = $2,
          updated_at = NOW()
      RETURNING version, published_at
    `, [targetTenantId, user?.id || null])

    const publishedRow = res.rows[0]
    const newVersion = Number(publishedRow?.version) || 1

    await recordAuditLog({
      tenantId: targetTenantId,
      userId: user?.id || null,
      authorName,
      userRole: authorRole,
      action: 'CATALOG_PUBLISHED',
      entity: 'CATALOG',
      message: `Cardápio e configurações publicados para a loja (${targetTenantId}). Nova versão: v${newVersion}. ${note}`.trim(),
      metadata: {
        tenantId: targetTenantId,
        version: newVersion,
        note,
      },
    })

    return NextResponse.json({
      success: true,
      tenantId: targetTenantId,
      version: newVersion,
      publishedAt: publishedRow?.published_at || new Date().toISOString(),
      message: `Cardápio e configurações publicados com sucesso (v${newVersion})!`,
    })
  } catch (err: any) {
    console.error('Erro ao publicar cardápio:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao publicar alterações' },
      { status: 500 }
    )
  }
}
