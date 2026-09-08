import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { getAuthUser } from '@/lib/api/authGuard'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const language = req.nextUrl.searchParams.get('language') || 'en'
    const section = req.nextUrl.searchParams.get('section')

    let sql = `SELECT tenant_id, language, section, key, value FROM store_interface_translations WHERE language = $1`
    const params: any[] = [language]

    if (section) {
      sql += ` AND section = $2`
      params.push(section)
    }

    const res = await query(sql, params)
    const translations = res.rows || []

    return NextResponse.json({ success: true, translations })
  } catch (err: any) {
    console.error('Erro em GET /api/translations:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao carregar traduções' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'FRANCHISOR_ADMIN')) {
      return NextResponse.json(
        { error: 'Apenas a Franqueadora Master pode alterar as traduções oficiais da rede.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { items = [] } = body // items: [{ language, section, key, value }]

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item fornecido para salvar' }, { status: 400 })
    }

    // Gravar para cada tenant canônico da rede
    const tenantsRes = await query(`SELECT id FROM tenants WHERE active = true AND deleted_at IS NULL`)
    const tenants = tenantsRes.rows.map((t: any) => t.id)

    for (const tId of tenants) {
      for (const it of items) {
        if (!it.language || !it.section || !it.key) continue

        await query(
          `INSERT INTO store_interface_translations (tenant_id, language, section, key, value, updated_at)
           VALUES ($1, $2, $3, $4, $5, timezone('utc'::text, now()))
           ON CONFLICT (tenant_id, language, section, key)
           DO UPDATE SET value = $5, updated_at = timezone('utc'::text, now())`,
          [tId, it.language, it.section, it.key, String(it.value || '')]
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `${items.length} traduções replicadas com sucesso para toda a rede.`,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/translations:', err)
    return NextResponse.json(
      { error: err.message || 'Erro ao salvar traduções' },
      { status: 500 }
    )
  }
}
