import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'
import { resolveTenantId } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json().catch(() => ({}))
    const rawTenant = body.tenantId || ''
    const targetTenantId = await resolveTenantId(rawTenant)

    const authorName = user?.name || 'Operador da Loja'
    const authorRole = user?.role || 'TENANT_ADMIN'

    const changeId = body.changeId || body.id || ''

    // 1. Busca status e data da última publicação desta loja
    const verRes = await query(
      `SELECT version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary 
       FROM store_catalog_versions 
       WHERE tenant_id = $1`,
      [targetTenantId]
    )

    const currentVersionRow = verRes.rows[0]
    const publishedAt = currentVersionRow?.published_at
    const summary: any[] = currentVersionRow?.pending_changes_summary || []

    // CASO A: Descarte de UMA alteração indevida específica (remover da lista e restaurar valor)
    if (changeId) {
      const targetChange = summary.find((item: any) => item.id === changeId)

      if (targetChange) {
        // Se a alteração envolver override de produto (disponibilidade ou visibilidade)
        if (targetChange.entity === 'product' && targetChange.entityId) {
          const prodId = targetChange.entityId
          const isNetwork = targetChange.scope === 'NETWORK'

          if (targetChange.previousValue !== undefined && targetChange.previousValue !== null) {
            const fieldCol = targetChange.field === 'visibility' ? 'is_visible' : 'is_available'
            const restoreVal = Boolean(targetChange.previousValue)

            if (isNetwork) {
              await query(
                `UPDATE store_product_overrides 
                 SET ${fieldCol} = $1, updated_at = timezone('utc'::text, now())
                 WHERE product_id = $2`,
                [restoreVal, prodId]
              )
            } else {
              await query(
                `UPDATE store_product_overrides 
                 SET ${fieldCol} = $1, updated_at = timezone('utc'::text, now())
                 WHERE tenant_id = $2 AND product_id = $3`,
                [restoreVal, targetTenantId, prodId]
              )
            }
          } else {
            if (isNetwork) {
              await query(`DELETE FROM store_product_overrides WHERE product_id = $1`, [prodId])
            } else {
              await query(`DELETE FROM store_product_overrides WHERE tenant_id = $1 AND product_id = $2`, [targetTenantId, prodId])
            }
          }
        }

        // Filtra a alteração removida
        const updatedSummary = summary.filter((item: any) => item.id !== changeId)
        const newCount = updatedSummary.length
        const hasPending = newCount > 0

        const res = await query(
          `UPDATE store_catalog_versions
           SET has_pending_changes = $1,
               pending_changes_count = $2,
               pending_changes_summary = $3::jsonb,
               updated_at = NOW()
           WHERE tenant_id = $4
           RETURNING version, published_at, has_pending_changes, pending_changes_count, pending_changes_summary`,
          [hasPending, newCount, JSON.stringify(updatedSummary), targetTenantId]
        )

        // Se foi em rede (NETWORK), remove também nas outras lojas
        if (targetChange.scope === 'NETWORK') {
          await query(
            `UPDATE store_catalog_versions
             SET pending_changes_summary = (
               SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
               FROM jsonb_array_elements(COALESCE(pending_changes_summary, '[]'::jsonb)) elem
               WHERE elem->>'id' != $1
             ),
             updated_at = NOW()
             WHERE tenant_id != $2`,
            [changeId, targetTenantId]
          )
          await query(
            `UPDATE store_catalog_versions
             SET pending_changes_count = jsonb_array_length(pending_changes_summary),
                 has_pending_changes = (jsonb_array_length(pending_changes_summary) > 0)
             WHERE tenant_id != $1`,
            [targetTenantId]
          )
        }

        await recordAuditLog({
          tenantId: targetTenantId,
          userId: user?.id || null,
          authorName,
          userRole: authorRole,
          action: 'CATALOG_CHANGE_DISCARDED',
          entity: 'CATALOG',
          message: `Alteração indevida "${targetChange.reason}" desfeita e removida das pendências.`,
          metadata: { changeId, targetChange },
        })

        return NextResponse.json({
          success: true,
          tenantId: targetTenantId,
          message: `Alteração "${targetChange.reason}" desfeita com sucesso!`,
          pendingCount: newCount,
          hasPendingChanges: hasPending,
          pendingSummary: updatedSummary,
          version: res.rows[0]?.version || currentVersionRow?.version || 1,
        })
      }
    }

    // CASO B: Reversão total de todas as alterações pendentes da loja
    if (publishedAt) {
      await query(
        `DELETE FROM store_product_overrides
         WHERE tenant_id = $1 AND updated_at >= $2`,
        [targetTenantId, publishedAt]
      )
    }

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
      message: `Todas as alterações pendentes do cardápio foram revertidas para a loja (${targetTenantId}).`,
      metadata: {
        tenantId: targetTenantId,
        previousPendingCount: currentVersionRow?.pending_changes_count || 0,
      },
    })

    return NextResponse.json({
      success: true,
      tenantId: targetTenantId,
      message: 'Todas as alterações pendentes foram revertidas com sucesso!',
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
