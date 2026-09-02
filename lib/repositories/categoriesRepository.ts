import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'
import { AVEIRO_HQ_ID } from './tenantsRepository'
import { recordAuditLog } from './auditRepository'

export interface CategoryRow {
  id: string
  name: string
  slug: string
  description?: string
  emoji?: string
  menuId?: string
  displayOrder: number
  active: boolean
  defaultPrice?: number
  weightGrams?: number
  tenantId?: string
}

export interface MenuRow {
  id: string
  name: string
  code: string
  description?: string
  displayOrder: number
  active: boolean
  availableHours?: any
  tenantId?: string
}

/**
 * Obtém os menus de um tenant (ou menus padrão da Matriz)
 */
export async function getMenusByTenant(tenantId: string = AVEIRO_HQ_ID): Promise<MenuRow[]> {
  try {
    const res = await query(
      `SELECT id, name, code, description, display_order as "displayOrder", active, available_hours as "availableHours"
       FROM menus
       ORDER BY display_order ASC`
    )
    if (res && res.rows && res.rows.length > 0) {
      return res.rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description || '',
        displayOrder: Number(r.displayOrder) || 1,
        active: r.active !== false,
        availableHours: r.availableHours,
      }))
    }
  } catch (err) {
    console.error('Erro ao buscar menus no PostgreSQL:', err)
  }
  return []
}

/**
 * Obtém as categorias do cardápio filtradas por tenant/loja
 */
export async function getCategoriesByTenant(tenantId: string = AVEIRO_HQ_ID): Promise<CategoryRow[]> {
  try {
    // Busca categorias que correspondam ao tenant_id no slug ou vinculadas ao menu
    const res = await query(
      `SELECT id, name, slug, description, emoji, menu_id as "menuId",
              display_order as "displayOrder", active, 
              default_price as "defaultPrice", weight_grams as "weightGrams"
       FROM categories
       WHERE slug LIKE $1 OR slug NOT LIKE '%-%-%-%-%'
       ORDER BY display_order ASC`,
      [`%${tenantId}%`]
    )

    // Se a filial não tiver categorias específicas com seu tenantId no slug, carrega as da Matriz (Aveiro)
    let rows = res.rows || []
    if (rows.length === 0 && tenantId !== AVEIRO_HQ_ID) {
      const fallbackRes = await query(
        `SELECT id, name, slug, description, emoji, menu_id as "menuId",
                display_order as "displayOrder", active, 
                default_price as "defaultPrice", weight_grams as "weightGrams"
         FROM categories
         WHERE slug LIKE $1
         ORDER BY display_order ASC`,
        [`%${AVEIRO_HQ_ID}%`]
      )
      rows = fallbackRes.rows || []
    }

    // Se ainda vazio, busca todas
    if (rows.length === 0) {
      const allRes = await query(
        `SELECT id, name, slug, description, emoji, menu_id as "menuId",
                display_order as "displayOrder", active, 
                default_price as "defaultPrice", weight_grams as "weightGrams"
         FROM categories
         ORDER BY display_order ASC`
      )
      rows = allRes.rows || []
    }

    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || '',
      emoji: r.emoji || '',
      menuId: r.menuId,
      displayOrder: Number(r.displayOrder) || 1,
      active: r.active !== false,
      defaultPrice: Number(r.defaultPrice) || 0,
      weightGrams: r.weightGrams ? Number(r.weightGrams) : undefined,
    }))
  } catch (err) {
    console.error('Erro ao buscar categorias no PostgreSQL:', err)
  }
  return []
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(data: {
  name: string
  slug?: string
  description?: string
  emoji?: string
  menuId?: string
  displayOrder?: number
  active?: boolean
  defaultPrice?: number
  weightGrams?: number
  tenantId?: string
}): Promise<CategoryRow> {
  const id = uuidv4()
  const tenantId = data.tenantId || AVEIRO_HQ_ID
  const slug = data.slug || `${data.name.toLowerCase().replace(/\s+/g, '-')}-${tenantId}`

  const res = await query(
    `INSERT INTO categories (id, name, slug, description, emoji, menu_id, display_order, active, default_price, weight_grams)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, name, slug, description, emoji, menu_id as "menuId", display_order as "displayOrder", active, default_price as "defaultPrice", weight_grams as "weightGrams"`,
    [
      id,
      data.name,
      slug,
      data.description || null,
      data.emoji || null,
      data.menuId || null,
      data.displayOrder || 1,
      data.active !== undefined ? data.active : true,
      data.defaultPrice || 0,
      data.weightGrams || null,
    ]
  )

  await recordAuditLog({
    tenantId,
    action: 'CATEGORY_CREATED',
    entity: 'categories',
    entityId: id,
    message: `Nova categoria cadastrada: "${data.name}"`,
    metadata: { category: data },
  })

  const r = res.rows[0]
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description || '',
    emoji: r.emoji || '',
    menuId: r.menuId,
    displayOrder: Number(r.displayOrder) || 1,
    active: r.active !== false,
    defaultPrice: Number(r.defaultPrice) || 0,
    weightGrams: r.weightGrams ? Number(r.weightGrams) : undefined,
  }
}

/**
 * Atualiza categoria (incluindo status ativo/pausado)
 */
