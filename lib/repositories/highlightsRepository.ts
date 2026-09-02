import { query } from '@/lib/db/postgres'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { v4 as uuidv4 } from 'uuid'

import { HighlightItem, CANONICAL_DEFAULT_STORIES } from '@/types/highlights'
export type { HighlightItem }
export { CANONICAL_DEFAULT_STORIES }

export async function getHighlightsByTenant(tenantId: string = AVEIRO_HQ_ID): Promise<HighlightItem[]> {
  try {
    const res = await query(
      `SELECT id, tenant_id, title, subtitle, video_url, thumbnail_url, badge_text, badge_color, price, display_order, active
       FROM store_stories
       WHERE tenant_id = $1 AND deleted_at IS NULL AND active = true
       ORDER BY display_order ASC, created_at ASC`,
      [tenantId]
    )

    if (!res.rows || res.rows.length === 0) {
      // Fallback seguro de resiliência caso a loja não possua destaques cadastrados ainda
      return CANONICAL_DEFAULT_STORIES
    }

    return res.rows.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      title: r.title,
      subtitle: r.subtitle || '',
      badgeLabel: r.badge_text || 'DESTAQUE',
      badgeColor: r.badge_color || 'bg-pink-600',
      price: Number(r.price) || 0,
      imageUrl: r.thumbnail_url || '/images/official/acai_copo_500g.jpg',
      videoUrl: r.video_url || undefined,
      mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
      active: r.active !== false,
      displayOrder: Number(r.display_order) || 0,
    }))
  } catch (err) {
    console.error('Erro ao consultar destaques da loja:', err)
    return CANONICAL_DEFAULT_STORIES
  }
}

export async function getAllHighlightsAdmin(tenantId: string = AVEIRO_HQ_ID): Promise<HighlightItem[]> {
  try {
    const res = await query(
      `SELECT id, tenant_id, title, subtitle, video_url, thumbnail_url, badge_text, badge_color, price, display_order, active
       FROM store_stories
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY display_order ASC, created_at ASC`,
      [tenantId]
    )

    if (!res.rows || res.rows.length === 0) {
      return []
    }

    return res.rows.map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      title: r.title,
      subtitle: r.subtitle || '',
      badgeLabel: r.badge_text || 'DESTAQUE',
      badgeColor: r.badge_color || 'bg-pink-600',
      price: Number(r.price) || 0,
      imageUrl: r.thumbnail_url || '/images/official/acai_copo_500g.jpg',
      videoUrl: r.video_url || undefined,
      mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
      active: r.active !== false,
      displayOrder: Number(r.display_order) || 0,
    }))
  } catch (err) {
    console.error('Erro ao consultar destaques admin:', err)
    return []
  }
}

