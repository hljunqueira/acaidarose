import { query } from '@/lib/db/postgres'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { v4 as uuidv4 } from 'uuid'

import { HighlightItem } from '@/types/highlights'
export type { HighlightItem }

export async function getHighlightsByTenant(tenantId: string = AVEIRO_HQ_ID): Promise<HighlightItem[]> {
  try {
    const res = await query(
      `SELECT id, tenant_id, title, title_en, title_es, subtitle, subtitle_en, subtitle_es, video_url, thumbnail_url, badge_text, badge_text_en, badge_text_es, badge_color, price, display_order, active, available_hours
       FROM store_stories
       WHERE tenant_id = $1 AND deleted_at IS NULL AND active = true
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
      titleEn: r.title_en || null,
      titleEs: r.title_es || null,
      subtitle: r.subtitle || '',
      subtitleEn: r.subtitle_en || null,
      subtitleEs: r.subtitle_es || null,
      badgeLabel: r.badge_text || 'DESTAQUE',
      badgeLabelEn: r.badge_text_en || null,
      badgeLabelEs: r.badge_text_es || null,
      badgeColor: r.badge_color || 'bg-pink-600',
      price: Number(r.price) || 0,
      imageUrl: r.thumbnail_url || '/images/official/acai_copo_500g.jpg',
      videoUrl: r.video_url || undefined,
      mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
      active: r.active !== false,
      displayOrder: Number(r.display_order) || 0,
      availableHours: r.available_hours || null,
    }))
  } catch (err) {
    console.error('Erro ao consultar destaques da loja:', err)
    return []
  }
}

export async function getAllHighlightsAdmin(tenantId: string = AVEIRO_HQ_ID): Promise<HighlightItem[]> {
  try {
    const res = await query(
      `SELECT id, tenant_id, title, title_en, title_es, subtitle, subtitle_en, subtitle_es, video_url, thumbnail_url, badge_text, badge_text_en, badge_text_es, badge_color, price, display_order, active, available_hours
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
      titleEn: r.title_en || null,
      titleEs: r.title_es || null,
      subtitle: r.subtitle || '',
      subtitleEn: r.subtitle_en || null,
      subtitleEs: r.subtitle_es || null,
      badgeLabel: r.badge_text || 'DESTAQUE',
      badgeLabelEn: r.badge_text_en || null,
      badgeLabelEs: r.badge_text_es || null,
      badgeColor: r.badge_color || 'bg-pink-600',
      price: Number(r.price) || 0,
      imageUrl: r.thumbnail_url || '/images/official/acai_copo_500g.jpg',
      videoUrl: r.video_url || undefined,
      mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
      active: r.active !== false,
      displayOrder: Number(r.display_order) || 0,
      availableHours: r.available_hours || null,
    }))
  } catch (err) {
    console.error('Erro ao consultar destaques admin:', err)
    return []
  }
}

