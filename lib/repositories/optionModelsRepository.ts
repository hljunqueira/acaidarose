import { query } from '@/lib/db/postgres'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { v4 as uuidv4 } from 'uuid'

export interface OptionModelRecord {
  id: string
  tenantId?: string | null
  name: string
  nameEn?: string | null
  nameEs?: string | null
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
  subtitleEn?: string | null
  subtitleEs?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function getOptionModelsByTenant(tenantId: string = AVEIRO_HQ_ID, activeOnly: boolean = false): Promise<OptionModelRecord[]> {
  try {
    const activeFilter = activeOnly ? 'AND active = true' : ''
    const [res, overridesRes] = await Promise.all([
      query(
        `SELECT id, tenant_id, name, name_en, name_es, price_type, additional_price, min_qty, max_qty, 
              allow_item_quantity, is_required, show_detailed, options, active, display_order, subtitle, subtitle_en, subtitle_es, created_at, updated_at
       FROM product_option_models
       WHERE (tenant_id = $1 OR tenant_id = $2 OR tenant_id IS NULL) ${activeFilter}
       ORDER BY display_order ASC, created_at ASC`,
        [tenantId, AVEIRO_HQ_ID]
      ),
      query(
        `SELECT product_id, is_available, is_visible FROM store_product_overrides WHERE tenant_id = $1`,
        [tenantId]
      ),
    ])

    const availabilityMap = new Map<string, { isAvailable: boolean; isVisible: boolean }>()
    const pausedIds = new Set<string>()

    if (overridesRes && overridesRes.rows) {
      overridesRes.rows.forEach((r: any) => {
        const isAvail = r.is_available !== false
        const isVis = r.is_visible !== false
        availabilityMap.set(String(r.product_id), { isAvailable: isAvail, isVisible: isVis })
        if (!isAvail || !isVis) {
          pausedIds.add(String(r.product_id))
        }
      })
    }

    return (res.rows || []).map((r: any) => {
      const modelOverride = availabilityMap.get(r.id)
      const isModelActive = modelOverride !== undefined
        ? (modelOverride.isVisible && modelOverride.isAvailable)
        : (r.active !== false)

      const rawOptions = Array.isArray(r.options) ? r.options : []
      const mergedOptions = rawOptions.map((opt: any) => {
        const optId = opt.id ? String(opt.id) : ''
        const optCode = opt.code ? String(opt.code).trim().toUpperCase() : ''
        const optNameLower = (opt.name || '').toLowerCase().trim()

        const override = (optId && availabilityMap.get(optId)) ||
          (optCode && availabilityMap.get(optCode)) ||
          (optNameLower && availabilityMap.get(optNameLower))

        let isItemActive: boolean
        if (override !== undefined) {
          isItemActive = Boolean(override.isAvailable && override.isVisible)
        } else {
          isItemActive = opt.active !== false
        }

        return {
          ...opt,
          nameEn: opt.nameEn || opt.name_en || opt.name,
          nameEs: opt.nameEs || opt.name_es || opt.name,
          active: isItemActive,
        }
      })

      return {
        id: r.id,
        tenantId: r.tenant_id,
        name: r.name,
        nameEn: r.name_en || null,
        nameEs: r.name_es || null,
        priceType: r.price_type === 'Individual' ? 'Individual' : 'Gratis',
        additionalPrice: Number(r.additional_price || 0),
        minQty: Number(r.min_qty || 0),
        maxQty: Number(r.max_qty || 1),
        allowItemQuantity: !!r.allow_item_quantity,
        isRequired: !!r.is_required,
        showDetailed: !!r.show_detailed,
        options: mergedOptions,
        active: isModelActive,
        displayOrder: Number(r.display_order || 0),
        subtitle: r.subtitle || null,
        subtitleEn: r.subtitle_en || null,
        subtitleEs: r.subtitle_es || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    })
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
  const nameEn = modelData.nameEn !== undefined ? (modelData.nameEn ? String(modelData.nameEn).trim() : null) : null
  const nameEs = modelData.nameEs !== undefined ? (modelData.nameEs ? String(modelData.nameEs).trim() : null) : null
  const subtitleEn = modelData.subtitleEn !== undefined ? (modelData.subtitleEn ? String(modelData.subtitleEn).trim() : null) : null
  const subtitleEs = modelData.subtitleEs !== undefined ? (modelData.subtitleEs ? String(modelData.subtitleEs).trim() : null) : null

  const res = await query(
    `INSERT INTO product_option_models (
      id, tenant_id, name, name_en, name_es, price_type, additional_price, min_qty, max_qty, 
      allow_item_quantity, is_required, show_detailed, options, active, display_order, subtitle, subtitle_en, subtitle_es
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, true, $14, $15, $16, $17)
    RETURNING *`,
    [
      id,
      tenantId,
      modelData.name,
      nameEn,
      nameEs,
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
      subtitleEn,
      subtitleEs,
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
    nameEn: created.name_en || null,
    nameEs: created.name_es || null,
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
    subtitleEn: created.subtitle_en || null,
    subtitleEs: created.subtitle_es || null,
  }
}

export async function updateOptionModel(
  id: string,
  tenantId: string = AVEIRO_HQ_ID,
  modelData: any,
  author?: { name?: string; role?: string; id?: string },
  applyToAll: boolean = false,
  isMaster: boolean = true
): Promise<OptionModelRecord | null> {
  // Se for alteração por franquia ou sem replicação total da rede, grava EXCLUSIVAMENTE em store_product_overrides
  if (!isMaster || !applyToAll) {
    const existing = await query(`SELECT * FROM product_option_models WHERE id::text = $1`, [id])
    if (!existing.rows || existing.rows.length === 0) return null
    const currentModel = existing.rows[0]

    // 1. Override do modelo inteiro (se informado)
    if (modelData.active !== undefined) {
      const isModelActive = Boolean(modelData.active)
      await query(
        `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
         VALUES ($1, $2, true, $3, timezone('utc'::text, now()))
         ON CONFLICT (tenant_id, product_id)
         DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
        [tenantId, id, isModelActive]
      )
    }

    // 2. Overrides de cada opção do modelo na loja ativa
    const incomingOptions = Array.isArray(modelData.options) ? modelData.options : []
    for (const opt of incomingOptions) {
      if (opt.active !== undefined) {
        const isOptActive = Boolean(opt.active)
        const optId = opt.id ? String(opt.id) : ''
        const optCode = opt.code ? String(opt.code).trim().toUpperCase() : ''
        const optName = opt.name ? String(opt.name).trim() : ''

        if (optId) {
          await query(
            `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
             VALUES ($1, $2, true, $3, timezone('utc'::text, now()))
             ON CONFLICT (tenant_id, product_id)
             DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
            [tenantId, optId, isOptActive]
          )
        }

        if (optCode) {
          await query(
            `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
             VALUES ($1, $2, true, $3, timezone('utc'::text, now()))
             ON CONFLICT (tenant_id, product_id)
             DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
            [tenantId, optCode, isOptActive]
          )
        }

        if (optName) {
          await query(
            `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
             VALUES ($1, $2, true, $3, timezone('utc'::text, now()))
             ON CONFLICT (tenant_id, product_id)
             DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
            [tenantId, optName.toLowerCase().trim(), isOptActive]
          )
          try {
            const matchRes = await query(
              `SELECT id FROM product_toppings WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
               UNION ALL
               SELECT id FROM product_bases WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))`,
              [optName]
            )
            for (const m of matchRes.rows || []) {
              await query(
                `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
                 VALUES ($1, $2, true, $3, timezone('utc'::text, now()))
                 ON CONFLICT (tenant_id, product_id)
                 DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
                [tenantId, m.id, isOptActive]
              )
            }
          } catch (errMatch) {
            console.warn('Erro ao propagar override por nome na loja:', errMatch)
          }
        }
      }
    }

    try {
      const { bumpStoreCatalogVersion } = await import('@/lib/repositories/productsRepository')
      await bumpStoreCatalogVersion([tenantId])
    } catch {}

    await recordAuditLog({
      tenantId,
      userId: author?.id,
      authorName: author?.name,
      userRole: author?.role || 'STORE_OPERATOR',
      action: 'OPTION_MODEL_STORE_OVERRIDE_UPDATED',
      entity: 'store_product_overrides',
      entityId: id,
      message: `Visibilidade das opções do modelo "${currentModel.name}" atualizada exclusivamente na loja`,
      metadata: {
        modelId: id,
        tenantId,
        applyToAll: false,
        optionsCount: incomingOptions.length,
      },
    })

    const refreshed = await getOptionModelsByTenant(tenantId)
    return refreshed.find((m) => m.id === id) || null
  }

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
  const nameEn = modelData.nameEn !== undefined ? (modelData.nameEn ? String(modelData.nameEn).trim() : null) : null
  const nameEs = modelData.nameEs !== undefined ? (modelData.nameEs ? String(modelData.nameEs).trim() : null) : null
  const subtitleEn = modelData.subtitleEn !== undefined ? (modelData.subtitleEn ? String(modelData.subtitleEn).trim() : null) : null
  const subtitleEs = modelData.subtitleEs !== undefined ? (modelData.subtitleEs ? String(modelData.subtitleEs).trim() : null) : null

  const res = await query(
    `UPDATE product_option_models
     SET name = COALESCE($2, name),
         name_en = CASE WHEN $15::boolean THEN $16 ELSE name_en END,
         name_es = CASE WHEN $17::boolean THEN $18 ELSE name_es END,
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
         subtitle_en = CASE WHEN $19::boolean THEN $20 ELSE subtitle_en END,
         subtitle_es = CASE WHEN $21::boolean THEN $22 ELSE subtitle_es END,
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
      modelData.nameEn !== undefined,
      nameEn,
      modelData.nameEs !== undefined,
      nameEs,
      modelData.subtitleEn !== undefined,
      subtitleEn,
      modelData.subtitleEs !== undefined,
      subtitleEs,
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

          // Preserva preços específicos já configurados neste container (evita vazar preço de 1kg para copo 250g)
          const existingPriceMap = new Map<string, number>()
          if (Array.isArray(g.options)) {
            for (const o of g.options) {
              if (o.id && o.price !== undefined) existingPriceMap.set(String(o.id), Number(o.price))
              if (o.code && o.price !== undefined) existingPriceMap.set(String(o.code).trim().toUpperCase(), Number(o.price))
              if (o.name && o.price !== undefined) existingPriceMap.set(String(o.name).toLowerCase().trim(), Number(o.price))
            }
          }

          const mergedOpts = (updated.options || []).map((opt: any) => {
            const optId = opt.id ? String(opt.id) : ''
            const optCode = opt.code ? String(opt.code).trim().toUpperCase() : ''
            const optNameLower = (opt.name || '').toLowerCase().trim()
            const preservedPrice =
              (optCode && existingPriceMap.get(optCode)) ??
              (optId && existingPriceMap.get(optId)) ??
              (optNameLower && existingPriceMap.get(optNameLower))

            return {
              ...opt,
              price: preservedPrice !== undefined ? preservedPrice : Number(opt.price || 0),
            }
          })

          return {
            ...g,
            id: updated.id,
            name: updated.name,
            nameEn: updated.name_en || g.nameEn,
            nameEs: updated.name_es || g.nameEs,
            priceType: updated.price_type,
            additionalPrice: Number(updated.additional_price || 0),
            minQty: Number(updated.min_qty || 0),
            maxQty: Number(g.maxQty ?? updated.max_qty ?? 1),
            allowItemQuantity: !!updated.allow_item_quantity,
            isRequired: !!updated.is_required,
            showDetailed: !!updated.show_detailed,
            options: mergedOpts,
            active: updated.active !== false,
            subtitle: updated.subtitle !== undefined ? (updated.subtitle || undefined) : (g.subtitle || undefined),
            subtitleEn: updated.subtitle_en !== undefined ? (updated.subtitle_en || undefined) : (g.subtitleEn || undefined),
            subtitleEs: updated.subtitle_es !== undefined ? (updated.subtitle_es || undefined) : (g.subtitleEs || undefined),
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

  // Sincroniza a ordenação física e a visibilidade (active) dos itens em product_bases ou product_toppings
  if (Array.isArray(options) && options.length > 0) {
    try {
      const isBaseModel = id === 'ddcec6eb-6a9d-4266-93b2-954dfba2e75a' || 
        (updated.name && (updated.name.toLowerCase().includes('creme') || updated.name.toLowerCase().includes('base')))
      
      if (isBaseModel) {
        for (let i = 0; i < options.length; i++) {
          const opt = options[i]
          const optActive = opt.active !== false
          if (opt.id && opt.id.length === 36) {
            await query(`UPDATE product_bases SET display_order = $1, active = $2 WHERE id = $3`, [i, optActive, opt.id])
          } else if (opt.name) {
            await query(`UPDATE product_bases SET display_order = $1, active = $2 WHERE LOWER(TRIM(name)) = LOWER(TRIM($3))`, [i, optActive, opt.name])
          }
        }
      } else {
        for (let i = 0; i < options.length; i++) {
          const opt = options[i]
          const optActive = opt.active !== false
          if (opt.id && opt.id.length === 36) {
            await query(`UPDATE product_toppings SET display_order = $1, active = $2 WHERE id = $3`, [i, optActive, opt.id])
          } else if (opt.name) {
            await query(`UPDATE product_toppings SET display_order = $1, active = $2 WHERE LOWER(TRIM(name)) = LOWER(TRIM($3))`, [i, optActive, opt.name])
          }
        }
      }
    } catch (orderErr) {
      console.error('Erro ao sincronizar display_order e active dos itens do modelo:', orderErr)
    }
  }

  // Se foi aplicado a toda a rede pela Franqueadora Master, propaga em store_product_overrides para todos os tenants
  if (applyToAll && isMaster) {
    try {
      const tenantsRes = await query(`SELECT id FROM tenants WHERE deleted_at IS NULL`)
      for (const t of tenantsRes.rows || []) {
        for (const opt of options) {
          if (opt.active !== undefined) {
            const isOptActive = Boolean(opt.active)
            if (opt.id) {
              await query(
                `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
                 VALUES ($1, $2, true, $3, timezone('utc'::text, now()))
                 ON CONFLICT (tenant_id, product_id)
                 DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
                [t.id, opt.id, isOptActive]
              )
            }
          }
        }
      }
    } catch (errReplicate) {
      console.warn('Erro ao replicar overrides de opções para toda a rede:', errReplicate)
    }
  }

  // Notifica PDV e cardápio imediatamente via version bump
  try {
    const { bumpStoreCatalogVersion } = await import('@/lib/repositories/productsRepository')
    await bumpStoreCatalogVersion()
  } catch {}

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

export async function reorderOptionModels(
  items: Array<{ id: string; displayOrder: number }>,
  tenantId?: string,
  author?: { name?: string; role?: string; id?: string }
): Promise<boolean> {
  try {
    for (const item of items) {
      await query(
        `UPDATE product_option_models 
         SET display_order = $1, updated_at = timezone('utc'::text, now()) 
         WHERE id::text = $2`,
        [item.displayOrder, item.id]
      )
    }

    // Sincroniza a ordem dos option_groups em todos os recipientes vinculados
    const containersRes = await query(
      `SELECT id, option_groups FROM product_containers 
       WHERE option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0`
    )
    const modelOrderMap = new Map<string, number>()
    items.forEach((it) => modelOrderMap.set(it.id, it.displayOrder))

    for (const row of containersRes.rows || []) {
      const groups = Array.isArray(row.option_groups) ? row.option_groups : []
      if (groups.length > 1) {
        const sortedGroups = [...groups].sort((a: any, b: any) => {
          const ordA = modelOrderMap.has(a.id) ? modelOrderMap.get(a.id)! : (a.displayOrder ?? 999)
          const ordB = modelOrderMap.has(b.id) ? modelOrderMap.get(b.id)! : (b.displayOrder ?? 999)
          return ordA - ordB
        })
        await query(
          `UPDATE product_containers 
           SET option_groups = $1::jsonb, updated_at = timezone('utc'::text, now()) 
           WHERE id = $2`,
          [JSON.stringify(sortedGroups), row.id]
        )
      }
    }

    const { bumpStoreCatalogVersion } = await import('@/lib/repositories/productsRepository')
    await bumpStoreCatalogVersion()

    await recordAuditLog({
      tenantId: tenantId || null,
      userId: author?.id,
      authorName: author?.name,
      userRole: author?.role || 'FRANCHISOR_ADMIN',
      action: 'OPTION_MODELS_REORDERED',
      entity: 'product_option_models',
      message: `Ordem das etapas de montagem reorganizada nos modelos de opções (${items.length} modelos)`,
      metadata: { items },
    })

    return true
  } catch (err) {
    console.error('Erro ao reordenar modelos de opções:', err)
    return false
  }
}
