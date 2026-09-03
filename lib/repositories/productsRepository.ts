import { CatalogData, ProductContainer, ProductBase, ProductTopping } from '@/types'
import { query } from '@/lib/db/postgres'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { v4 as uuidv4 } from 'uuid'

export function buildDefaultOptionGroupsForContainer(
  weight: number,
  basesList: ProductBase[],
  toppingsList: ProductTopping[]
) {
  const defaultBasesMax = weight === 250 ? 1 : weight === 350 ? 2 : weight === 1000 ? 4 : 3
  const defaultFrutasMax = weight === 250 ? 2 : weight === 350 ? 3 : 999
  const defaultToppingsMax = weight === 250 ? 3 : weight === 350 ? 4 : 999

  return [
    {
      id: 'model-bases',
      name: 'Escolha seu creme ou base gelada',
      priceType: 'Gratis' as const,
      additionalPrice: 2.00,
      minQty: 1,
      maxQty: defaultBasesMax,
      isRequired: true,
      active: true,
      options: basesList.map((b) => ({
        id: b.id,
        name: b.name,
        code: (b as any).code || '',
        price: 0,
        description: b.description || '',
        active: b.active !== false && b.isAvailableInStore !== false,
      })),
    },
    {
      id: 'model-frutas',
      name: 'Frutas Frescas Selecionadas',
      priceType: 'Gratis' as const,
      additionalPrice: 0.50,
      minQty: 0,
      maxQty: defaultFrutasMax,
      isRequired: false,
      active: true,
      options: toppingsList
        .filter((t) => t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f)))
        .map((f) => ({
          id: f.id,
          name: f.name,
          code: (f as any).code || '',
          price: f.precoExtra || 0,
          description: f.description || '',
          active: f.active !== false && f.isAvailableInStore !== false,
        })),
    },
    {
      id: 'model-toppings',
      name: 'Acompanhamentos Tradicionais',
      priceType: 'Gratis' as const,
      additionalPrice: 0.50,
      minQty: 0,
      maxQty: defaultToppingsMax,
      isRequired: false,
      active: true,
      options: toppingsList
        .filter((t) => !t.isPremium && t.category !== 'Frutas' && t.category !== 'Adicionais' && !['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f)))
        .map((t) => ({
          id: t.id,
          name: t.name,
          code: (t as any).code || '',
          price: t.precoExtra || 0,
          description: t.description || '',
          active: t.active !== false && t.isAvailableInStore !== false,
        })),
    },
    {
      id: 'model-caldas',
      name: 'Caldas Nobres & Especiais',
      priceType: 'Individual' as const,
      additionalPrice: 1.50,
      minQty: 0,
      maxQty: 10,
      isRequired: false,
      active: true,
      options: toppingsList
        .filter((t) => t.isPremium || t.category === 'Adicionais' || (t.precoExtra && t.precoExtra > 0))
        .map((c) => ({
          id: c.id,
          name: c.name,
          code: (c as any).code || '',
          price: c.precoExtra || c.price || 1.5,
          description: c.description || '',
          active: c.active !== false && c.isAvailableInStore !== false,
        })),
    },
  ]
}

