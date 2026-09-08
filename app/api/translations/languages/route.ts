import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')

    let targetTenantId: string | null = null
    if (rawTenant && rawTenant !== 'all' && rawTenant !== 'ALL') {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) targetTenantId = t.id
      else targetTenantId = rawTenant
    }

    let sql = `
      SELECT 
        c.tenant_id,
        c.language_code,
        c.name,
        c.flag_emoji,
        c.is_active,
        c.is_default,
        t.name as store_name
      FROM store_languages_config c
      LEFT JOIN tenants t ON t.id = c.tenant_id
    `
    const params: any[] = []

    if (targetTenantId) {
      sql += ` WHERE c.tenant_id = $1`
      params.push(targetTenantId)
    }

    sql += ` ORDER BY c.tenant_id, c.is_default DESC, c.name ASC`

    const res = await query(sql, params)
    return NextResponse.json({ success: true, languages: res.rows || [] })
  } catch (err: any) {
    console.error('Erro em GET /api/translations/languages:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao buscar configurações de idiomas' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FRANCHISOR_ADMIN')) {
      return NextResponse.json(
        { error: 'Apenas a Franqueadora Master ou Admin TI pode alterar a ativação de idiomas.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { tenantId: rawTenantId, languageCode, isActive, applyToAllStores } = body

    if (!languageCode) {
      return NextResponse.json({ error: 'Código de idioma é obrigatório.' }, { status: 400 })
    }

    if (languageCode === 'pt' && isActive === false) {
      return NextResponse.json(
        { error: 'O idioma principal Português (PT) não pode ser desativado.' },
        { status: 400 }
      )
    }

    if (applyToAllStores) {
      await query(
        `UPDATE store_languages_config SET is_active = $1 WHERE language_code = $2`,
        [Boolean(isActive), languageCode]
      )
    } else {
      if (!rawTenantId) {
        return NextResponse.json({ error: 'Loja é obrigatória quando não aplicado a todas.' }, { status: 400 })
      }
      let tenantId = rawTenantId
      const t = await getTenantByIdOrSlug(rawTenantId)
      if (t) tenantId = t.id

      await query(
        `UPDATE store_languages_config SET is_active = $1 WHERE tenant_id = $2 AND language_code = $3`,
        [Boolean(isActive), tenantId, languageCode]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração de idioma atualizada com sucesso.',
    })
  } catch (err: any) {
    console.error('Erro em PUT /api/translations/languages:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao salvar configuração de idioma' },
      { status: 500 }
    )
  }
}
