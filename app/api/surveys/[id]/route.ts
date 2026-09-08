import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const sql = `
      SELECT 
        s.id,
        s.title,
        s.description,
        s.translations,
        s.active_stores,
        s.questions,
        COALESCE(s.survey_type, 'CUSTOM') as survey_type,
        s.created_at,
        s.updated_at,
        COALESCE(COUNT(r.id), 0)::int AS total_responses
      FROM satisfaction_surveys s
      LEFT JOIN satisfaction_survey_responses r ON r.survey_id = s.id
      WHERE s.id = $1 AND s.deleted_at IS NULL
      GROUP BY s.id
    `
    const res = await query(sql, [id])
    if (!res.rows || res.rows.length === 0) {
      return NextResponse.json({ error: 'Pesquisa não encontrada.' }, { status: 404 })
    }

    const row = res.rows[0]
    return NextResponse.json({
      success: true,
      survey: {
        ...row,
        survey_type: row.survey_type || 'CUSTOM',
        active_stores: Array.isArray(row.active_stores) ? row.active_stores : [],
        questions: Array.isArray(row.questions) ? row.questions : [],
        translations: row.translations || {},
      },
    })
  } catch (err: any) {
    console.error('Erro em GET /api/surveys/[id]:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar pesquisa' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description = '', questions, active_stores, translations, survey_type } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'O título da pesquisa é obrigatório.' }, { status: 400 })
    }

    if (questions && (!Array.isArray(questions) || questions.length === 0 || questions.length > 10)) {
      return NextResponse.json({ error: 'A pesquisa deve conter entre 1 e 10 perguntas.' }, { status: 400 })
    }

    const targetStores: string[] | undefined = Array.isArray(active_stores) ? active_stores : undefined

    // Se lojas ativas foram alteradas, desativa essas lojas em qualquer outro modelo
    if (targetStores && targetStores.length > 0) {
      for (const storeId of targetStores) {
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
          [storeId, id]
        )
      }
    }

    const updateSql = `
      UPDATE satisfaction_surveys
      SET 
        title = $1,
        description = $2,
        questions = COALESCE($3, questions),
        active_stores = COALESCE($4, active_stores),
        translations = COALESCE($5, translations),
        survey_type = COALESCE($6, survey_type),
        updated_at = timezone('utc'::text, now())
      WHERE id = $7 AND deleted_at IS NULL
      RETURNING *
    `

    const res = await query(updateSql, [
      title.trim(),
      description.trim(),
      questions ? JSON.stringify(questions) : null,
      targetStores ? JSON.stringify(targetStores) : null,
      translations ? JSON.stringify(translations) : null,
      survey_type || null,
      id,
    ])

    if (!res.rows || res.rows.length === 0) {
      return NextResponse.json({ error: 'Pesquisa não encontrada ou excluída.' }, { status: 404 })
    }

    const updated = res.rows[0]
    return NextResponse.json({
      success: true,
      survey: {
        ...updated,
        survey_type: updated.survey_type || 'CUSTOM',
        active_stores: Array.isArray(updated.active_stores) ? updated.active_stores : [],
        questions: Array.isArray(updated.questions) ? updated.questions : [],
        translations: updated.translations || {},
      },
    })
  } catch (err: any) {
    console.error('Erro em PUT /api/surveys/[id]:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao atualizar pesquisa' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const deleteSql = `
      UPDATE satisfaction_surveys
      SET 
        deleted_at = timezone('utc'::text, now()),
        active_stores = '[]'::jsonb,
        updated_at = timezone('utc'::text, now())
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `
    const res = await query(deleteSql, [id])

    if (!res.rows || res.rows.length === 0) {
      return NextResponse.json({ error: 'Pesquisa não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Pesquisa excluída com sucesso.' })
  } catch (err: any) {
    console.error('Erro em DELETE /api/surveys/[id]:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao excluir pesquisa' },
      { status: 500 }
    )
  }
}
