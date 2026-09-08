import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { tenantId: rawTenantId, answers = [], language = 'pt', orderId, tableNumber } = body

    if (!rawTenantId) {
      return NextResponse.json({ error: 'Loja é obrigatória.' }, { status: 400 })
    }

    let tenantId = rawTenantId
    const t = await getTenantByIdOrSlug(rawTenantId)
    if (t) tenantId = t.id

    // Verificar se a pesquisa existe e não foi excluída
    const surveyCheck = await query(
      `SELECT id FROM satisfaction_surveys WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )
    if (!surveyCheck.rows || surveyCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Pesquisa não encontrada ou inativa.' }, { status: 404 })
    }

    // Extrair campos canônicos para colunas dedicadas
    let customerName: string | null = null
    let customerPhone: string | null = null
    let customerEmail: string | null = null
    let customerBirthday: string | null = null
    let npsScore: number | null = null

    if (Array.isArray(answers)) {
      for (const ans of answers) {
        if (ans.type === 'nps') {
          const s = Number(ans.score)
          if (!isNaN(s)) npsScore = s
        } else if (ans.type === 'customer_data') {
          if (ans.name) customerName = String(ans.name).trim()
          if (ans.phone) customerPhone = String(ans.phone).trim()
          if (ans.email) customerEmail = String(ans.email).trim()
          if (ans.birthday) customerBirthday = String(ans.birthday).trim()
        }
      }
    }

    const responseId = uuidv4()
    const insertSql = `
      INSERT INTO satisfaction_survey_responses (
        id,
        survey_id,
        tenant_id,
        order_id,
        table_number,
        customer_name,
        customer_phone,
        customer_email,
        customer_birthday,
        nps_score,
        answers,
        language,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, timezone('utc'::text, now())
      )
      RETURNING id
    `

    const res = await query(insertSql, [
      responseId,
      id,
      tenantId,
      orderId || null,
      tableNumber ? String(tableNumber) : null,
      customerName,
      customerPhone,
      customerEmail,
      customerBirthday,
      npsScore,
      JSON.stringify(answers),
      language,
    ])

    return NextResponse.json({
      success: true,
      id: res.rows[0]?.id || responseId,
      message: 'Avaliação enviada com sucesso! Obrigado pelo seu feedback.',
    })
  } catch (err: any) {
    console.error('Erro em POST /api/surveys/[id]/respond:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao registrar avaliação' },
      { status: 500 }
    )
  }
}
