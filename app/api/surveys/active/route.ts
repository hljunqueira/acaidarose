import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getTenantByIdOrSlug } from '@/lib/repositories/tenantsRepository'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const rawTenant =
      req.nextUrl.searchParams.get('loja') ||
      req.nextUrl.searchParams.get('tenantId') ||
      req.nextUrl.searchParams.get('tenant')

    const requestedLang = (req.nextUrl.searchParams.get('lang') || 'pt').toLowerCase()

    if (!rawTenant) {
      return NextResponse.json({ error: 'Parâmetro de loja é obrigatório.' }, { status: 400 })
    }

    let tenantId = rawTenant
    const t = await getTenantByIdOrSlug(rawTenant)
    if (t) tenantId = t.id

    // 1. Validar se o idioma solicitado está ativo para esta loja
    let effectiveLang = requestedLang
    const langCheck = await query(
      `SELECT is_active FROM store_languages_config WHERE tenant_id = $1 AND language_code = $2`,
      [tenantId, requestedLang]
    )

    // Se o idioma não estiver ativo no banco para esta loja, recorre a 'pt'
    if (requestedLang !== 'pt') {
      if (!langCheck.rows || langCheck.rows.length === 0 || !langCheck.rows[0].is_active) {
        effectiveLang = 'pt'
      }
    }

    // 2. Buscar a pesquisa ativa para este tenant
    const surveyRes = await query(
      `
      SELECT id, title, description, translations, questions, active_stores
      FROM satisfaction_surveys
      WHERE deleted_at IS NULL AND active_stores ? $1
      LIMIT 1
      `,
      [tenantId]
    )

    if (!surveyRes.rows || surveyRes.rows.length === 0) {
      return NextResponse.json({ success: true, survey: null, language: effectiveLang })
    }

    const survey = surveyRes.rows[0]
    const questions: any[] = Array.isArray(survey.questions) ? survey.questions : []
    const translations = survey.translations || {}

    // 3. Aplicar traduções se o idioma for diferente de 'pt'
    let finalTitle = survey.title
    let finalDescription = survey.description
    let finalQuestions = questions

    if (effectiveLang !== 'pt' && translations[effectiveLang]) {
      const langData = translations[effectiveLang]
      if (langData.title) finalTitle = langData.title
      if (langData.description) finalDescription = langData.description

      const qTrans = langData.questions || {}
      finalQuestions = questions.map((q: any) => {
        const tQ = qTrans[q.id]
        if (!tQ) return q

        return {
          ...q,
          title: tQ.title || q.title,
          description: tQ.description || q.description,
          choices: Array.isArray(tQ.choices) && tQ.choices.length === (q.choices || []).length
            ? tQ.choices
            : q.choices,
          metrics: Array.isArray(tQ.metrics) && tQ.metrics.length === (q.metrics || []).length
            ? tQ.metrics
            : q.metrics,
        }
      })
    }

    return NextResponse.json({
      success: true,
      language: effectiveLang,
      survey: {
        id: survey.id,
        title: finalTitle,
        description: finalDescription,
        questions: finalQuestions,
      },
    })
  } catch (err: any) {
    console.error('Erro em GET /api/surveys/active:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar pesquisa ativa' },
      { status: 500 }
    )
  }
}