export async function getCatalogByTenant(tenantId: string = AVEIRO_HQ_ID): Promise<CatalogData> {
  const containers: ProductContainer[] = []
  const bases: ProductBase[] = []
  const toppings: ProductTopping[] = []

  try {
    const [containersRes, basesRes, toppingsRes, priceOverridesRes, availabilityOverridesRes, categoriesRes] = await Promise.all([
      query(`SELECT id, name, description, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active, option_groups FROM product_containers WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY display_order ASC`, [tenantId]),
      query(`SELECT id, name, description, image_url, video_url, video_poster, available_hours, display_order, active FROM product_bases WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY display_order ASC`, [tenantId]),
      query(`SELECT id, name, description, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active FROM product_toppings WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY display_order ASC`, [tenantId]),
      query(`SELECT product_id, custom_price FROM store_price_overrides WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT product_id, is_available, is_visible FROM store_product_overrides WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT id, name, slug, active FROM categories ORDER BY display_order ASC`),
    ])

    const priceMap = new Map<string, number>()
    if (priceOverridesRes && priceOverridesRes.rows) {
      priceOverridesRes.rows.forEach((r: any) => {
        priceMap.set(r.product_id, Number(r.custom_price))
      })
    }

    const availabilityMap = new Map<string, { isAvailable: boolean; isVisible: boolean }>()
    if (availabilityOverridesRes && availabilityOverridesRes.rows) {
      availabilityOverridesRes.rows.forEach((r: any) => {
        availabilityMap.set(r.product_id, {
          isAvailable: r.is_available !== false,
          isVisible: r.is_visible !== false,
        })
      })
    }

    const categoryMap = new Map<string, { id: string; name: string; active: boolean }>()
    if (categoriesRes && categoriesRes.rows) {
      categoriesRes.rows.forEach((cat: any) => {
        const clean = (cat.name || '').toLowerCase().replace(/[\s\-_]/g, '')
        categoryMap.set(clean, { id: cat.id, name: cat.name, active: cat.active !== false })
      })
    }

    // Carrega bases e toppings primeiro para permitir pré-vincular aos recipientes caso não tenham
    if (basesRes && basesRes.rows) {
      basesRes.rows.forEach((row: any) => {
        const override = availabilityMap.get(row.id)
        const isVisible = override ? override.isVisible : !!row.active
        const isAvailable = override ? override.isAvailable : !!row.active
        bases.push({
          id: row.id,
          name: row.name,
          description: row.description || '',
          displayOrder: row.display_order,
          active: isVisible,
          videoUrl: row.video_url,
          videoPoster: row.video_poster,
          availableHours: row.available_hours,
          isAvailableInStore: isAvailable
        })
      })
    }

    if (toppingsRes && toppingsRes.rows) {
      toppingsRes.rows.forEach((row: any) => {
        const customPrice = priceMap.get(row.id)
        const override = availabilityMap.get(row.id)
        const isVisible = override ? override.isVisible : !!row.active
        const isAvailable = override ? override.isAvailable : !!row.active
        toppings.push({
          id: row.id,
          name: row.name,
          description: row.description || '',
          category: row.category || 'Toppings',
          isPremium: !!row.is_premium,
          precoExtra: customPrice !== undefined ? customPrice : Number(row.preco_extra || 0),
          price: customPrice !== undefined ? customPrice : Number(row.preco_extra || 0),
          image: row.image_url || row.video_poster,
          videoUrl: row.video_url,
          videoPoster: row.video_poster,
          availableHours: row.available_hours,
          displayOrder: row.display_order,
          active: isVisible,
          isAvailableInStore: isAvailable
        })
      })
    }

    if (containersRes && containersRes.rows) {
      containersRes.rows.forEach((row: any) => {
        const customPrice = priceMap.get(row.id)
        const override = availabilityMap.get(row.id)
        const isVisible = override ? override.isVisible : !!row.active
        const isAvailable = override ? override.isAvailable : !!row.active
        const weight = Number(row.weight_grams) || 500
        const limiteFrutas = weight === 250 ? 2 : weight === 350 ? 3 : 999

        let isCategoryPaused = false
        let categoryName = ''
        const weightStr = `${weight}g`
        for (const [cleanKey, cData] of categoryMap.entries()) {
          if (cleanKey.includes(weightStr) || cleanKey.includes((row.name || '').toLowerCase().replace(/[\s\-_]/g, ''))) {
            categoryName = cData.name
            if (!cData.active) {
              isCategoryPaused = true
            }
            break
          }
        }

        // Se o produto já possui modelos configurados no banco, usa-os; caso contrário, monta os 4 canônicos
        const rawGroups = row.option_groups
        const hasCustomGroups = rawGroups && Array.isArray(rawGroups) && rawGroups.length > 0
        const optionGroups = hasCustomGroups
          ? rawGroups
          : buildDefaultOptionGroupsForContainer(weight, bases, toppings)

        containers.push({
          id: row.id,
          name: row.name,
          description: row.description || '',
          weightGrams: weight,
          precoBase: customPrice !== undefined ? customPrice : Number(row.preco_base),
          price: customPrice !== undefined ? customPrice : Number(row.preco_base),
          limiteBases: row.limite_bases,
          limiteToppings: row.limite_complementos_gratis,
          limiteCremes: row.limite_bases,
          limiteFrutas: limiteFrutas,
          emoji: '',
          image: row.image_url || row.video_poster,
          videoUrl: row.video_url,
          videoPoster: row.video_poster,
          availableHours: row.available_hours,
          displayOrder: row.display_order,
          active: isVisible,
          isAvailableInStore: isAvailable,
          isCategoryPaused,
          categoryName,
          optionGroups,
        })
      })
    }
  } catch (err: any) {
    console.error('Erro em getCatalogByTenant:', err)
    return {
      containers: [],
      bases: [],
      toppings: [],
    }
  }

  return {
    containers,
    bases,
    toppings,
  }
}

