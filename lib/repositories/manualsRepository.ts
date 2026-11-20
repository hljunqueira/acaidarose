import { query } from '@/lib/db/postgres'
import { ManualArticle, ManualCategory, ManualStep, UserRole } from '@/types'
import { v4 as uuidv4 } from 'uuid'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

// ============================================================================
// CATEGORIAS
// ============================================================================

export async function getManualCategories(userRole?: UserRole | null): Promise<ManualCategory[]> {
  const isMaster = userRole === 'SUPER_ADMIN'

  let sql = `
    SELECT c.id, c.title, c.slug, c.description, c.order_index, c.target_roles, c.created_at, c.updated_at,
           COUNT(a.id) FILTER (WHERE a.published = true) as articles_count
    FROM manual_categories c
    LEFT JOIN manual_articles a ON a.category_id = c.id
  `
  const params: any[] = []

  if (!isMaster && userRole) {
    sql += ` WHERE $1 = ANY(c.target_roles)`
    params.push(userRole)
  }

  sql += `
    GROUP BY c.id
    ORDER BY c.order_index ASC, c.title ASC
  `

  const res = await query(sql, params)

  return (res.rows || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    orderIndex: Number(row.order_index) || 0,
    targetRoles: Array.isArray(row.target_roles) ? row.target_roles : [],
    articlesCount: Number(row.articles_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getManualCategoryById(id: string): Promise<ManualCategory | null> {
  const res = await query(
    `SELECT id, title, slug, description, order_index, target_roles, created_at, updated_at
     FROM manual_categories
     WHERE id::text = $1
     LIMIT 1`,
    [id]
  )

  if (!res.rows || res.rows.length === 0) return null
  const row = res.rows[0]
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    orderIndex: Number(row.order_index) || 0,
    targetRoles: Array.isArray(row.target_roles) ? row.target_roles : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createManualCategory(data: Partial<ManualCategory>): Promise<ManualCategory> {
  const id = uuidv4()
  const title = (data.title || '').trim()
  const slug = (data.slug || slugify(title)).trim()
  const description = data.description?.trim() || null
  const orderIndex = Number(data.orderIndex) || 0
  const targetRoles = Array.isArray(data.targetRoles) && data.targetRoles.length > 0
    ? data.targetRoles
    : ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']

  const res = await query(
    `INSERT INTO manual_categories (id, title, slug, description, order_index, target_roles)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, slug, description, order_index, target_roles, created_at, updated_at`,
    [id, title, slug, description, orderIndex, targetRoles]
  )

  const row = res.rows[0]
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    orderIndex: Number(row.order_index) || 0,
    targetRoles: row.target_roles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateManualCategory(id: string, data: Partial<ManualCategory>): Promise<ManualCategory> {
  const updates: string[] = []
  const params: any[] = []
  let paramIdx = 1

  if (data.title !== undefined) {
    updates.push(`title = $${paramIdx++}`)
    params.push(data.title.trim())
  }
  if (data.slug !== undefined) {
    updates.push(`slug = $${paramIdx++}`)
    params.push(data.slug.trim())
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIdx++}`)
    params.push(data.description ? data.description.trim() : null)
  }
  if (data.orderIndex !== undefined) {
    updates.push(`order_index = $${paramIdx++}`)
    params.push(Number(data.orderIndex) || 0)
  }
  if (data.targetRoles !== undefined) {
    updates.push(`target_roles = $${paramIdx++}`)
    params.push(data.targetRoles)
  }

  updates.push(`updated_at = NOW()`)
  params.push(id)

  const sql = `
    UPDATE manual_categories
    SET ${updates.join(', ')}
    WHERE id::text = $${paramIdx}
    RETURNING id, title, slug, description, order_index, target_roles, created_at, updated_at
  `

  const res = await query(sql, params)
  if (!res.rows || res.rows.length === 0) {
    throw new Error('Categoria de manual não encontrada.')
  }

  const row = res.rows[0]
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    orderIndex: Number(row.order_index) || 0,
    targetRoles: row.target_roles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function deleteManualCategory(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM manual_categories WHERE id::text = $1`, [id])
  return (res.rowCount || 0) > 0
}

// ============================================================================
// ARTIGOS / MANUAIS
// ============================================================================

export async function getManualArticles(options: {
  categoryId?: string | null
  userRole?: UserRole | null
  onlyPublished?: boolean
}): Promise<ManualArticle[]> {
  const { categoryId, userRole, onlyPublished = true } = options
  const isMaster = userRole === 'SUPER_ADMIN'

  let sql = `
    SELECT a.id, a.category_id, a.title, a.slug, a.summary, a.read_time_minutes, a.target_roles,
           a.order_index, a.published, a.steps, a.helpful_votes, a.unhelpful_votes, a.created_at, a.updated_at,
           c.title as category_title, c.slug as category_slug
    FROM manual_articles a
    LEFT JOIN manual_categories c ON a.category_id = c.id
    WHERE 1=1
  `
  const params: any[] = []
  let paramIdx = 1

  if (categoryId) {
    sql += ` AND a.category_id::text = $${paramIdx++}`
    params.push(categoryId)
  }

  if (onlyPublished && !isMaster) {
    sql += ` AND a.published = true`
  }

  if (!isMaster && userRole) {
    sql += ` AND $${paramIdx++} = ANY(a.target_roles)`
    params.push(userRole)
  }

  sql += ` ORDER BY c.order_index ASC, a.order_index ASC, a.title ASC`

  const res = await query(sql, params)

  return (res.rows || []).map((row: any) => ({
    id: row.id,
    categoryId: row.category_id,
    categoryTitle: row.category_title,
    categorySlug: row.category_slug,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    readTimeMinutes: Number(row.read_time_minutes) || 3,
    targetRoles: Array.isArray(row.target_roles) ? row.target_roles : [],
    orderIndex: Number(row.order_index) || 0,
    published: Boolean(row.published),
    steps: Array.isArray(row.steps) ? row.steps : [],
    helpfulVotes: Number(row.helpful_votes) || 0,
    unhelpfulVotes: Number(row.unhelpful_votes) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getManualArticleById(id: string): Promise<ManualArticle | null> {
  const res = await query(
    `SELECT a.id, a.category_id, a.title, a.slug, a.summary, a.read_time_minutes, a.target_roles,
            a.order_index, a.published, a.steps, a.helpful_votes, a.unhelpful_votes, a.created_at, a.updated_at,
            c.title as category_title, c.slug as category_slug
     FROM manual_articles a
     LEFT JOIN manual_categories c ON a.category_id = c.id
     WHERE a.id::text = $1
     LIMIT 1`,
    [id]
  )

  if (!res.rows || res.rows.length === 0) return null
  const row = res.rows[0]
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryTitle: row.category_title,
    categorySlug: row.category_slug,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    readTimeMinutes: Number(row.read_time_minutes) || 3,
    targetRoles: Array.isArray(row.target_roles) ? row.target_roles : [],
    orderIndex: Number(row.order_index) || 0,
    published: Boolean(row.published),
    steps: Array.isArray(row.steps) ? row.steps : [],
    helpfulVotes: Number(row.helpful_votes) || 0,
    unhelpfulVotes: Number(row.unhelpful_votes) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getManualArticleBySlug(
  categorySlug: string,
  articleSlug: string,
  userRole?: UserRole | null
): Promise<ManualArticle | null> {
  const isMaster = userRole === 'SUPER_ADMIN'
  let sql = `
    SELECT a.id, a.category_id, a.title, a.slug, a.summary, a.read_time_minutes, a.target_roles,
           a.order_index, a.published, a.steps, a.helpful_votes, a.unhelpful_votes, a.created_at, a.updated_at,
           c.title as category_title, c.slug as category_slug
    FROM manual_articles a
    JOIN manual_categories c ON a.category_id = c.id
    WHERE c.slug = $1 AND a.slug = $2
  `
  const params: any[] = [categorySlug, articleSlug]

  if (!isMaster) {
    sql += ` AND a.published = true`
    if (userRole) {
      sql += ` AND $3 = ANY(a.target_roles)`
      params.push(userRole)
    }
  }

  sql += ` LIMIT 1`

  const res = await query(sql, params)
  if (!res.rows || res.rows.length === 0) return null
  const row = res.rows[0]

  return {
    id: row.id,
    categoryId: row.category_id,
    categoryTitle: row.category_title,
    categorySlug: row.category_slug,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    readTimeMinutes: Number(row.read_time_minutes) || 3,
    targetRoles: Array.isArray(row.target_roles) ? row.target_roles : [],
    orderIndex: Number(row.order_index) || 0,
    published: Boolean(row.published),
    steps: Array.isArray(row.steps) ? row.steps : [],
    helpfulVotes: Number(row.helpful_votes) || 0,
    unhelpfulVotes: Number(row.unhelpful_votes) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createManualArticle(data: Partial<ManualArticle>): Promise<ManualArticle> {
  const id = uuidv4()
  const categoryId = data.categoryId
  if (!categoryId) {
    throw new Error('A categoria do manual é obrigatória.')
  }

  const title = (data.title || '').trim()
  const slug = (data.slug || slugify(title)).trim()
  const summary = data.summary?.trim() || null
  const readTimeMinutes = Number(data.readTimeMinutes) || 3
  const targetRoles = Array.isArray(data.targetRoles) && data.targetRoles.length > 0
    ? data.targetRoles
    : ['CASHIER', 'TENANT_ADMIN', 'FRANCHISOR_ADMIN', 'SUPER_ADMIN']
  const orderIndex = Number(data.orderIndex) || 0
  const published = data.published !== undefined ? Boolean(data.published) : true
  const steps = Array.isArray(data.steps) ? data.steps : []

  const res = await query(
    `INSERT INTO manual_articles (id, category_id, title, slug, summary, read_time_minutes, target_roles, order_index, published, steps)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, category_id, title, slug, summary, read_time_minutes, target_roles, order_index, published, steps, helpful_votes, unhelpful_votes, created_at, updated_at`,
    [id, categoryId, title, slug, summary, readTimeMinutes, targetRoles, orderIndex, published, JSON.stringify(steps)]
  )

  const row = res.rows[0]
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    readTimeMinutes: Number(row.read_time_minutes) || 3,
    targetRoles: row.target_roles,
    orderIndex: Number(row.order_index) || 0,
    published: Boolean(row.published),
    steps: row.steps || [],
    helpfulVotes: Number(row.helpful_votes) || 0,
    unhelpfulVotes: Number(row.unhelpful_votes) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateManualArticle(id: string, data: Partial<ManualArticle>): Promise<ManualArticle> {
  const updates: string[] = []
  const params: any[] = []
  let paramIdx = 1

  if (data.categoryId !== undefined) {
    updates.push(`category_id = $${paramIdx++}`)
    params.push(data.categoryId)
  }
  if (data.title !== undefined) {
    updates.push(`title = $${paramIdx++}`)
    params.push(data.title.trim())
  }
  if (data.slug !== undefined) {
    updates.push(`slug = $${paramIdx++}`)
    params.push(data.slug.trim())
  }
  if (data.summary !== undefined) {
    updates.push(`summary = $${paramIdx++}`)
    params.push(data.summary ? data.summary.trim() : null)
  }
  if (data.readTimeMinutes !== undefined) {
    updates.push(`read_time_minutes = $${paramIdx++}`)
    params.push(Number(data.readTimeMinutes) || 3)
  }
  if (data.targetRoles !== undefined) {
    updates.push(`target_roles = $${paramIdx++}`)
    params.push(data.targetRoles)
  }
  if (data.orderIndex !== undefined) {
    updates.push(`order_index = $${paramIdx++}`)
    params.push(Number(data.orderIndex) || 0)
  }
  if (data.published !== undefined) {
    updates.push(`published = $${paramIdx++}`)
    params.push(Boolean(data.published))
  }
  if (data.steps !== undefined) {
    updates.push(`steps = $${paramIdx++}`)
    params.push(JSON.stringify(data.steps))
  }

  updates.push(`updated_at = NOW()`)
  params.push(id)

  const sql = `
    UPDATE manual_articles
    SET ${updates.join(', ')}
    WHERE id::text = $${paramIdx}
    RETURNING id, category_id, title, slug, summary, read_time_minutes, target_roles, order_index, published, steps, helpful_votes, unhelpful_votes, created_at, updated_at
  `

  const res = await query(sql, params)
  if (!res.rows || res.rows.length === 0) {
    throw new Error('Artigo de manual não encontrado.')
  }

  const row = res.rows[0]
  return {
    id: row.id,
    categoryId: row.category_id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    readTimeMinutes: Number(row.read_time_minutes) || 3,
    targetRoles: row.target_roles,
    orderIndex: Number(row.order_index) || 0,
    published: Boolean(row.published),
    steps: row.steps || [],
    helpfulVotes: Number(row.helpful_votes) || 0,
    unhelpfulVotes: Number(row.unhelpful_votes) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function deleteManualArticle(id: string): Promise<boolean> {
  const res = await query(`DELETE FROM manual_articles WHERE id::text = $1`, [id])
  return (res.rowCount || 0) > 0
}

export async function voteManualFeedback(id: string, isHelpful: boolean): Promise<{ helpfulVotes: number; unhelpfulVotes: number }> {
  const col = isHelpful ? 'helpful_votes' : 'unhelpful_votes'
  const res = await query(
    `UPDATE manual_articles
     SET ${col} = COALESCE(${col}, 0) + 1,
         updated_at = NOW()
     WHERE id::text = $1
     RETURNING helpful_votes, unhelpful_votes`,
    [id]
  )

  if (!res.rows || res.rows.length === 0) {
    throw new Error('Artigo de manual não encontrado.')
  }

  return {
    helpfulVotes: Number(res.rows[0].helpful_votes) || 0,
    unhelpfulVotes: Number(res.rows[0].unhelpful_votes) || 0,
  }
}

export async function searchManuals(searchTerm: string, userRole?: UserRole | null): Promise<Array<{
  id: string
  title: string
  slug: string
  summary: string | null
  categoryTitle: string
  categorySlug: string
  matchType: 'TITLE' | 'SUMMARY' | 'STEP'
  matchedStepNumber?: number
  matchedStepTitle?: string
}>> {
  const cleanTerm = (searchTerm || '').trim()
  if (!cleanTerm) return []

  const isMaster = userRole === 'SUPER_ADMIN'
  const pattern = `%${cleanTerm}%`

  let sql = `
    SELECT a.id, a.title, a.slug, a.summary, a.steps,
           c.title as category_title, c.slug as category_slug
    FROM manual_articles a
    JOIN manual_categories c ON a.category_id = c.id
    WHERE a.published = true
      AND (
        a.title ILIKE $1
        OR a.summary ILIKE $1
        OR c.title ILIKE $1
        OR a.steps::text ILIKE $1
      )
  `
  const params: any[] = [pattern]

  if (!isMaster && userRole) {
    sql += ` AND $2 = ANY(a.target_roles)`
    params.push(userRole)
  }

  sql += ` LIMIT 15`

  const res = await query(sql, params)
  const results: any[] = []

  for (const row of res.rows || []) {
    let matchType: 'TITLE' | 'SUMMARY' | 'STEP' = 'TITLE'
    let matchedStepNumber: number | undefined
    let matchedStepTitle: string | undefined

    if (row.title.toLowerCase().includes(cleanTerm.toLowerCase())) {
      matchType = 'TITLE'
    } else if (row.summary && row.summary.toLowerCase().includes(cleanTerm.toLowerCase())) {
      matchType = 'SUMMARY'
    } else if (Array.isArray(row.steps)) {
      const foundStep = row.steps.find((s: ManualStep) =>
        s.title?.toLowerCase().includes(cleanTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(cleanTerm.toLowerCase())
      )
      if (foundStep) {
        matchType = 'STEP'
        matchedStepNumber = foundStep.step_number
        matchedStepTitle = foundStep.title
      }
    }

    results.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      categoryTitle: row.category_title,
      categorySlug: row.category_slug,
      matchType,
      matchedStepNumber,
      matchedStepTitle,
    })
  }

  return results
}