export async function createHighlightItem(tenantId: string, item: Partial<HighlightItem>): Promise<HighlightItem> {
  const id = item.id && item.id.length === 36 ? item.id : uuidv4()
  const title = item.title || 'Novo Destaque'
  const titleEn = item.titleEn || null
  const titleEs = item.titleEs || null
  const subtitle = item.subtitle || ''
  const subtitleEn = item.subtitleEn || null
  const subtitleEs = item.subtitleEs || null
  const badgeLabel = item.badgeLabel || 'DESTAQUE'
  const badgeLabelEn = item.badgeLabelEn || null
  const badgeLabelEs = item.badgeLabelEs || null
  const badgeColor = item.badgeColor || 'bg-pink-600'
  const price = Number(item.price) || 0
  const imageUrl = item.imageUrl || '/images/official/acai_copo_500g.jpg'
  const videoUrl = item.videoUrl || null
  const displayOrder = Number(item.displayOrder) || 1
  const active = item.active !== false
  const availableHours = item.availableHours ? (typeof item.availableHours === 'string' ? item.availableHours : JSON.stringify(item.availableHours)) : null

  const res = await query(
    `INSERT INTO store_stories (id, tenant_id, title, title_en, title_es, subtitle, subtitle_en, subtitle_es, badge_text, badge_text_en, badge_text_es, badge_color, price, thumbnail_url, video_url, display_order, active, available_hours)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [id, tenantId, title, titleEn, titleEs, subtitle, subtitleEn, subtitleEs, badgeLabel, badgeLabelEn, badgeLabelEs, badgeColor, price, imageUrl, videoUrl, displayOrder, active, availableHours]
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
    titleEn: r.title_en || null,
    titleEs: r.title_es || null,
    subtitle: r.subtitle,
    subtitleEn: r.subtitle_en || null,
    subtitleEs: r.subtitle_es || null,
    badgeLabel: r.badge_text,
    badgeLabelEn: r.badge_text_en || null,
    badgeLabelEs: r.badge_text_es || null,
    badgeColor: r.badge_color,
    price: Number(r.price) || 0,
    imageUrl: r.thumbnail_url,
    videoUrl: r.video_url || undefined,
    mediaType: r.video_url ? 'VIDEO' : 'IMAGE',
    active: r.active,
    displayOrder: r.display_order,
    availableHours: r.available_hours || null,
  }
}

export async function updateHighlightItem(id: string, item: Partial<HighlightItem>): Promise<HighlightItem> {
  const availableHoursParam = item.availableHours !== undefined
    ? (item.availableHours === null ? '__NULL__' : (typeof item.availableHours === 'string' ? item.availableHours : JSON.stringify(item.availableHours)))
    : null

  const res = await query(
    `UPDATE store_stories
     SET title = COALESCE($2, title),
         title_en = COALESCE($3, title_en),
         title_es = COALESCE($4, title_es),
         subtitle = COALESCE($5, subtitle),
         subtitle_en = COALESCE($6, subtitle_en),
         subtitle_es = COALESCE($7, subtitle_es),
         badge_text = COALESCE($8, badge_text),
         badge_text_en = COALESCE($9, badge_text_en),
         badge_text_es = COALESCE($10, badge_text_es),
         badge_color = COALESCE($11, badge_color),
         price = COALESCE($12, price),
         thumbnail_url = COALESCE($13, thumbnail_url),
         video_url = COALESCE($14, video_url),
         display_order = COALESCE($15, display_order),
         active = COALESCE($16, active),
         available_hours = CASE WHEN $17::text = '__NULL__' THEN NULL WHEN $17 IS NOT NULL THEN $17::jsonb ELSE available_hours END,
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1 AND deleted_at IS NULL
     RETURNING *`,
    [
      id,
      item.title || null,
      item.titleEn !== undefined ? item.titleEn : null,
      item.titleEs !== undefined ? item.titleEs : null,
      item.subtitle !== undefined ? item.subtitle : null,
      item.subtitleEn !== undefined ? item.subtitleEn : null,
      item.subtitleEs !== undefined ? item.subtitleEs : null,
      item.badgeLabel || null,
      item.badgeLabelEn !== undefined ? item.badgeLabelEn : null,
      item.badgeLabelEs !== undefined ? item.badgeLabelEs : null,
      item.badgeColor || null,
      item.price !== undefined ? Number(item.price) : null,
      item.imageUrl || null,
      item.videoUrl !== undefined ? item.videoUrl : null,
      item.displayOrder !== undefined ? Number(item.displayOrder) : null,
      item.active !== undefined ? Boolean(item.active) : null,
      availableHoursParam,
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
    availableHours: r.available_hours || null,
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
    `SELECT title, subtitle, badge_text, badge_color, price, thumbnail_url, video_url, display_order, active, available_hours
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
        `INSERT INTO store_stories (id, tenant_id, title, subtitle, badge_text, badge_color, price, thumbnail_url, video_url, display_order, active, available_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [uuidv4(), targetId, h.title, h.subtitle, h.badge_text, h.badge_color, h.price, h.thumbnail_url, h.video_url, h.display_order, h.active, h.available_hours]
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