export async function updateCategory(
  id: string,
  data: Partial<{
    name: string
    slug: string
    description: string
    emoji: string
    menuId: string
    displayOrder: number
    active: boolean
    defaultPrice: number
    weightGrams: number
    tenantId?: string
  }>
): Promise<CategoryRow | null> {
  try {
    const res = await query(
      `UPDATE categories
       SET name = COALESCE($2, name),
           slug = COALESCE($3, slug),
           description = COALESCE($4, description),
           emoji = COALESCE($5, emoji),
           menu_id = COALESCE($6, menu_id),
           display_order = COALESCE($7, display_order),
           active = COALESCE($8, active),
           default_price = COALESCE($9, default_price),
           weight_grams = COALESCE($10, weight_grams)
       WHERE id = $1
       RETURNING id, name, slug, description, emoji, menu_id as "menuId", display_order as "displayOrder", active, default_price as "defaultPrice", weight_grams as "weightGrams"`,
      [
        id,
        data.name,
        data.slug,
        data.description,
        data.emoji,
        data.menuId,
        data.displayOrder,
        data.active,
        data.defaultPrice,
        data.weightGrams,
      ]
    )

    if (!res || !res.rows[0]) return null
    const r = res.rows[0]

    // Se alterou active da categoria e tem weightGrams, propaga para os containers daquela loja
    if (data.active !== undefined && r.weightGrams) {
      const weight = Number(r.weightGrams)
      const tenantId = data.tenantId || AVEIRO_HQ_ID
      // Atualiza overrides da loja para os containers com esse peso
      const containersRes = await query(
        `SELECT id FROM product_containers WHERE weight_grams = $1 AND deleted_at IS NULL`,
        [weight]
      )
      for (const c of containersRes.rows || []) {
        await query(
          `INSERT INTO store_product_overrides (tenant_id, product_id, is_available, updated_at)
           VALUES ($1, $2, $3, timezone('utc'::text, now()))
           ON CONFLICT (tenant_id, product_id)
           DO UPDATE SET is_available = EXCLUDED.is_available, updated_at = timezone('utc'::text, now())`,
          [tenantId, c.id, data.active]
        )
      }
    }

    await recordAuditLog({
      tenantId: data.tenantId || null,
      action: 'CATEGORY_STATUS_TOGGLED',
      entity: 'categories',
      entityId: id,
      message: `Categoria "${r.name}" atualizada: active=${data.active}`,
      metadata: { id, data },
    })

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || '',
      emoji: r.emoji || '',
      menuId: r.menuId,
      displayOrder: Number(r.displayOrder) || 1,
      active: r.active !== false,
      defaultPrice: Number(r.defaultPrice) || 0,
      weightGrams: r.weightGrams ? Number(r.weightGrams) : undefined,
    }
  } catch (err) {
    console.error('Erro ao atualizar categoria:', err)
    return null
  }
}

/**
 * Exclui categoria
 */
export async function deleteCategory(id: string, tenantId?: string): Promise<boolean> {
  try {
    const res = await query(`DELETE FROM categories WHERE id = $1`, [id])
    await recordAuditLog({
      tenantId: tenantId || null,
      action: 'CATEGORY_DELETED',
      entity: 'categories',
      entityId: id,
      message: `Categoria excluída ID: ${id}`,
      metadata: { id },
    })
    return (res.rowCount || 0) > 0
  } catch (err) {
    console.error('Erro ao excluir categoria:', err)
    return false
  }
}

/**
 * Atualiza status ou dados de um menu
 */
export async function updateMenu(
  id: string,
  data: Partial<{
    name: string
    code: string
    description: string
    displayOrder: number
    active: boolean
    availableHours: any
    tenantId?: string
  }>
): Promise<MenuRow | null> {
  try {
    const res = await query(
      `UPDATE menus
       SET name = COALESCE($2, name),
           code = COALESCE($3, code),
           description = COALESCE($4, description),
           display_order = COALESCE($5, display_order),
           active = COALESCE($6, active),
           available_hours = COALESCE($7, available_hours)
       WHERE id = $1
       RETURNING id, name, code, description, display_order as "displayOrder", active, available_hours as "availableHours"`,
      [
        id,
        data.name,
        data.code,
        data.description,
        data.displayOrder,
        data.active,
        data.availableHours ? JSON.stringify(data.availableHours) : null,
      ]
    )
    if (!res || !res.rows[0]) return null
    const r = res.rows[0]

    await recordAuditLog({
      tenantId: data.tenantId || null,
      action: 'MENU_STATUS_TOGGLED',
      entity: 'menus',
      entityId: id,
      message: `Menu "${r.name}" atualizado: active=${data.active}`,
      metadata: { id, data },
    })

    return {
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description || '',
      displayOrder: Number(r.displayOrder) || 1,
      active: r.active !== false,
      availableHours: r.availableHours,
    }
  } catch (err) {
    console.error('Erro ao atualizar menu:', err)
    return null
  }
}

/**
 * Reordena as categorias no PostgreSQL via drag-and-drop
 */
export async function reorderCategories(
  items: { id: string; displayOrder: number }[],
  tenantId?: string
): Promise<boolean> {
  try {
    for (const item of items) {
      await query(
        `UPDATE categories
         SET display_order = $2
         WHERE id = $1`,
        [item.id, item.displayOrder]
      )
    }

    await recordAuditLog({
      tenantId: tenantId || null,
      action: 'CATEGORIES_REORDERED',
      entity: 'categories',
      message: `Ordem das categorias reorganizada via drag-and-drop (${items.length} itens)`,
      metadata: { items },
    })

    return true
  } catch (err) {
    console.error('Erro ao reordenar categorias:', err)
    return false
  }
}