export async function createHighlightItem(tenantId: string, item: Partial<HighlightItem>): Promise<HighlightItem> {
  const id = item.id && item.id.length === 36 ? item.id : uuidv4()
  const title = item.title || 'Novo Destaque'
  const subtitle = item.subtitle || ''
  const badgeLabel = item.badgeLabel || 'DESTAQUE'
  const badgeColor = item.badgeColor || 'bg-pink-600'
  const price = Number(item.price) || 0
  const imageUrl = item.imageUrl || '/images/official/acai_copo_500g.jpg'
  const videoUrl = item.videoUrl || null
  const displayOrder = Number(item.displayOrder) || 1
  const active = item.active !== false

  const res = await query(
    `INSERT INTO store_stories (id, tenant_id, title, subtitle, badge_text, badge_color, price, thumbnail_url, video_url, display_order, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [id, tenantId, title, subtitle, badgeLabel, badgeColor, price, imageUrl, videoUrl, displayOrder, active]
  )

  await recordAuditLog({
    tenantId,
    action: 'HIGHLIGHT_CREATED',
    entity: 'store_stories',
    entityId: id,
    message: `Novo destaque criado: "${title}"`,
    metadata: { title, price, badgeLabel, active },
  })

  const r = res.rows[0]
  return {
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    subtitle: r.subtitle,
    badgeLabel: r.badge_text,
    badgeColor: r.badge_color,
    price: Number(r.price) || 0,
    imageUrl: r.thumbnail_url,
    videoUrl: r.video_url || undefined,
    mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
    active: r.active,
    displayOrder: r.display_order,
  }
}

export async function updateHighlightItem(id: string, item: Partial<HighlightItem>): Promise<HighlightItem> {
  const res = await query(
    `UPDATE store_stories
     SET title = COALESCE($2, title),
         subtitle = COALESCE($3, subtitle),
         badge_text = COALESCE($4, badge_text),
         badge_color = COALESCE($5, badge_color),
         price = COALESCE($6, price),
         thumbnail_url = COALESCE($7, thumbnail_url),
         video_url = COALESCE($8, video_url),
         display_order = COALESCE($9, display_order),
         active = COALESCE($10, active),
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING *`,
    [
      id,
      item.title || null,
      item.subtitle !== undefined ? item.subtitle : null,
      item.badgeLabel || null,
      item.badgeColor || null,
      item.price !== undefined ? Number(item.price) : null,
      item.imageUrl || null,
      item.videoUrl !== undefined ? item.videoUrl : null,
      item.displayOrder !== undefined ? Number(item.displayOrder) : null,
      item.active !== undefined ? Boolean(item.active) : null,
    ]
  )

  const r = res.rows[0]
  if (!r) throw new Error('Destaque não encontrado')

  await recordAuditLog({
    tenantId: r.tenant_id,
    action: 'HIGHLIGHT_UPDATED',
    entity: 'store_stories',
    entityId: id,
    message: `Destaque atualizado: "${r.title}"`,
    metadata: { id, changes: item },
  })

  return {
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    subtitle: r.subtitle,
    badgeLabel: r.badge_text,
    badgeColor: r.badge_color,
    price: Number(r.price) || 0,
    imageUrl: r.thumbnail_url,
    videoUrl: r.video_url || undefined,
    mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
    active: r.active,
    displayOrder: r.display_order,
  }
}

export async function deleteHighlightItem(id: string): Promise<boolean> {
  const res = await query(
    `UPDATE store_stories 
     SET deleted_at = timezone('utc'::text, now()), active = false 
     WHERE id::text = $1`,
    [id]
  )

  await recordAuditLog({
    action: 'HIGHLIGHT_DELETED',
    entity: 'store_stories',
    entityId: id,
    message: `Destaque removido (ID: ${id})`,
    metadata: { id },
  })

  return (res.rowCount || 0) > 0
}

export async function syncAllStoresHighlights(payload?: {
  sourceTenantId?: string
  targetTenantIds?: string[]
  userEmail?: string
}): Promise<{ success: boolean; totalStores: number; replicatedHighlightsCount: number }> {
  const sourceTenantId = payload?.sourceTenantId || AVEIRO_HQ_ID

  let targetIds: string[] = []
  if (!payload?.targetTenantIds || payload.targetTenantIds.length === 0) {
    const tenantsRes = await query(`SELECT id FROM tenants WHERE deleted_at IS NULL AND id != $1`, [sourceTenantId])
    targetIds = (tenantsRes.rows || []).map((r: any) => r.id)
  } else {
    targetIds = payload.targetTenantIds.filter((id) => id !== sourceTenantId)
  }

  const sourceRes = await query(
    `SELECT title, subtitle, badge_text, badge_color, price, thumbnail_url, video_url, display_order, active
     FROM store_stories
     WHERE tenant_id = $1 AND deleted_at IS NULL AND active = true
     ORDER BY display_order ASC`,
    [sourceTenantId]
  )

  const highlights = sourceRes.rows || []

  for (const targetId of targetIds) {
    // Remove os antigos e insere os da matriz
    await query(`UPDATE store_stories SET deleted_at = timezone('utc'::text, now()), active = false WHERE tenant_id = $1`, [targetId])

    for (const h of highlights) {
      await query(
        `INSERT INTO store_stories (id, tenant_id, title, subtitle, badge_text, badge_color, price, thumbnail_url, video_url, display_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [uuidv4(), targetId, h.title, h.subtitle, h.badge_text, h.badge_color, h.price, h.thumbnail_url, h.video_url, h.display_order, h.active]
      )
    }
  }

  await recordAuditLog({
    tenantId: sourceTenantId,
    action: 'HIGHLIGHTS_REPLICATED',
    entity: 'store_stories',
    message: `Destaques e Stories replicados da Franqueadora para ${targetIds.length} filial(is)`,
    userRole: 'FRANCHISOR_ADMIN',
    metadata: {
      targetStoresCount: targetIds.length,
      replicatedHighlightsCount: highlights.length,
      userEmail: payload?.userEmail,
    },
  })

  return {
    success: true,
    totalStores: targetIds.length + 1,
    replicatedHighlightsCount: highlights.length,
  }
}