export async function setStorePriceOverride(
  tenantId: string,
  productId: string,
  customPrice: number
): Promise<{ success: boolean; tenantId: string; productId: string; newPrice: number }> {
  const val = Number(customPrice) || 0
  try {
    await query(
      `INSERT INTO store_price_overrides (tenant_id, product_id, custom_price, updated_at)
       VALUES ($1, $2, $3, timezone('utc'::text, now()))
       ON CONFLICT (tenant_id, product_id) 
       DO UPDATE SET custom_price = EXCLUDED.custom_price, updated_at = timezone('utc'::text, now())`,
      [tenantId, productId, val]
    )

    await recordAuditLog({
      tenantId,
      action: 'STORE_PRICE_OVERRIDE_SET',
      entity: 'store_price_overrides',
      entityId: productId,
      message: `Preço customizado da loja (${productId}): € ${val.toFixed(2)}`,
      metadata: { productId, customPrice: val },
    })
  } catch (err) {
    console.error('Erro ao atualizar override de preço:', err)
  }

  return { success: true, tenantId, productId, newPrice: val }
}

export const setStoreProductPrice = setStorePriceOverride

export async function toggleStoreItemStatus(
  tenantId: string,
  productId: string,
  updates: { isAvailable?: boolean; isVisible?: boolean }
): Promise<{ success: boolean; tenantId: string; productId: string; isAvailable?: boolean; isVisible?: boolean }> {
  try {
    const existingRes = await query(
      `SELECT is_available, is_visible FROM store_product_overrides WHERE tenant_id = $1 AND product_id = $2`,
      [tenantId, productId]
    )
    const currentAvailable = existingRes.rows?.[0]?.is_available !== undefined ? existingRes.rows[0].is_available : true
    const currentVisible = existingRes.rows?.[0]?.is_visible !== undefined ? existingRes.rows[0].is_visible : true

    const newAvailable = updates.isAvailable !== undefined ? updates.isAvailable : currentAvailable
    const newVisible = updates.isVisible !== undefined ? updates.isVisible : currentVisible

    await query(
      `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, is_visible, updated_at)
       VALUES ($1, $2, $3, $4, timezone('utc'::text, now()))
       ON CONFLICT (tenant_id, product_id) 
       DO UPDATE SET is_available = EXCLUDED.is_available, is_visible = EXCLUDED.is_visible, updated_at = timezone('utc'::text, now())`,
      [tenantId, productId, newAvailable, newVisible]
    )

    await recordAuditLog({
      tenantId,
      action: 'PRODUCT_STATUS_OVERRIDE_UPDATED',
      entity: 'store_product_overrides',
      entityId: productId,
      message: `Status atualizado na loja (${productId}): visível=${newVisible}, disponível=${newAvailable}`,
      metadata: { productId, isAvailable: newAvailable, isVisible: newVisible },
    })

    return { success: true, tenantId, productId, isAvailable: newAvailable, isVisible: newVisible }
  } catch (err) {
    console.error('Erro ao atualizar status override do produto:', err)
    return { success: false, tenantId, productId, ...updates }
  }
}

export async function toggleStoreItemAvailability(
  tenantId: string,
  productId: string,
  available: boolean
): Promise<{ success: boolean; tenantId: string; productId: string; available: boolean }> {
  const res = await toggleStoreItemStatus(tenantId, productId, { isAvailable: available })
  return { success: res.success, tenantId, productId, available: !!res.isAvailable }
}

