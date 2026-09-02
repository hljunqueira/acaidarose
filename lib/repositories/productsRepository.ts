import { CatalogData, ProductContainer, ProductBase, ProductTopping } from '@/types'
import { query } from '@/lib/db/postgres'
import { AVEIRO_HQ_ID } from '@/lib/repositories/tenantsRepository'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { v4 as uuidv4 } from 'uuid'

export async function getCatalogByTenant(tenantId: string = AVEIRO_HQ_ID): Promise<CatalogData> {
  const containers: ProductContainer[] = []
  const bases: ProductBase[] = []
  const toppings: ProductTopping[] = []

  try {
    const [containersRes, basesRes, toppingsRes, priceOverridesRes, availabilityOverridesRes] = await Promise.all([
      query(`SELECT id, name, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active FROM product_containers WHERE tenant_id = $1 AND active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [tenantId]),
      query(`SELECT id, name, description, image_url, video_url, video_poster, available_hours, display_order, active FROM product_bases WHERE tenant_id = $1 AND active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [tenantId]),
      query(`SELECT id, name, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active FROM product_toppings WHERE tenant_id = $1 AND active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [tenantId]),
      query(`SELECT product_id, custom_price FROM store_price_overrides WHERE tenant_id = $1`, [tenantId]),
      query(`SELECT product_id, is_available FROM store_product_overrides WHERE tenant_id = $1`, [tenantId])
    ])

    const priceMap = new Map<string, number>()
    if (priceOverridesRes && priceOverridesRes.rows) {
      priceOverridesRes.rows.forEach((r: any) => {
        priceMap.set(r.product_id, Number(r.custom_price))
      })
    }

    const availabilityMap = new Map<string, boolean>()
    if (availabilityOverridesRes && availabilityOverridesRes.rows) {
      availabilityOverridesRes.rows.forEach((r: any) => {
        availabilityMap.set(r.product_id, !!r.is_available)
      })
    }

    if (containersRes && containersRes.rows) {
      containersRes.rows.forEach((row: any) => {
        const customPrice = priceMap.get(row.id)
        const customAvailability = availabilityMap.get(row.id)
        const weight = Number(row.weight_grams) || 500
        const limiteFrutas = weight === 250 ? 2 : weight === 350 ? 3 : 999

        containers.push({
          id: row.id,
          name: row.name,
          description: '',
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
          active: !!row.active,
          isAvailableInStore: customAvailability !== undefined ? customAvailability : !!row.active
        })
      })
    }

    if (basesRes && basesRes.rows) {
      basesRes.rows.forEach((row: any) => {
        const customAvailability = availabilityMap.get(row.id)
        bases.push({
          id: row.id,
          name: row.name,
          description: row.description || '',
          displayOrder: row.display_order,
          active: !!row.active,
          videoUrl: row.video_url,
          videoPoster: row.video_poster,
          availableHours: row.available_hours,
          isAvailableInStore: customAvailability !== undefined ? customAvailability : !!row.active
        })
      })
    }

    if (toppingsRes && toppingsRes.rows) {
      toppingsRes.rows.forEach((row: any) => {
        const customPrice = priceMap.get(row.id)
        const customAvailability = availabilityMap.get(row.id)
        toppings.push({
          id: row.id,
          name: row.name,
          category: row.category,
          isPremium: !!row.is_premium,
          precoExtra: customPrice !== undefined ? customPrice : Number(row.preco_extra),
          price: customPrice !== undefined ? customPrice : Number(row.preco_extra),
          displayOrder: row.display_order,
          active: !!row.active,
          videoUrl: row.video_url,
          videoPoster: row.video_poster,
          availableHours: row.available_hours,
          isAvailableInStore: customAvailability !== undefined ? customAvailability : !!row.active,
          emoji: ''
        })
      })
    }
  } catch (err) {
    console.error('Erro ao consultar catálogo no PostgreSQL:', err)
  }

  // Catálogo Canônico Padrão Oficial do Açaí da Rose
  const defaultContainers: ProductContainer[] = [
    { id: 'cnt-250', name: 'Açaí 250g', precoBase: 6.90, weightGrams: 250, limiteCremes: 1, limiteFrutas: 2, limiteToppings: 3, isAvailableInStore: true, emoji: '', active: true },
    { id: 'cnt-350', name: 'Açaí 350g', precoBase: 8.90, weightGrams: 350, limiteCremes: 1, limiteFrutas: 3, limiteToppings: 3, isAvailableInStore: true, emoji: '', active: true },
    { id: 'cnt-500', name: 'Açaí 500g', precoBase: 12.90, weightGrams: 500, limiteCremes: 1, limiteFrutas: 99, limiteToppings: 99, isAvailableInStore: true, emoji: '', active: true },
    { id: 'cnt-750', name: 'Açaí 750g', precoBase: 17.90, weightGrams: 750, limiteCremes: 1, limiteFrutas: 99, limiteToppings: 99, isAvailableInStore: true, emoji: '', active: true },
    { id: 'cnt-1000', name: 'Açaí 1kg', precoBase: 22.90, weightGrams: 1000, limiteCremes: 1, limiteFrutas: 99, limiteToppings: 99, isAvailableInStore: true, emoji: '', active: true },
  ]

  const defaultBases: ProductBase[] = [
    { id: 'base-acai', name: 'Açaí Tradicional', description: 'Açaí puro e cremoso batido na hora', displayOrder: 1, active: true, isAvailableInStore: true },
    { id: 'base-coco', name: 'Creme de Coco', description: 'Cremoso e artesanal', displayOrder: 2, active: true, isAvailableInStore: true },
    { id: 'base-morango', name: 'Creme de Morango', description: 'Feito com morangos frescos', displayOrder: 3, active: true, isAvailableInStore: true },
    { id: 'base-cupuacu', name: 'Creme de Cupuaçu', description: 'Sabor autêntico da Amazônia', displayOrder: 4, active: true, isAvailableInStore: true },
    { id: 'base-manga', name: 'Creme de Manga', description: 'Doce e refrescante', displayOrder: 5, active: true, isAvailableInStore: true },
    { id: 'base-goiaba', name: 'Creme de Goiaba', description: 'Artesanal e aveludado', displayOrder: 6, active: true, isAvailableInStore: true },
    { id: 'base-leite-po', name: 'Creme de Leite em pó', description: 'Sabor suave e irresistível', displayOrder: 7, active: true, isAvailableInStore: true },
    { id: 'base-graviola', name: 'Creme de Graviola', description: 'Fruta tropical brasileira', displayOrder: 8, active: true, isAvailableInStore: true },
    { id: 'base-pitaya', name: 'Creme de Pitaya', description: 'Cor vibrante e rico em nutrientes', displayOrder: 9, active: true, isAvailableInStore: true },
    { id: 'base-maracuja', name: 'Creme de Maracujá', description: 'Toque cítrico e refrescante', displayOrder: 10, active: true, isAvailableInStore: true },
  ]

  const defaultToppings: ProductTopping[] = [
    // Frutas Frescas
    { id: 'top-banana', name: 'Banana', category: 'Frutas', isPremium: false, precoExtra: 0, displayOrder: 1, active: true, isAvailableInStore: true },
    { id: 'top-kiwi', name: 'Kiwi', category: 'Frutas', isPremium: false, precoExtra: 0, displayOrder: 2, active: true, isAvailableInStore: true },
    { id: 'top-manga', name: 'Manga', category: 'Frutas', isPremium: false, precoExtra: 0, displayOrder: 3, active: true, isAvailableInStore: true },
    { id: 'top-morango', name: 'Morango', category: 'Frutas', isPremium: false, precoExtra: 0, displayOrder: 4, active: true, isAvailableInStore: true },
    { id: 'top-uva', name: 'Uva', category: 'Frutas', isPremium: false, precoExtra: 0, displayOrder: 5, active: true, isAvailableInStore: true },

    // Toppings Tradicionais
    { id: 'top-biscoff-creme', name: 'Biscoff creme', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 10, active: true, isAvailableInStore: true },
    { id: 'top-mel', name: 'Mel', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 11, active: true, isAvailableInStore: true },
    { id: 'top-biscoff-picado', name: 'Biscoff picado', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 12, active: true, isAvailableInStore: true },
    { id: 'top-oreo-inteiro', name: 'Oreo inteiro', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 13, active: true, isAvailableInStore: true },
    { id: 'top-canudo-crocante', name: 'Canudo crocante', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 14, active: true, isAvailableInStore: true },
    { id: 'top-oreo-picado', name: 'Oreo picado', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 15, active: true, isAvailableInStore: true },
    { id: 'top-chocobol', name: 'Chocobol', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 16, active: true, isAvailableInStore: true },
    { id: 'top-ovomaltine', name: 'Ovomaltine', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 17, active: true, isAvailableInStore: true },
    { id: 'top-granola', name: 'Granola', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 18, active: true, isAvailableInStore: true },
    { id: 'top-pacoca', name: 'Paçoca', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 19, active: true, isAvailableInStore: true },
    { id: 'top-iogurte', name: 'Iogurte natural', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 20, active: true, isAvailableInStore: true },
    { id: 'top-pepitas-chocolate', name: 'Pepitas de chocolate', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 21, active: true, isAvailableInStore: true },
    { id: 'top-leite-condensado', name: 'Leite condensado', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 22, active: true, isAvailableInStore: true },
    { id: 'top-pintarolas', name: 'Pintarolas', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 23, active: true, isAvailableInStore: true },
    { id: 'top-leite-em-po', name: 'Leite em pó', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 24, active: true, isAvailableInStore: true },
    { id: 'top-manteiga-amendoim', name: 'Manteiga de amendoim', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 25, active: true, isAvailableInStore: true },
    { id: 'top-marshmallow', name: 'Marshmallow', category: 'Toppings', isPremium: false, precoExtra: 0, displayOrder: 26, active: true, isAvailableInStore: true },

    // Adicionais / Especiais Premium
    { id: 'top-creme-ninho', name: 'Creme de Leite em pó', category: 'Adicionais', isPremium: true, precoExtra: 1.0, displayOrder: 30, active: true, isAvailableInStore: true },
    { id: 'top-creme-pistache', name: 'Creme de Pistache', category: 'Adicionais', isPremium: true, precoExtra: 2.0, displayOrder: 31, active: true, isAvailableInStore: true },
    { id: 'top-nutella', name: 'Nutella', category: 'Adicionais', isPremium: true, precoExtra: 1.0, displayOrder: 32, active: true, isAvailableInStore: true },
  ]

  // Se a consulta no banco não trouxe registros (ou trouxe vazio), mescla com os canônicos padrão
  return {
    containers: containers.length > 0 ? containers : defaultContainers,
    bases: bases.length > 0 ? bases : defaultBases,
    toppings: toppings.length > 0 ? toppings : defaultToppings,
  }
}

export async function setStoreProductPrice(
  tenantId: string,
  productId: string,
  newPrice: number
): Promise<{ success: boolean; tenantId: string; productId: string; newPrice: number }> {
  const val = Number(newPrice)
  try {
    await query(
      `INSERT INTO store_price_overrides (tenant_id, product_id, custom_price, updated_at)
       VALUES ($1, $2, $3, timezone('utc'::text, now()))
       ON CONFLICT (tenant_id, product_id) 
       DO UPDATE SET custom_price = EXCLUDED.custom_price, updated_at = timezone('utc'::text, now())`,
      [tenantId, productId, val]
    )
  } catch (err) {
    console.error('Erro ao atualizar preco override do produto:', err)
  }

  return { success: true, tenantId, productId, newPrice: val }
}

export async function toggleStoreItemAvailability(
  tenantId: string,
  productId: string,
  available: boolean
): Promise<{ success: boolean; tenantId: string; productId: string; available: boolean }> {
  try {
    await query(
      `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, updated_at)
       VALUES ($1, $2, $3, timezone('utc'::text, now()))
       ON CONFLICT (tenant_id, product_id) 
       DO UPDATE SET is_available = EXCLUDED.is_available, updated_at = timezone('utc'::text, now())`,
      [tenantId, productId, available]
    )

    await recordAuditLog({
      tenantId,
      action: 'PRODUCT_AVAILABILITY_TOGGLED',
      entity: 'store_product_overrides',
      entityId: productId,
      message: available
        ? `Item reativado e disponível na loja (${productId})`
        : `Item pausado/esgotado na loja (${productId})`,
      metadata: { productId, available },
    })
  } catch (err) {
    console.error('Erro ao atualizar disponibilidade override do produto:', err)
  }

  return { success: true, tenantId, productId, available }
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
      query(`SELECT name, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active FROM product_containers WHERE tenant_id = $1 AND deleted_at IS NULL`, [sourceTenantId]),
      query(`SELECT name, description, image_url, video_url, video_poster, available_hours, display_order, active FROM product_bases WHERE tenant_id = $1 AND deleted_at IS NULL`, [sourceTenantId]),
      query(`SELECT name, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active FROM product_toppings WHERE tenant_id = $1 AND deleted_at IS NULL`, [sourceTenantId]),
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
             SET name = $1, preco_base = $2, limite_bases = $3, limite_complementos_gratis = $4,
                 image_url = $5, video_url = $6, video_poster = $7, available_hours = $8,
                 display_order = $9, active = $10, updated_at = timezone('utc'::text, now())
             WHERE tenant_id = $11 AND weight_grams = $12 AND deleted_at IS NULL`,
            [c.name, customPrice, c.limite_bases, c.limite_complementos_gratis, c.image_url, c.video_url, c.video_poster, c.available_hours ? JSON.stringify(c.available_hours) : null, c.display_order, c.active, targetId, c.weight_grams]
          )
        } else {
          await query(
            `INSERT INTO product_containers (id, tenant_id, name, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [uuidv4(), targetId, c.name, c.weight_grams, customPrice, c.limite_bases, c.limite_complementos_gratis, c.image_url, c.video_url, c.video_poster, c.available_hours ? JSON.stringify(c.available_hours) : null, c.display_order, c.active]
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

      // Toppings (Acompanhamentos)
      for (const t of toppings) {
        const check = await query(`SELECT id FROM product_toppings WHERE tenant_id = $1 AND name = $2 AND deleted_at IS NULL`, [targetId, t.name])
        if (check.rows && check.rows.length > 0) {
          await query(
            `UPDATE product_toppings
             SET category = $1, is_premium = $2, preco_extra = $3, image_url = $4,
                 video_url = $5, video_poster = $6, available_hours = $7, display_order = $8,
                 active = $9, updated_at = timezone('utc'::text, now())
             WHERE tenant_id = $10 AND name = $11 AND deleted_at IS NULL`,
            [t.category, t.is_premium, t.preco_extra, t.image_url, t.video_url, t.video_poster, t.available_hours ? JSON.stringify(t.available_hours) : null, t.display_order, t.active, targetId, t.name]
          )
        } else {
          await query(
            `INSERT INTO product_toppings (id, tenant_id, name, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [uuidv4(), targetId, t.name, t.category, t.is_premium, t.preco_extra, t.image_url, t.video_url, t.video_poster, t.available_hours ? JSON.stringify(t.available_hours) : null, t.display_order, t.active]
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
        `INSERT INTO product_containers (id, tenant_id, name, weight_grams, preco_base, limite_bases, limite_complementos_gratis, image_url, video_url, video_poster, available_hours, display_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          id,
          tenantId,
          item.name,
          Number(item.weightGrams) || 500,
          Number(item.precoBase || item.price) || 0,
          Number(item.limiteBases || item.limiteCremes) || 1,
          Number(item.limiteToppings || item.limiteComplementosGratis) || 0,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          Number(item.displayOrder) || 0,
          true
        ]
      )
      return res.rows[0]
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
        `INSERT INTO product_toppings (id, tenant_id, name, category, is_premium, preco_extra, image_url, video_url, video_poster, available_hours, display_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          id,
          tenantId,
          item.name,
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
      const res = await query(
        `UPDATE product_containers
         SET name = COALESCE($2, name),
             weight_grams = COALESCE($3, weight_grams),
             preco_base = COALESCE($4, preco_base),
             limite_bases = COALESCE($5, limite_bases),
             limite_complementos_gratis = COALESCE($6, limite_complementos_gratis),
             image_url = COALESCE($7, image_url),
             video_url = COALESCE($8, video_url),
             video_poster = COALESCE($9, video_poster),
             available_hours = COALESCE($10, available_hours),
             display_order = COALESCE($11, display_order),
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1
         RETURNING *`,
        [
          id,
          item.name || null,
          item.weightGrams !== undefined ? Number(item.weightGrams) : null,
          item.precoBase !== undefined ? Number(item.precoBase) : null,
          item.limiteBases !== undefined ? Number(item.limiteBases) : null,
          item.limiteToppings !== undefined ? Number(item.limiteToppings) : null,
          item.image || item.imageUrl || null,
          item.videoUrl || null,
          item.videoPoster || null,
          item.availableHours ? JSON.stringify(item.availableHours) : null,
          item.displayOrder !== undefined ? Number(item.displayOrder) : null
        ]
      )
      updated = res.rows[0] || item
    } else if (category === 'bases') {
      const res = await query(
        `UPDATE product_bases
         SET name = COALESCE($2, name),
             description = COALESCE($3, description),
             image_url = COALESCE($4, image_url),
             video_url = COALESCE($5, video_url),
             video_poster = COALESCE($6, video_poster),
             available_hours = COALESCE($7, available_hours),
             display_order = COALESCE($8, display_order),
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1
         RETURNING *`,
        [
          id,
          item.name || null,
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
             category = COALESCE($3, category),
             is_premium = COALESCE($4, is_premium),
             preco_extra = COALESCE($5, preco_extra),
             image_url = COALESCE($6, image_url),
             video_url = COALESCE($7, video_url),
             video_poster = COALESCE($8, video_poster),
             available_hours = COALESCE($9, available_hours),
             display_order = COALESCE($10, display_order),
             updated_at = timezone('utc'::text, now())
         WHERE id::text = $1
         RETURNING *`,
        [
          id,
          item.name || null,
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

    await recordAuditLog({
      tenantId: item.tenantId || null,
      action: 'PRODUCT_UPDATED',
      entity: tableName,
      entityId: id,
      message: `Item atualizado: "${item.name || id}" na categoria ${category}`,
      metadata: { category, id, updatedData: item },
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
    const res = await query(
      `UPDATE ${tableName} 
       SET deleted_at = timezone('utc'::text, now()), active = false 
       WHERE id::text = $1`,
      [id]
    )

    await recordAuditLog({
      action: 'PRODUCT_DELETED',
      entity: tableName,
      entityId: id,
      message: `Item removido do catálogo (soft-delete): ID ${id} (${category})`,
      metadata: { category, id },
    })

    return (res.rowCount || 0) > 0
  } catch {
    return false
  }
}
