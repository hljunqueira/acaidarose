import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser, getAuthorizedTenantId } from '@/lib/api/authGuard'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')
    const startDate = req.nextUrl.searchParams.get('startDate')
    const endDate = req.nextUrl.searchParams.get('endDate')

    const user = await getAuthUser(req)

    let requestedTenantId: string | null = null
    if (rawTenant && rawTenant !== 'all' && rawTenant !== 'ALL') {
      const t = await getTenantByIdOrSlug(rawTenant)
      if (t) requestedTenantId = t.id
      else requestedTenantId = rawTenant
    }

    // Blindagem Multi-tenant: Franqueadora vê tudo ou filtra; Franquia vê somente a sua loja
    let targetTenantId: string | null = null
    if (user) {
      targetTenantId = getAuthorizedTenantId(user, requestedTenantId)
    } else {
      targetTenantId = requestedTenantId
    }

    // 1. Obter a definição da pesquisa
    const surveyRes = await query(
      `SELECT id, title, description, questions FROM satisfaction_surveys WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    )
    if (!surveyRes.rows || surveyRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pesquisa não encontrada.' }, { status: 404 })
    }
    const survey = surveyRes.rows[0]
    const questions: any[] = Array.isArray(survey.questions) ? survey.questions : []

    // 2. Montar filtros de busca para respostas
    const whereConditions: string[] = [`survey_id = $1`]
    const queryParams: any[] = [id]
    let pIdx = 2

    if (targetTenantId) {
      whereConditions.push(`tenant_id = $${pIdx++}`)
      queryParams.push(targetTenantId)
    }

    if (startDate) {
      whereConditions.push(`created_at >= $${pIdx++}::timestamp`)
      queryParams.push(startDate)
    }

    if (endDate) {
      whereConditions.push(`created_at <= $${pIdx++}::timestamp`)
      queryParams.push(endDate)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const responsesRes = await query(
      `
      SELECT 
        r.id,
        r.survey_id,
        r.tenant_id,
        r.order_id,
        r.table_number,
        r.customer_name,
        r.customer_phone,
        r.customer_email,
        r.customer_birthday,
        r.nps_score,
        r.answers,
        r.language,
        r.created_at,
        t.name as store_name
      FROM satisfaction_survey_responses r
      LEFT JOIN tenants t ON t.id = r.tenant_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT 1000
      `,
      queryParams
    )

    const responses = responsesRes.rows || []
    const totalResponses = responses.length

    // 3. Processar Métricas de Analytics
    let promoters = 0
    let passives = 0
    let detractors = 0
    let npsSum = 0
    let npsCount = 0

    // Métricas por tipo de pergunta
    const metricsAggregation: Record<string, { title: string; ratings: Record<string, { sum: number; count: number }> }> = {}
    const choiceAggregation: Record<string, { title: string; choices: Record<string, number>; otherAnswers: string[] }> = {}
    const openAnswersList: Array<{ questionId: string; questionText: string; answer: string; customerName?: string; date: string }> = []
    let leadsCount = 0

    // Inicializar estruturas com base no schema das perguntas
    for (const q of questions) {
      if (q.type === 'metrics' && Array.isArray(q.metrics)) {
        metricsAggregation[q.id] = {
          title: q.title,
          ratings: {},
        }
        for (const m of q.metrics) {
          metricsAggregation[q.id].ratings[m] = { sum: 0, count: 0 }
        }
      } else if (q.type === 'multiple_choice' && Array.isArray(q.choices)) {
        choiceAggregation[q.id] = {
          title: q.title,
          choices: {},
          otherAnswers: [],
        }
        for (const ch of q.choices) {
          choiceAggregation[q.id].choices[ch] = 0
        }
      }
    }

    for (const resp of responses) {
      const answers: any[] = Array.isArray(resp.answers) ? resp.answers : []

      // Fallback seguro caso colunas estejam nulas
      if (!resp.customer_email || !resp.customer_birthday || resp.nps_score === null || resp.nps_score === undefined) {
        for (const ans of answers) {
          if (ans.type === 'customer_data') {
            if (!resp.customer_name && ans.name) resp.customer_name = ans.name
            if (!resp.customer_phone && ans.phone) resp.customer_phone = ans.phone
            if (!resp.customer_email && ans.email) resp.customer_email = ans.email
            if (!resp.customer_birthday && ans.birthday) resp.customer_birthday = ans.birthday
          } else if (ans.type === 'nps' && (resp.nps_score === null || resp.nps_score === undefined)) {
            const s = Number(ans.score)
            if (!isNaN(s)) resp.nps_score = s
          }
        }
      }

      if (resp.customer_name || resp.customer_phone || resp.customer_email) {
        leadsCount++
      }

      if (typeof resp.nps_score === 'number') {
        npsSum += resp.nps_score
        npsCount++
        if (resp.nps_score >= 9) promoters++
        else if (resp.nps_score >= 7) passives++
        else detractors++
      }
      for (const ans of answers) {
        const qId = ans.question_id
        const qType = ans.type

        if (qType === 'nps' && ans.comment) {
          openAnswersList.push({
            questionId: qId,
            questionText: 'Justificativa NPS',
            answer: ans.comment,
            customerName: resp.customer_name,
            date: resp.created_at,
          })
        } else if (qType === 'open' && ans.answer) {
          const qDef = questions.find((q) => q.id === qId)
          openAnswersList.push({
            questionId: qId,
            questionText: qDef?.title || 'Resposta Aberta',
            answer: ans.answer,
            customerName: resp.customer_name,
            date: resp.created_at,
          })
        } else if (qType === 'metrics' && ans.metrics && metricsAggregation[qId]) {
          // ans.metrics é um objeto { "Limpeza": 5, "Atendimento": 4 }
          for (const [mName, val] of Object.entries(ans.metrics)) {
            const numVal = Number(val)
            if (!isNaN(numVal) && numVal > 0) {
              if (!metricsAggregation[qId].ratings[mName]) {
                metricsAggregation[qId].ratings[mName] = { sum: 0, count: 0 }
              }
              metricsAggregation[qId].ratings[mName].sum += numVal
              metricsAggregation[qId].ratings[mName].count++
            }
          }
        } else if (qType === 'multiple_choice' && choiceAggregation[qId]) {
          if (ans.isOther && ans.otherText) {
            choiceAggregation[qId].otherAnswers.push(ans.otherText)
          } else if (ans.choice) {
            if (choiceAggregation[qId].choices[ans.choice] !== undefined) {
              choiceAggregation[qId].choices[ans.choice]++
            } else {
              choiceAggregation[qId].choices[ans.choice] = 1
            }
          }
        }
      }
    }

    // Calcular NPS Score final: ((promotores - detratores) / total) * 100
    let npsScore = 0
    if (npsCount > 0) {
      npsScore = Math.round(((promoters - detractors) / npsCount) * 100)
    }

    // Formatar médias de métricas
    const computedMetrics: Record<string, { title: string; items: Array<{ name: string; average: number; totalRatings: number }> }> = {}
    for (const [qId, agg] of Object.entries(metricsAggregation)) {
      computedMetrics[qId] = {
        title: agg.title,
        items: Object.entries(agg.ratings).map(([mName, r]) => ({
          name: mName,
          average: r.count > 0 ? Number((r.sum / r.count).toFixed(1)) : 0,
          totalRatings: r.count,
        })),
      }
    }

    return NextResponse.json({
      success: true,
      survey,
      responses,
      analytics: {
        total_responses: totalResponses,
        leads_count: leadsCount,
        nps: {
          score: npsScore,
          average_rating: npsCount > 0 ? Number((npsSum / npsCount).toFixed(1)) : 0,
          total_nps_responses: npsCount,
          promoters_count: promoters,
          passives_count: passives,
          detractors_count: detractors,
          promoters_percent: npsCount > 0 ? Math.round((promoters / npsCount) * 100) : 0,
          passives_percent: npsCount > 0 ? Math.round((passives / npsCount) * 100) : 0,
          detractors_percent: npsCount > 0 ? Math.round((detractors / npsCount) * 100) : 0,
        },
        metrics: computedMetrics,
        multiple_choice: choiceAggregation,
        open_answers: openAnswersList,
      },
    })
  } catch (err: any) {
    console.error('Erro em GET /api/surveys/[id]/responses:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar respostas da pesquisa' },
      { status: 500 }
    )
  }
}