export async function syncAllStoresCatalog(payload?: {
  applyToAll?: boolean
  targetTenantIds?: string[]
  prices?: Record<string, number>
  userEmail?: string
  tenantId?: string
}): Promise<{
  success: boolean
  totalStores: number
  syncedAt: string
  scope: 'ALL_NETWORK' | 'SELECTED_STORES'
  targetStoresCount: number
}> {
  const sourceTenantId = payload?.tenantId || AVEIRO_HQ_ID
  const syncedAt = new Date().toISOString()

  try {
    // 1. Obter todas as lojas de destino
    let targetIds: string[] = []
    if (payload?.applyToAll || !payload?.targetTenantIds || payload.targetTenantIds.length === 0) {
      const tenantsRes = await query(`SELECT id FROM tenants WHERE deleted_at IS NULL AND id != $1`, [sourceTenantId])
      targetIds = (tenantsRes.rows || []).map((r: any) => r.id)
    } else {
      targetIds = payload.targetTenantIds.filter((id) => id !== sourceTenantId)
    }

    if (targetIds.length === 0) {
      return {
        success: true,
        totalStores: 1,
        syncedAt,
        scope: 'SELECTED_STORES',
        targetStoresCount: 1,
      }
    }

    // 2. Carregar catálogo canônico da Matriz (Loja 1)
    const [sourceContainersRes, sourceBasesRes, sourceToppingsRes] = await Promise.all([
      query(`SELECT name, description, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active FROM product_containers WHERE tenant_id = $1 AND deleted_at IS NULL`, [sourceTenantId]),
      query(`SELECT name, description, image_url, video_url, video_poster, available_hours, display_order, active FROM product_bases WHERE tenant_id = $1 AND deleted_at IS NULL`, [sourceTenantId]),
      query(`SELECT name, description, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active FROM product_toppings WHERE tenant_id = $1 AND deleted_at IS NULL`, [sourceTenantId]),
    ])

    const containers = sourceContainersRes.rows || []
    const bases = sourceBasesRes.rows || []
    const toppings = sourceToppingsRes.rows || []

    // 3. Replicar para cada loja de destino
    for (const targetId of targetIds) {
      // Containers (Taças)
      for (const c of containers) {
        const customPrice = payload?.prices?.[c.weight_grams] ?? payload?.prices?.[`weight-${c.weight_grams}`] ?? c.preco_base
        const check = await query(`SELECT id FROM product_containers WHERE tenant_id = $1 AND weight_grams = $2 AND deleted_at IS NULL`, [targetId, c.weight_grams])
        if (check.rows && check.rows.length > 0) {
          await query(
            `UPDATE product_containers
             SET name = $1, description = $2, preco_base = $3, limite_bases = $4, limite_complementos_gratis = $5,
                 image_url = $6, video_url = $7, video_poster = $8, available_hours = $9,
                 display_order = $10, active = $11, updated_at = timezone('utc'::text, now())
             WHERE tenant_id = $12 AND weight_grams = $13 AND deleted_at IS NULL`,
            [c.name, c.description || null, customPrice, c.limite_bases, c.limite_complementos_gratis, c.image_url, c.video_url, c.video_poster, c.available_hours ? JSON.stringify(c.available_hours) : null, c.display_order, c.active, targetId, c.weight_grams]
          )
        } else {
          await query(
            `INSERT INTO product_containers (id, tenant_id, name, description, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [uuidv4(), targetId, c.name, c.description || null, c.weight_grams, customPrice, c.limite_bases, c.limite_complementos_gratis, c.image_url, c.video_url, c.video_poster, c.available_hours ? JSON.stringify(c.available_hours) : null, c.display_order, c.active]
          )
        }
      }

      // Bases (Cremes)
      for (const b of bases) {
        const check = await query(`SELECT id FROM product_bases WHERE tenant_id = $1 AND name = $2 AND deleted_at IS NULL`, [targetId, b.name])
        if (check.rows && check.rows.length > 0) {
          await query(
            `UPDATE product_bases
             SET description = $1, image_url = $2, video_url = $3, video_poster = $4,
                 available_hours = $5, display_order = $6, active = $7, updated_at = timezone('utc'::text, now())
             WHERE tenant_id = $8 AND name = $9 AND deleted_at IS NULL`,
            [b.description, b.image_url, b.video_url, b.video_poster, b.available_hours ? JSON.stringify(b.available_hours) : null, b.display_order, b.active, targetId, b.name]
          )
        } else {
          await query(
            `INSERT INTO product_bases (id, tenant_id, name, description, image_url, video_url, video_poster, available_hours, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [uuidv4(), targetId, b.name, b.description, b.image_url, b.video_url, b.video_poster, b.available_hours ? JSON.stringify(b.available_hours) : null, b.display_order, b.active]
          )
        }
      }

      // Toppings
      for (const t of toppings) {
        const check = await query(`SELECT id FROM product_toppings WHERE tenant_id = $1 AND name = $2 AND deleted_at IS NULL`, [targetId, t.name])
        if (check.rows && check.rows.length > 0) {
          await query(
            `UPDATE product_toppings
             SET description = $1, category = $2, is_premium = $3, preco_extra = $4, image_url = $5,
                 video_url = $6, video_poster = $7, available_hours = $8, display_order = $9,
                 active = $10, updated_at = timezone('utc'::text, now())
             WHERE tenant_id = $11 AND name = $12 AND deleted_at IS NULL`,
            [t.description || null, t.category, t.is_premium, t.preco_extra, t.image_url, t.video_url, t.video_poster, t.available_hours ? JSON.stringify(t.available_hours) : null, t.display_order, t.active, targetId, t.name]
          )
        } else {
          await query(
            `INSERT INTO product_toppings (id, tenant_id, name, description, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [uuidv4(), targetId, t.name, t.description || null, t.category, t.is_premium, t.preco_extra, t.image_url, t.video_url, t.video_poster, t.available_hours ? JSON.stringify(t.available_hours) : null, t.display_order, t.active]
          )
        }
      }

      // Limpa overrides de preços antigos da filial para que assumam os valores canônicos replicados
      await query(`DELETE FROM store_price_overrides WHERE tenant_id = $1`, [targetId])
    }

    // 4. Registro no log de auditoria para o TI
    await recordAuditLog({
      tenantId: sourceTenantId,
      action: 'CATALOG_REPLICATED',
      entity: 'product_containers',
      message: `Cardápio oficial e preços replicados para ${targetIds.length} filial(is)`,
      userRole: 'FRANCHISOR_ADMIN',
      metadata: {
        scope: payload?.applyToAll ? 'ALL_NETWORK' : 'SELECTED_STORES',
        targetStoresCount: targetIds.length,
        userEmail: payload?.userEmail,
        syncedContainersCount: containers.length,
        syncedBasesCount: bases.length,
        syncedToppingsCount: toppings.length,
      },
    })

    return {
      success: true,
      totalStores: targetIds.length + 1,
      syncedAt,
      scope: payload?.applyToAll ? 'ALL_NETWORK' : 'SELECTED_STORES',
      targetStoresCount: targetIds.length,
    }
  } catch (err) {
    console.error('Erro na replicação de catálogo para as lojas:', err)
    throw err
  }
}

function getTableName(category: string): string {
  if (category === 'containers') return 'product_containers'
  if (category === 'bases') return 'product_bases'
  if (category === 'toppings') return 'product_toppings'
  return 'product_toppings'
}

export async function createProductItem(category: string, item: any): Promise<any> {
  const id = item.id || uuidv4()
  const tableName = getTableName(category)
  const tenantId = item.tenantId || AVEIRO_HQ_ID

  try {
    if (category === 'containers') {
      const res = await query(
        `INSERT INTO product_containers (id, tenant_id, name, description, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active, option_groups)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
         RETURNING *`,
        [
          id,
          tenantId,
          item.name,
          item.description || null,
          Number(item.weightGrams) || 500,
          Number(item.precoBase || item.price) || 0,
          Number(item.limiteBases || item.limiteCremes) || 1,
          Number(item.limiteToppings || item.limiteComplementosGratis) || 0,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          Number(item.displayOrder) || 0,
          true,
          item.optionGroups ? JSON.stringify(item.optionGroups) : '[]'
        ]
      )
      const created = res.rows[0]
      await recordAuditLog({
        tenantId,
        action: 'PRODUCT_CONTAINER_CREATED',
        entity: 'product_containers',
        entityId: id,
        message: `Novo produto criado: "${item.name}" (${created.weight_grams}g, ${created.preco_base}€, ${(item.optionGroups || []).length} modelos de opções vinculados)`,
        metadata: {
          productId: id,
          name: item.name,
          weightGrams: created.weight_grams,
          precoBase: created.preco_base,
          optionGroupsCount: (item.optionGroups || []).length,
        },
      })
      return created
    } else if (category === 'bases') {
      const res = await query(
        `INSERT INTO product_bases (id, tenant_id, name, description, image_url, video_url, video_poster, available_hours, display_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          id,
          tenantId,
          item.name,
          item.description || null,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          Number(item.displayOrder) || 0,
          true
        ]
      )
      return res.rows[0]
    } else {
      const res = await query(
        `INSERT INTO product_toppings (id, tenant_id, name, description, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          id,
          tenantId,
          item.name,
          item.description || null,
          item.category || 'Toppings',
          !!item.isPremium,
          Number(item.precoExtra || item.price) || 0,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          Number(item.displayOrder) || 0,
          true
        ]
      )
      const created = res.rows[0]
      if (!item.tenantId || item.tenantId === AVEIRO_HQ_ID || item.tenantId === '11111111-1111-1111-1111-111111111111') {
        try {
          const otherTenants = await query(
            `SELECT id FROM tenants WHERE id != $1 AND deleted_at IS NULL`,
            [AVEIRO_HQ_ID]
          )
          for (const t of (otherTenants.rows || [])) {
            const replicaId = uuidv4()
            await query(
              `INSERT INTO product_toppings (id, tenant_id, name, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
               ON CONFLICT DO NOTHING`,
              [replicaId, t.id, item.name, item.category || 'Toppings', !!item.isPremium, Number(item.precoExtra || item.price) || 0, item.image || item.imageUrl || null, item.videoUrl || null, item.videoPoster || null, item.availableHours ? JSON.stringify(item.availableHours) : null, Number(item.displayOrder) || 0]
            )
          }
        } catch (repErr) {
          console.error('Erro ao replicar produto criado para demais lojas:', repErr)
        }
      }
      await recordAuditLog({
        tenantId,
        action: 'PRODUCT_CREATED',
        entity: tableName,
        entityId: id,
        message: `Novo item cadastrado: "${item.name}" na categoria ${category}`,
        metadata: { category, item: created },
      })
      return created
    }
  } catch (err) {
    console.error(`Erro ao criar item na tabela ${tableName}:`, err)
    return { ...item, id }
  }
}

export async function updateProductItem(category: string, id: string, item: any): Promise<any> {
  const tableName = getTableName(category)
  try {
    let updated: any = null
    if (category === 'containers') {
      const hasOptionGroups = item.optionGroups !== undefined
      const res = await query(
        `UPDATE product_containers
         SET name = COALESCE($2, name),
             description = CASE WHEN $3 = true THEN $4 ELSE description END,
             weight_grams = COALESCE($5, weight_grams),
             preco_base = COALESCE($6, preco_base),
             limite_bases = COALESCE($7, limite_bases),
             limite_complementos_gratis = COALESCE($8, limite_complementos_gratis),
             image_url = COALESCE($9, image_url),
             video_url = COALESCE($10, video_url),
             video_poster = COALESCE($11, video_poster),
             available_hours = COALESCE($12, available_hours),
             display_order = COALESCE($13, display_order),
             option_groups = CASE WHEN $14 = true THEN $15::jsonb ELSE option_groups END,
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1
         RETURNING *`,
        [
          id,
          item.name || null,
          item.description !== undefined,
          item.description || null,
          item.weightGrams !== undefined ? Number(item.weightGrams) : null,
          item.precoBase !== undefined ? Number(item.precoBase) : null,
          item.limiteBases !== undefined ? Number(item.limiteBases) : null,
          item.limiteToppings !== undefined ? Number(item.limiteToppings) : null,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          item.displayOrder !== undefined ? Number(item.displayOrder) : null,
          hasOptionGroups,
          hasOptionGroups ? JSON.stringify(item.optionGroups || []) : '[]'
        ]
      )
      updated = res.rows[0] || item

      await recordAuditLog({
        tenantId: updated.tenant_id,
        action: 'PRODUCT_CONTAINER_UPDATED',
        entity: 'product_containers',
        entityId: id,
        message: `Produto "${updated.name}" atualizado com sucesso (preço: ${updated.preco_base}€, ${(item.optionGroups || []).length} modelos vinculados)`,
        metadata: {
          productId: id,
          name: updated.name,
          precoBase: updated.preco_base,
          optionGroupsCount: (item.optionGroups || []).length,
          optionGroupsNames: (item.optionGroups || []).map((g: any) => g.name),
        },
      })
    } else if (category === 'bases') {
      const res = await query(
        `UPDATE product_bases
         SET name = COALESCE($2, name),
             description = CASE WHEN $3 = true THEN $4 ELSE description END,
             image_url = COALESCE($5, image_url),
             video_url = COALESCE($6, video_url),
             video_poster = COALESCE($7, video_poster),
             available_hours = COALESCE($8, available_hours),
             display_order = COALESCE($9, display_order),
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1
         RETURNING *`,
        [
          id,
          item.name || null,
          item.description !== undefined,
          item.description || null,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          item.displayOrder !== undefined ? Number(item.displayOrder) : null
        ]
      )
      updated = res.rows[0] || item
    } else {
      const res = await query(
        `UPDATE product_toppings
         SET name = COALESCE($2, name),
             description = CASE WHEN $3 = true THEN $4 ELSE description END,
             category = COALESCE($5, category),
             is_premium = COALESCE($6, is_premium),
             preco_extra = COALESCE($7, preco_extra),
             image_url = COALESCE($8, image_url),
             video_url = COALESCE($9, video_url),
             video_poster = COALESCE($10, video_poster),
             available_hours = COALESCE($11, available_hours),
             display_order = COALESCE($12, display_order),
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1
         RETURNING *`,
        [
          id,
          item.name || null,
          item.description !== undefined,
          item.description || null,
          item.category || null,
          item.isPremium !== undefined ? !!item.isPremium : null,
          item.precoExtra !== undefined ? Number(item.precoExtra) : null,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          item.displayOrder !== undefined ? Number(item.displayOrder) : null
        ]
      )
      updated = res.rows[0] || item
    }

    // Se o item atualizado for da Franqueadora/Matriz Aveiro, propaga alterações mestres para as demais lojas
    if (updated && (updated.tenant_id === AVEIRO_HQ_ID || !item.tenantId || item.tenantId === AVEIRO_HQ_ID)) {
      try {
        if (category === 'containers' && updated.weight_grams) {
          await query(
            `UPDATE product_containers
             SET name = COALESCE($1, name),
                 description = CASE WHEN $2 = true THEN $3 ELSE description END,
                 limite_bases = COALESCE($4, limite_bases),
                 limite_complementos_gratis = COALESCE($5, limite_complementos_gratis),
                 image_url = COALESCE($6, image_url),
                 video_url = COALESCE($7, video_url),
                 video_poster = COALESCE($8, video_poster),
                 available_hours = COALESCE($9, available_hours),
                 display_order = COALESCE($10, display_order),
                 updated_at = timezone('utc'::text, now())
             WHERE weight_grams = $11 AND tenant_id != $12`,
            [
              item.name || null,
              item.description !== undefined,
              item.description || null,
              item.limiteBases !== undefined ? Number(item.limiteBases) : null,
              item.limiteToppings !== undefined ? Number(item.limiteToppings) : null,
              item.image || item.imageUrl || null,
              item.videoUrl || null,
              item.videoPoster || null,
              item.availableHours ? JSON.stringify(item.availableHours) : null,
              item.displayOrder !== undefined ? Number(item.displayOrder) : null,
              Number(updated.weight_grams),
              AVEIRO_HQ_ID,
            ]
          )
        } else if (category === 'bases' && updated.name) {
          await query(
            `UPDATE product_bases
             SET description = CASE WHEN $1 = true THEN $2 ELSE description END,
                 image_url = COALESCE($3, image_url),
                 video_url = COALESCE($4, video_url),
                 video_poster = COALESCE($5, video_poster),
                 available_hours = COALESCE($6, available_hours),
                 display_order = COALESCE($7, display_order),
                 updated_at = timezone('utc'::text, now())
             WHERE name = $8 AND tenant_id != $9`,
            [
              item.description !== undefined,
              item.description || null,
              item.image || item.imageUrl || null,
              item.videoUrl || null,
              item.videoPoster || null,
              item.availableHours ? JSON.stringify(item.availableHours) : null,
              item.displayOrder !== undefined ? Number(item.displayOrder) : null,
              updated.name,
              AVEIRO_HQ_ID,
            ]
          )
        } else if (category === 'toppings' && updated.name) {
          await query(
            `UPDATE product_toppings
             SET description = CASE WHEN $1 = true THEN $2 ELSE description END,
                 category = COALESCE($3, category),
                 is_premium = COALESCE($4, is_premium),
                 preco_extra = COALESCE($5, preco_extra),
                 image_url = COALESCE($6, image_url),
                 video_url = COALESCE($7, video_url),
                 video_poster = COALESCE($8, video_poster),
                 available_hours = COALESCE($9, available_hours),
                 display_order = COALESCE($10, display_order),
                 updated_at = timezone('utc'::text, now())
             WHERE name = $11 AND tenant_id != $12`,
            [
              item.description !== undefined,
              item.description || null,
              item.category || null,
              item.isPremium !== undefined ? !!item.isPremium : null,
              item.precoExtra !== undefined ? Number(item.precoExtra) : null,
              item.image || item.imageUrl || null,
              item.videoUrl || null,
              item.videoPoster || null,
              item.availableHours ? JSON.stringify(item.availableHours) : null,
              item.displayOrder !== undefined ? Number(item.displayOrder) : null,
              updated.name,
              AVEIRO_HQ_ID,
            ]
          )
        }
      } catch (repErr) {
        console.error('Erro ao propagar atualizações para filiais:', repErr)
      }
    }

    await recordAuditLog({
      tenantId: item.tenantId || null,
      action: 'PRODUCT_UPDATED',
      entity: tableName,
      entityId: id,
      message: `Item atualizado: "${updated?.name || id}" na categoria ${category}`,
      metadata: { category, item: updated },
    })

    return updated
  } catch (err) {
    console.error(`Erro ao atualizar item na tabela ${tableName}:`, err)
    return item
  }
}

export async function deleteProductItem(category: string, id: string): Promise<boolean> {
  const tableName = getTableName(category)
  try {
    const itemRes = await query(`SELECT name, tenant_id FROM ${tableName} WHERE id::text = $1`, [id])
    const item = itemRes.rows?.[0]

    await query(
      `UPDATE ${tableName} 
       SET deleted_at = timezone('utc'::text, now()), active = false 
       WHERE id::text = $1`,
      [id]
    )

    // Se deletado na Matriz/Franqueadora, propaga soft-delete em toda a rede
    if (item && (item.tenant_id === AVEIRO_HQ_ID || !item.tenant_id)) {
      await query(
        `UPDATE ${tableName} 
         SET deleted_at = timezone('utc'::text, now()), active = false 
         WHERE name = $1 AND tenant_id != $2`,
        [item.name, AVEIRO_HQ_ID]
      )
    }

    await recordAuditLog({
      tenantId: item?.tenant_id || null,
      action: 'PRODUCT_DELETED',
      entity: tableName,
      entityId: id,
      message: `Item removido (soft delete): "${item?.name || id}" em ${category}`,
      metadata: { category, id, item },
    })

    return true
  } catch {
    return false
  }
}

/**
 * Reordena produtos (containers, bases ou toppings) no PostgreSQL via drag-and-drop
 */
export async function reorderProducts(
  items: { id: string; displayOrder: number }[],
  collection: 'containers' | 'bases' | 'toppings' = 'containers',
  tenantId?: string
): Promise<boolean> {
  const tableName = getTableName(collection)
  try {
    for (const item of items) {
      await query(
        `UPDATE ${tableName}
         SET display_order = $2
         WHERE id::text = $1`,
        [item.id, item.displayOrder]
      )
    }

    await recordAuditLog({
      tenantId: tenantId || null,
      action: 'PRODUCTS_REORDERED',
      entity: tableName,
      message: `Ordem dos itens de ${collection} reorganizada via drag-and-drop (${items.length} itens)`,
      metadata: { collection, items },
    })

    return true
  } catch (err) {
    console.error(`Erro ao reordenar itens em ${tableName}:`, err)
    return false
  }
}
