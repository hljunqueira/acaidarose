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

export async function voteManualFeedback(
  id: string,
  isHelpful: boolean,
  feedbackData?: {
    userId?: string | null
    userName?: string | null
    userRole?: string | null
    tenantId?: string | null
    suggestionText?: string | null
  }
): Promise<{ helpfulVotes: number; unhelpfulVotes: number; feedbackId?: string }> {
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

  let feedbackId: string | undefined
  const isUUID = (str?: string | null) =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))

  const safeUserId = isUUID(feedbackData?.userId) ? feedbackData?.userId : null
  const safeTenantId = isUUID(feedbackData?.tenantId) ? feedbackData?.tenantId : null

  try {
    const feedbackRes = await query(
      `INSERT INTO manual_feedback_suggestions (
        article_id, user_id, user_name, user_role, tenant_id, is_helpful, suggestion_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        id,
        safeUserId,
        feedbackData?.userName || null,
        feedbackData?.userRole || null,
        safeTenantId,
        isHelpful,
        feedbackData?.suggestionText?.trim() || null,
      ]
    )
    if (feedbackRes.rows?.[0]) {
      feedbackId = feedbackRes.rows[0].id
    }
  } catch (err) {
    console.error('Aviso: falha ao gravar em manual_feedback_suggestions:', err)
  }

  return {
    helpfulVotes: Number(res.rows[0].helpful_votes) || 0,
    unhelpfulVotes: Number(res.rows[0].unhelpful_votes) || 0,
    feedbackId,
  }
}

export async function getManualFeedbackMetrics(): Promise<{
  totalVotes: number
  helpfulVotes: number
  unhelpfulVotes: number
  helpfulPercentage: number
  pendingSuggestionsCount: number
  suggestions: any[]
  lowestRatedArticles: any[]
}> {
  // 1. Totais consolidados
  const totalsRes = await query(`
    SELECT
      COALESCE(SUM(helpful_votes), 0) as total_helpful,
      COALESCE(SUM(unhelpful_votes), 0) as total_unhelpful,
      (COALESCE(SUM(helpful_votes), 0) + COALESCE(SUM(unhelpful_votes), 0)) as total_votes
    FROM manual_articles
  `)

  const row = totalsRes.rows?.[0] || {}
  const helpfulVotes = Number(row.total_helpful) || 0
  const unhelpfulVotes = Number(row.total_unhelpful) || 0
  const totalVotes = Number(row.total_votes) || 0
  const helpfulPercentage = totalVotes > 0 ? Math.round((helpfulVotes / totalVotes) * 100) : 100

  // 2. Contagem de sugestões pendentes
  const pendingRes = await query(`
    SELECT COUNT(*) as count
    FROM manual_feedback_suggestions
    WHERE status = 'PENDING' AND suggestion_text IS NOT NULL
  `)
  const pendingSuggestionsCount = Number(pendingRes.rows?.[0]?.count) || 0

  // 3. Lista completa de avaliações e sugestões dos utilizadores
  const suggestionsRes = await query(`
    SELECT
      f.id,
      f.article_id,
      f.user_id,
      f.user_name,
      f.user_role,
      f.tenant_id,
      f.is_helpful,
      f.suggestion_text,
      f.status,
      f.created_at,
      a.title as article_title,
      c.title as category_title,
      t.name as tenant_name
    FROM manual_feedback_suggestions f
    JOIN manual_articles a ON a.id = f.article_id
    LEFT JOIN manual_categories c ON c.id = a.category_id
    LEFT JOIN tenants t ON t.id = f.tenant_id
    ORDER BY f.created_at DESC
    LIMIT 150
  `)

  // 4. Artigos com mais dúvidas / menor aprovação (incluindo últimos votantes agregados)
  const lowestRatedRes = await query(`
    SELECT
      a.id,
      a.title,
      c.title as category_title,
      a.helpful_votes,
      a.unhelpful_votes,
      (a.helpful_votes + a.unhelpful_votes) as total_votes,
      ROUND((a.helpful_votes::float / NULLIF(a.helpful_votes + a.unhelpful_votes, 0) * 100)::numeric, 0) as approval_rate,
      (
        SELECT COALESCE(json_agg(json_build_object(
          'id', f.id,
          'user_name', f.user_name,
          'user_role', f.user_role,
          'is_helpful', f.is_helpful,
          'suggestion_text', f.suggestion_text,
          'created_at', f.created_at
        )), '[]'::json)
        FROM (
          SELECT id, user_name, user_role, is_helpful, suggestion_text, created_at
          FROM manual_feedback_suggestions
          WHERE article_id = a.id
          ORDER BY created_at DESC
          LIMIT 5
        ) f
      ) as recent_voters
    FROM manual_articles a
    LEFT JOIN manual_categories c ON c.id = a.category_id
    WHERE (a.helpful_votes + a.unhelpful_votes) > 0
    ORDER BY a.unhelpful_votes DESC, a.helpful_votes ASC
    LIMIT 15
  `)

  return {
    totalVotes,
    helpfulVotes,
    unhelpfulVotes,
    helpfulPercentage,
    pendingSuggestionsCount,
    suggestions: suggestionsRes.rows || [],
    lowestRatedArticles: lowestRatedRes.rows || [],
  }
}

export async function deleteFeedbackSuggestion(id: string): Promise<boolean> {
  const check = await query(`SELECT article_id, is_helpful FROM manual_feedback_suggestions WHERE id::text = $1`, [id])
  if (check.rows?.[0]) {
    const { article_id, is_helpful } = check.rows[0]
    const col = is_helpful ? 'helpful_votes' : 'unhelpful_votes'
    await query(`UPDATE manual_articles SET ${col} = GREATEST(COALESCE(${col}, 0) - 1, 0) WHERE id = $1`, [article_id])
  }
  const res = await query(`DELETE FROM manual_feedback_suggestions WHERE id::text = $1`, [id])
  return (res.rowCount || 0) > 0
}

export async function resetArticleVotes(articleId: string): Promise<boolean> {
  await query(
    `UPDATE manual_articles
     SET helpful_votes = 0, unhelpful_votes = 0, updated_at = NOW()
     WHERE id::text = $1`,
    [articleId]
  )
  await query(`DELETE FROM manual_feedback_suggestions WHERE article_id::text = $1`, [articleId])
  return true
}

export async function updateFeedbackSuggestionStatus(id: string, status: string): Promise<boolean> {
  const res = await query(
    `UPDATE manual_feedback_suggestions
     SET status = $1, updated_at = NOW()
     WHERE id::text = $2`,
    [status, id]
  )
  return (res.rowCount || 0) > 0
}

export async function updateFeedbackSuggestionText(id: string, text: string): Promise<boolean> {
  const res = await query(
    `UPDATE manual_feedback_suggestions
     SET suggestion_text = $1
     WHERE id::text = $2`,
    [text.trim(), id]
  )
  return (res.rowCount || 0) > 0
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
