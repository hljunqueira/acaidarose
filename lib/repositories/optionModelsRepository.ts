import { query } from '@/lib/db/postgres'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { v4 as uuidv4 } from 'uuid'

export interface OptionModelRecord {
  id: string
  tenantId?: string | null
  name: string
  priceType: 'Gratis' | 'Individual'
  additionalPrice: number
  minQty: number
  maxQty: number
  allowItemQuantity: boolean
  isRequired: boolean
  showDetailed: boolean
  options: any[]
  active: boolean
  displayOrder?: number
  subtitle?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function getOptionModelsByTenant(tenantId: string = AVEIRO_HQ_ID, activeOnly: boolean = false): Promise<OptionModelRecord[]> {
  try {
    const activeFilter = activeOnly ? 'AND active = true' : ''
    const res = await query(
      `SELECT id, tenant_id, name, price_type, additional_price, min_qty, max_qty, 
              allow_item_quantity, is_required, show_detailed, options, active, display_order, subtitle, created_at, updated_at
       FROM product_option_models
       WHERE (tenant_id = $1 OR tenant_id = $2 OR tenant_id IS NULL) ${activeFilter}
       ORDER BY display_order ASC, created_at ASC`,
      [tenantId, AVEIRO_HQ_ID]
    )

    return (res.rows || []).map((r: any) => ({
      id: r.id,
      tenantId: r.tenant_id,
      name: r.name,
      priceType: r.price_type === 'Individual' ? 'Individual' : 'Gratis',
      additionalPrice: Number(r.additional_price || 0),
      minQty: Number(r.min_qty || 0),
      maxQty: Number(r.max_qty || 1),
      allowItemQuantity: !!r.allow_item_quantity,
      isRequired: !!r.is_required,
      showDetailed: !!r.show_detailed,
      options: Array.isArray(r.options) ? r.options : [],
      active: r.active !== false,
      displayOrder: Number(r.display_order || 0),
      subtitle: r.subtitle || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  } catch (err: any) {
    console.error('Erro ao buscar modelos de opções:', err)
    return []
  }
}

export async function createOptionModel(tenantId: string = AVEIRO_HQ_ID, modelData: any, author?: { name?: string; role?: string; id?: string }): Promise<OptionModelRecord> {
  const id = modelData.id && modelData.id.length === 36 ? modelData.id : uuidv4()
  const priceType = modelData.priceType === 'Individual' ? 'Individual' : 'Gratis'
  const additionalPrice = Number(modelData.additionalPrice || 0)
  const minQty = Number(modelData.minQty || 0)
  const maxQty = Number(modelData.maxQty || 1)
  const allowItemQuantity = !!modelData.allowItemQuantity
  const isRequired = !!modelData.isRequired
  const showDetailed = !!modelData.showDetailed
  const options = Array.isArray(modelData.options) ? modelData.options : []
  const displayOrder = Number(modelData.displayOrder || 0)
  const subtitle = modelData.subtitle !== undefined ? (modelData.subtitle ? String(modelData.subtitle).trim() : null) : null

  const res = await query(
    `INSERT INTO product_option_models (
      id, tenant_id, name, price_type, additional_price, min_qty, max_qty, 
      allow_item_quantity, is_required, show_detailed, options, active, display_order, subtitle
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true, $12, $13)
    RETURNING *`,
    [
      id,
      tenantId,
      modelData.name,
      priceType,
      additionalPrice,
      minQty,
      maxQty,
      allowItemQuantity,
      isRequired,
      showDetailed,
      JSON.stringify(options),
      displayOrder,
      subtitle,
    ]
  )

  const created = res.rows[0]

  // Log para o TI
  await recordAuditLog({
    tenantId,
    userId: author?.id,
    authorName: author?.name,
    userRole: author?.role || 'FRANCHISOR_ADMIN',
    action: 'OPTION_MODEL_CREATED',
    entity: 'product_option_models',
    entityId: id,
    message: `Modelo de opções "${modelData.name}" criado com sucesso (${options.length} itens, adicional: ${additionalPrice}€, ${priceType})`,
    metadata: {
      modelId: id,
      name: modelData.name,
      priceType,
      additionalPrice,
      minQty,
      maxQty,
      allowItemQuantity,
      isRequired,
      optionsCount: options.length,
    },
  })

  return {
    id: created.id,
    tenantId: created.tenant_id,
    name: created.name,
    priceType: created.price_type,
    additionalPrice: Number(created.additional_price || 0),
    minQty: Number(created.min_qty || 0),
    maxQty: Number(created.max_qty || 1),
    allowItemQuantity: !!created.allow_item_quantity,
    isRequired: !!created.is_required,
    showDetailed: !!created.show_detailed,
    options: created.options || [],
    active: created.active,
    displayOrder: created.display_order,
    subtitle: created.subtitle || null,
  }
}

export async function updateOptionModel(id: string, tenantId: string = AVEIRO_HQ_ID, modelData: any, author?: { name?: string; role?: string; id?: string }): Promise<OptionModelRecord | null> {
  const priceType = modelData.priceType === 'Individual' ? 'Individual' : 'Gratis'
  const additionalPrice = Number(modelData.additionalPrice || 0)
  const minQty = Number(modelData.minQty || 0)
  const maxQty = Number(modelData.maxQty || 1)
  const allowItemQuantity = !!modelData.allowItemQuantity
  const isRequired = !!modelData.isRequired
  const showDetailed = !!modelData.showDetailed
  const options = Array.isArray(modelData.options) ? modelData.options : []
  const displayOrder = Number(modelData.displayOrder || 0)
  const activeParam = modelData.active !== undefined ? Boolean(modelData.active) : null
  const subtitle = modelData.subtitle !== undefined ? (modelData.subtitle ? String(modelData.subtitle).trim() : null) : null

  const res = await query(
    `UPDATE product_option_models
     SET name = COALESCE($2, name),
         price_type = $3,
         additional_price = $4,
         min_qty = $5,
         max_qty = $6,
         allow_item_quantity = $7,
         is_required = $8,
         show_detailed = $9,
         options = $10::jsonb,
         display_order = COALESCE($11, display_order),
         active = COALESCE($12, active),
         subtitle = CASE WHEN $13::boolean THEN $14 ELSE subtitle END,
         updated_at = timezone('utc'::text, now())
     WHERE id::text = $1
     RETURNING *`,
    [
      id,
      modelData.name || null,
      priceType,
      additionalPrice,
      minQty,
      maxQty,
      allowItemQuantity,
      isRequired,
      showDetailed,
      JSON.stringify(options),
      displayOrder,
      activeParam,
      modelData.subtitle !== undefined,
      subtitle,
    ]
  )

  if (!res.rows || res.rows.length === 0) return null
  const updated = res.rows[0]

  // Sincroniza em todos os recipientes/produtos vinculados
  try {
    const containersRes = await query(
      `SELECT id, option_groups FROM product_containers 
       WHERE option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0`
    )
    for (const row of containersRes.rows || []) {
      const groups = Array.isArray(row.option_groups) ? row.option_groups : []
      let modified = false
      const isBaseModel = id === 'ddcec6eb-6a9d-4266-93b2-954dfba2e75a' || 
        (updated.name && (updated.name.toLowerCase().includes('creme') || updated.name.toLowerCase().includes('base')))
      const isFrutaModel = id === 'b1111111-2222-3333-4444-555555555551' || 
        (updated.name && updated.name.toLowerCase().includes('fruta'))
      const isToppingModel = id === 'b2222222-3333-4444-5555-666666666662' || 
        (updated.name && (updated.name.toLowerCase().includes('acompanhamento') || updated.name.toLowerCase().includes('topping')))
      const isCaldaModel = id === 'b3333333-4444-5555-6666-777777777773' || 
        (updated.name && (updated.name.toLowerCase().includes('calda') || updated.name.toLowerCase().includes('especia')))

      const newGroups = groups.map((g: any) => {
        const isBaseGroup = g.id === 'model-bases' || (g.name && (g.name.toLowerCase().includes('creme') || g.name.toLowerCase().includes('base')))
        const isFrutaGroup = g.id === 'model-frutas' || (g.name && g.name.toLowerCase().includes('fruta'))
        const isToppingGroup = g.id === 'model-toppings' || (g.name && (g.name.toLowerCase().includes('acompanhamento') || g.name.toLowerCase().includes('topping')))
        const isCaldaGroup = g.id === 'model-caldas' || (g.name && (g.name.toLowerCase().includes('calda') || g.name.toLowerCase().includes('especia')))

        const matches = g.id === id || 
          (g.name && updated.name && g.name.toLowerCase().trim() === updated.name.toLowerCase().trim()) ||
          (isBaseModel && isBaseGroup) ||
          (isFrutaModel && isFrutaGroup) ||
          (isToppingModel && isToppingGroup) ||
          (isCaldaModel && isCaldaGroup)

        if (matches) {
          modified = true
          return {
            ...g,
            id: updated.id,
            name: updated.name,
            priceType: updated.price_type,
            additionalPrice: Number(updated.additional_price || 0),
            minQty: Number(updated.min_qty || 0),
            maxQty: Number(g.maxQty ?? updated.max_qty ?? 1),
            allowItemQuantity: !!updated.allow_item_quantity,
            isRequired: !!updated.is_required,
            showDetailed: !!updated.show_detailed,
            options: updated.options || [],
            active: updated.active !== false,
            subtitle: updated.subtitle || g.subtitle || undefined,
          }
        }
        return g
      })
      if (modified) {
        await query(
          `UPDATE product_containers 
           SET option_groups = $1::jsonb, updated_at = timezone('utc'::text, now()) 
           WHERE id = $2`,
          [JSON.stringify(newGroups), row.id]
        )
      }
    }
  } catch (syncErr) {
    console.error('Erro ao sincronizar modelo atualizado nos recipientes:', syncErr)
  }

  // Log para o TI
  await recordAuditLog({
    tenantId,
    userId: author?.id,
    authorName: author?.name,
    userRole: author?.role || 'FRANCHISOR_ADMIN',
    action: 'OPTION_MODEL_UPDATED',
    entity: 'product_option_models',
    entityId: id,
    message: `Modelo de opções "${updated.name}" atualizado pelo TI/Franqueador (${options.length} itens, adicional: ${additionalPrice}€)`,
    metadata: {
      modelId: id,
      name: updated.name,
      priceType,
      additionalPrice,
      minQty,
      maxQty,
      optionsCount: options.length,
      active: updated.active,
      subtitle: updated.subtitle || null,
    },
  })

  return {
    id: updated.id,
    tenantId: updated.tenant_id,
    name: updated.name,
    priceType: updated.price_type,
    additionalPrice: Number(updated.additional_price || 0),
    minQty: Number(updated.min_qty || 0),
    maxQty: Number(updated.max_qty || 1),
    allowItemQuantity: !!updated.allow_item_quantity,
    isRequired: !!updated.is_required,
    showDetailed: !!updated.show_detailed,
    options: updated.options || [],
    active: updated.active,
    displayOrder: updated.display_order,
    subtitle: updated.subtitle || null,
  }
}

export async function deleteOptionModel(id: string, tenantId: string = AVEIRO_HQ_ID, author?: { name?: string; role?: string; id?: string }): Promise<boolean> {
  const res = await query(
    `UPDATE product_option_models
     SET active = false, updated_at = timezone('utc'::text, now())
     WHERE id::text = $1
     RETURNING name`,
    [id]
  )

  const deletedName = res.rows?.[0]?.name || id

  // Sincroniza desativação em todos os recipientes vinculados
  try {
    const containersRes = await query(
      `SELECT id, option_groups FROM product_containers 
       WHERE option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0`
    )
    for (const row of containersRes.rows || []) {
      const groups = Array.isArray(row.option_groups) ? row.option_groups : []
      let modified = false
      const isBaseModel = id === 'ddcec6eb-6a9d-4266-93b2-954dfba2e75a' || 
        (deletedName && (deletedName.toLowerCase().includes('creme') || deletedName.toLowerCase().includes('base')))
      const isFrutaModel = id === 'b1111111-2222-3333-4444-555555555551' || 
        (deletedName && deletedName.toLowerCase().includes('fruta'))
      const isToppingModel = id === 'b2222222-3333-4444-5555-666666666662' || 
        (deletedName && (deletedName.toLowerCase().includes('acompanhamento') || deletedName.toLowerCase().includes('topping')))
      const isCaldaModel = id === 'b3333333-4444-5555-6666-777777777773' || 
        (deletedName && (deletedName.toLowerCase().includes('calda') || deletedName.toLowerCase().includes('especia')))

      const newGroups = groups.map((g: any) => {
        const isBaseGroup = g.id === 'model-bases' || (g.name && (g.name.toLowerCase().includes('creme') || g.name.toLowerCase().includes('base')))
        const isFrutaGroup = g.id === 'model-frutas' || (g.name && g.name.toLowerCase().includes('fruta'))
        const isToppingGroup = g.id === 'model-toppings' || (g.name && (g.name.toLowerCase().includes('acompanhamento') || g.name.toLowerCase().includes('topping')))
        const isCaldaGroup = g.id === 'model-caldas' || (g.name && (g.name.toLowerCase().includes('calda') || g.name.toLowerCase().includes('especia')))

        const matches = g.id === id || 
          (g.name && deletedName && g.name.toLowerCase().trim() === deletedName.toLowerCase().trim()) ||
          (isBaseModel && isBaseGroup) ||
          (isFrutaModel && isFrutaGroup) ||
          (isToppingModel && isToppingGroup) ||
          (isCaldaModel && isCaldaGroup)

        if (matches) {
          modified = true
          return {
            ...g,
            active: false,
          }
        }
        return g
      })
      if (modified) {
        await query(
          `UPDATE product_containers 
           SET option_groups = $1::jsonb, updated_at = timezone('utc'::text, now()) 
           WHERE id = $2`,
          [JSON.stringify(newGroups), row.id]
        )
      }
    }
  } catch (syncErr) {
    console.error('Erro ao sincronizar modelo desativado nos recipientes:', syncErr)
  }

  // Log para o TI
  await recordAuditLog({
    tenantId,
    userId: author?.id,
    authorName: author?.name,
    userRole: author?.role || 'FRANCHISOR_ADMIN',
    action: 'OPTION_MODEL_DELETED',
    entity: 'product_option_models',
    entityId: id,
    message: `Modelo de opções "${deletedName}" arquivado/excluído`,
    metadata: { modelId: id, name: deletedName },
  })

  return true
}
