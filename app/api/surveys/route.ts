import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    // Listar modelos não excluídos
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
      WHERE s.deleted_at IS NULL
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `

    const res = await query(sql)
    const surveys = (res.rows || []).map((row: any) => ({
      ...row,
      survey_type: row.survey_type || 'CUSTOM',
      active_stores: Array.isArray(row.active_stores) ? row.active_stores : [],
      questions: Array.isArray(row.questions) ? row.questions : [],
      translations: row.translations || {},
    }))

    return NextResponse.json({ success: true, surveys })
  } catch (err: any) {
    console.error('Erro em GET /api/surveys:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao buscar pesquisas de satisfação' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description = '', questions = [], active_stores = [], translations = {}, survey_type = 'CUSTOM' } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'O título da pesquisa é obrigatório.' }, { status: 400 })
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'A pesquisa deve conter pelo menos 1 pergunta.' }, { status: 400 })
    }

    if (questions.length > 10) {
      return NextResponse.json({ error: 'A pesquisa pode ter no máximo 10 perguntas.' }, { status: 400 })
    }

    const newId = uuidv4()
    const targetStores: string[] = Array.isArray(active_stores) ? active_stores : []

    // Regra de Exclusividade: se houver lojas ativadas nesta nova pesquisa,
    // desativa essas lojas em qualquer outra pesquisa existente
    if (targetStores.length > 0) {
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
          WHERE deleted_at IS NULL
          `,
          [storeId]
        )
      }
    }

    const insertSql = `
      INSERT INTO satisfaction_surveys (
        id,
        title,
        description,
        translations,
        active_stores,
        questions,
        survey_type,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, timezone('utc'::text, now()), timezone('utc'::text, now())
      )
      RETURNING *
    `

    const res = await query(insertSql, [
      newId,
      title.trim(),
      description.trim(),
      JSON.stringify(translations),
      JSON.stringify(targetStores),
      JSON.stringify(questions),
      survey_type || 'CUSTOM',
    ])

    const created = res.rows[0]
    return NextResponse.json({
      success: true,
      survey: {
        ...created,
        total_responses: 0,
        active_stores: targetStores,
        questions,
        translations,
      },
    })
  } catch (err: any) {
    console.error('Erro em POST /api/surveys:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao criar pesquisa de satisfação' },
      { status: 500 }
    )
  }
}
