import { query } from '@/lib/db/postgres'

export interface CreateAuditLogParams {
  tenantId?: string | null
  userId?: string | null
  authorName?: string | null
  userRole?: string | null
  action: string
  entity: string
  entityId?: string | null
  message: string
  metadata?: Record<string, any>
  level?: 'INFO' | 'WARN' | 'ERROR'
}

export interface AuditLogRecord {
  id: string
  tenant_id: string | null
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, any> | null
  created_at: string
}

/**
 * Registra um evento de auditoria no PostgreSQL
 */
export async function recordAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const tenantId = params.tenantId || null
    const userId = params.userId && params.userId !== 'anonymous' && params.userId.length === 36 ? params.userId : null
    const authorName = params.authorName || 'Henrique Linhares Junqueira'
    const userRole = params.userRole || 'ADMIN_MATRIZ'
    const level = params.level || 'INFO'

    const meta = {
      author: authorName,
      role: userRole,
      level,
      message: params.message,
      ...(params.metadata || {}),
      recordedAt: new Date().toISOString(),
    }

    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity, entity_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())`,
      [
        tenantId,
        userId,
        params.action,
        params.entity,
        params.entityId || null,
        JSON.stringify(meta),
      ]
    )
  } catch (err) {
    // Log silencioso para nunca travar requisições principais do usuário
    console.error('Erro ao gravar log de auditoria:', err)
  }
}

/**
 * Consulta os logs de auditoria mais recentes enriquecidos com informações da loja e autor
 */
export async function getAuditLogs(options?: {
  tenantId?: string
  entity?: string
  level?: string
  limit?: number
  search?: string
}): Promise<any[]> {
  try {
    const limit = options?.limit || 100
    const params: any[] = [limit]
    let whereClauses: string[] = []

    if (options?.tenantId && options.tenantId !== 'all') {
      params.push(options.tenantId)
      whereClauses.push(`a.tenant_id::text = $${params.length}`)
    }

    if (options?.entity && options.entity !== 'ALL') {
      params.push(options.entity)
      whereClauses.push(`a.entity = $${params.length}`)
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const sql = `
      SELECT 
        a.id,
        a.tenant_id,
        a.user_id,
        a.action,
        a.entity,
        a.entity_id,
        a.metadata,
        a.created_at,
        t.name as tenant_name,
        t.slug as tenant_slug
      FROM audit_logs a
      LEFT JOIN tenants t ON t.id = a.tenant_id
      ${whereStr}
      ORDER BY a.created_at DESC
      LIMIT $1
    `

    const res = await query(sql, params)

    return (res.rows || []).map((row: any) => {
      const meta = row.metadata || {}
      const author = meta.author || 'Henrique Linhares Junqueira'
      const role = meta.role || 'ADMIN'
      const level = meta.level || 'INFO'
      const message = meta.message || `${row.action} em ${row.entity}`
      const tenantName = row.tenant_name || (row.tenant_id?.startsWith('11111111') ? 'Loja 1 - Aveiro' : row.tenant_id?.startsWith('22222222') ? 'Loja 2 - Torres Novas' : 'Franqueadora Master')

      return {
        id: row.id,
        timestamp: new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 19),
        level,
        scope: row.entity || 'SISTEMA',
        action: row.action,
        message,
        author,
        role,
        tenant: tenantName,
        tenantId: row.tenant_id,
        entityId: row.entity_id,
        metadata: meta,
      }
    })
  } catch (err) {
    console.error('Erro ao consultar logs de auditoria:', err)
    return []
  }
}
