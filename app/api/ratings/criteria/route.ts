import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { getAuthUser } from '@/lib/api/authGuard'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ratings/criteria?loja=...
 * Retorna os critérios de avaliação da loja ou os globais se a loja ainda não tiver customizado.
 */
export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')

    let targetTenantId: string | null = null
    if (rawTenant && rawTenant !== 'all' && rawTenant !== 'global') {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) targetTenantId = t.id
      else targetTenantId = rawTenant
    }

    let criteria: any[] = []
    let isStoreCustom = false

    // 1. Tentar buscar critérios específicos criados pela loja
    if (targetTenantId) {
      const storeRes = await query(
        `SELECT id, tenant_id, code, title, title_en, title_es, display_order, active, created_at
         FROM customer_rating_criteria
         WHERE tenant_id = $1
         ORDER BY display_order ASC, created_at ASC`,
        [targetTenantId]
      )

      if (storeRes.rows && storeRes.rows.length > 0) {
        criteria = storeRes.rows
        isStoreCustom = true
      }
    }

    // 2. Se a loja não tiver critérios próprios ou tenantId for global/null, buscar os globais da Franqueadora
    if (criteria.length === 0) {
      const globalRes = await query(
        `SELECT id, tenant_id, code, title, title_en, title_es, display_order, active, created_at
         FROM customer_rating_criteria
         WHERE tenant_id IS NULL
         ORDER BY display_order ASC, created_at ASC`
      )
      criteria = globalRes.rows || []
    }

    return NextResponse.json({
      success: true,
      isStoreCustom,
      criteria: criteria.map((c: any) => ({
        id: c.id,
        tenantId: c.tenant_id,
        code: c.code,
        title: c.title,
        name: c.title, // Retrocompatibilidade de nomenclatura
        titleEn: c.title_en || null,
        nameEn: c.title_en || null,
        titleEs: c.title_es || null,
        nameEs: c.title_es || null,
        scaleType: 'STARS_5',
        displayOrder: c.display_order,
        active: c.active !== false,
        createdAt: c.created_at,
      })),
    })
  } catch (err: any) {
    console.error('Erro em GET /api/ratings/criteria:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao consultar critérios' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ratings/criteria
 * Criação unitária ou salvamento em lote (batch) de critérios para a loja.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    const body = await req.json()

    const rawTenant = body.tenantId || body.loja || req.nextUrl.searchParams.get('loja')
    let targetTenantId: string | null = null

    if (rawTenant && rawTenant !== 'global') {
      const t = await getTenantByIdOrSlug(rawTenant)
      targetTenantId = t ? t.id : rawTenant
    } else if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'FRANCHISOR_ADMIN') {
      targetTenantId = user.tenantId || null
    }

    // A) MODO BATCH: { tenantId, criteria: [ ... ] }
    if (Array.isArray(body.criteria)) {
      const incomingList = body.criteria

      // 1. Apagar critérios antigos específicos desta loja para substituir pelo novo conjunto
      if (targetTenantId) {
        await query(`DELETE FROM customer_rating_criteria WHERE tenant_id = $1`, [targetTenantId])
      } else {
        await query(`DELETE FROM customer_rating_criteria WHERE tenant_id IS NULL`)
      }

      // 2. Inserir os critérios atualizados
      const savedCriteria = []
      for (let i = 0; i < incomingList.length; i++) {
        const item = incomingList[i]
        const id = item.id && !item.id.startsWith('temp_') ? item.id : uuidv4()
        const title = (item.title || item.name || '').trim()
        if (!title) continue

        const code =
          item.code ||
          title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .slice(0, 30)
        const titleEn = item.titleEn || item.nameEn || null
        const titleEs = item.titleEs || item.nameEs || null
        const displayOrder = item.displayOrder !== undefined ? item.displayOrder : i + 1
        const active = item.active !== false

        await query(
          `INSERT INTO customer_rating_criteria (id, tenant_id, code, title, title_en, title_es, display_order, active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, targetTenantId, code, title, titleEn, titleEs, displayOrder, active]
        )

        savedCriteria.push({
          id,
          tenantId: targetTenantId,
          code,
          title,
          name: title,
          titleEn,
          nameEn: titleEn,
          titleEs,
          nameEs: titleEs,
          displayOrder,
          active,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Critérios guardados com sucesso',
        criteria: savedCriteria,
      })
    }

    // B) MODO UNITÁRIO: Criar ou atualizar um critério individual
    const title = (body.title || body.name || '').trim()
    if (!title) {
      return NextResponse.json({ error: 'Título do critério é obrigatório' }, { status: 400 })
    }

    const code =
      body.code ||
      title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .slice(0, 30)
    const titleEn = body.titleEn || body.nameEn || null
    const titleEs = body.titleEs || body.nameEs || null
    const displayOrder = body.displayOrder !== undefined ? Number(body.displayOrder) : 1
    const active = body.active !== false
    const id = body.id || uuidv4()

    const existing = await query(
      `SELECT id FROM customer_rating_criteria WHERE id = $1`,
      [id]
    )

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO customer_rating_criteria (id, tenant_id, code, title, title_en, title_es, display_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, targetTenantId, code, title, titleEn, titleEs, displayOrder, active]
      )
    } else {
      await query(
        `UPDATE customer_rating_criteria
         SET title = $2, title_en = $3, title_es = $4, code = $5, display_order = $6, active = $7
         WHERE id = $1`,
        [id, title, titleEn, titleEs, code, displayOrder, active]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Critério guardado com sucesso',
      criterion: {
        id,
        tenantId: targetTenantId,
        code,
        title,
        name: title,
        titleEn,
        nameEn: titleEn,
        titleEs,
        nameEs: titleEs,
        displayOrder,
        active,
      },
    })
  } catch (err: any) {
    console.error('Erro em POST /api/ratings/criteria:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao guardar critério' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ratings/criteria
 * Atualiza campos de um critério específico por ID.
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, title, titleEn, titleEs, code, displayOrder, active } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do critério é obrigatório' }, { status: 400 })
    }

    const currentRes = await query(`SELECT * FROM customer_rating_criteria WHERE id = $1`, [id])
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Critério não encontrado' }, { status: 404 })
    }

    const current = currentRes.rows[0]
    const updatedTitle = title !== undefined ? title.trim() : current.title
    const updatedTitleEn = titleEn !== undefined ? titleEn : current.title_en
    const updatedTitleEs = titleEs !== undefined ? titleEs : current.title_es
    const updatedCode = code !== undefined ? code.trim() : current.code
    const updatedOrder = displayOrder !== undefined ? Number(displayOrder) : current.display_order
    const updatedActive = active !== undefined ? Boolean(active) : current.active

    await query(
      `UPDATE customer_rating_criteria
       SET title = $2, title_en = $3, title_es = $4, code = $5, display_order = $6, active = $7
       WHERE id = $1`,
      [id, updatedTitle, updatedTitleEn, updatedTitleEs, updatedCode, updatedOrder, updatedActive]
    )

    return NextResponse.json({
      success: true,
      message: 'Critério atualizado com sucesso',
      criterion: {
        id,
        tenantId: current.tenant_id,
        code: updatedCode,
        title: updatedTitle,
        name: updatedTitle,
        titleEn: updatedTitleEn,
        nameEn: updatedTitleEn,
        titleEs: updatedTitleEs,
        nameEs: updatedTitleEs,
        displayOrder: updatedOrder,
        active: updatedActive,
      },
    })
  } catch (err: any) {
    console.error('Erro em PUT /api/ratings/criteria:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao atualizar critério' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ratings/criteria?id=...&loja=...
 * Elimina um critério pelo ID.
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID do critério é obrigatório' }, { status: 400 })
    }

    await query(`DELETE FROM customer_rating_criteria WHERE id = $1`, [id])

    return NextResponse.json({
      success: true,
      message: 'Critério eliminado com sucesso',
    })
  } catch (err: any) {
    console.error('Erro em DELETE /api/ratings/criteria:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao eliminar critério' },
      { status: 500 }
    )
  }
}
