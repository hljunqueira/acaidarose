import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { tenantId: rawTenantId, active } = body

    if (!rawTenantId) {
      return NextResponse.json({ error: 'Identificador da loja é obrigatório.' }, { status: 400 })
    }

    // Resolver ID canônico do tenant
    let targetTenantId = rawTenantId
    const t = await getTenantByIdOrSlug(rawTenantId)
    if (t) targetTenantId = t.id

    // Verificar se a pesquisa existe
    const surveyCheck = await query(
      `SELECT id, active_stores FROM satisfaction_surveys WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )
    if (!surveyCheck.rows || surveyCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Pesquisa não encontrada.' }, { status: 404 })
    }

    let currentStores: string[] = Array.isArray(surveyCheck.rows[0].active_stores)
      ? surveyCheck.rows[0].active_stores
      : []

    if (active) {
      // 1. Regra de Exclusividade: Desativar esta loja de qualquer outra pesquisa
      await query(
        `
        UPDATE satisfaction_surveys
        SET active_stores = (
          SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
          FROM jsonb_array_elements_text(active_stores) elem
          WHERE elem != $1
        ),
        updated_at = timezone('utc'::text, now())
        WHERE deleted_at IS NULL AND id != $2
        `,
        [targetTenantId, id]
      )

      // 2. Adicionar nesta pesquisa caso ainda não esteja
      if (!currentStores.includes(targetTenantId)) {
        currentStores.push(targetTenantId)
      }
    } else {
      // Remover desta pesquisa
      currentStores = currentStores.filter((sid) => sid !== targetTenantId)
    }

    // Salvar na pesquisa atual
    const updateRes = await query(
      `
      UPDATE satisfaction_surveys
      SET active_stores = $1, updated_at = timezone('utc'::text, now())
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING active_stores
      `,
      [JSON.stringify(currentStores), id]
    )

    const updatedStores = updateRes.rows[0]?.active_stores || []

    return NextResponse.json({
      success: true,
      active_stores: Array.isArray(updatedStores) ? updatedStores : [],
      message: active ? 'Pesquisa ativada para a loja com sucesso.' : 'Pesquisa desativada da loja com sucesso.',
    })
  } catch (err: any) {
    console.error('Erro em POST /api/surveys/[id]/toggle:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao alterar ativação da pesquisa' },
      { status: 500 }
    )
  }
}
