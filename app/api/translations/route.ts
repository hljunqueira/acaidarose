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
    const {
      entityType,
      entityId,
      nameEn,
      nameEs,
      descriptionEn,
      descriptionEs,
      subtitleEn,
      subtitleEs,
      options,
      items = [],
    } = body

    // 1. Tratamento para entidades de catálogo (Option Models, Menus, Categorias, Produtos, Destaques)
    if (entityType && entityId) {
      if (entityType === 'option_model') {
        let updateSql = `
          UPDATE product_option_models
          SET name_en = $1,
              name_es = $2,
              subtitle_en = $3,
              subtitle_es = $4,
              updated_at = timezone('utc'::text, now())
        `
        const params: any[] = [
          nameEn || null,
          nameEs || null,
          subtitleEn || null,
          subtitleEs || null,
        ]

        if (Array.isArray(options)) {
          updateSql += `, options = $5::jsonb`
          params.push(JSON.stringify(options))
        }

        updateSql += ` WHERE id::text = $${params.length + 1} RETURNING *`
        params.push(entityId)

        const res = await query(updateSql, params)
        if (res.rows.length === 0) {
          return NextResponse.json({ error: 'Modelo de opções não encontrado' }, { status: 404 })
        }

        const updated = res.rows[0]

        // Sincroniza option_groups embutidos em product_containers
        try {
          const containersRes = await query(
            `SELECT id, option_groups FROM product_containers 
             WHERE option_groups IS NOT NULL AND jsonb_array_length(option_groups) > 0`
          )
          for (const row of containersRes.rows || []) {
            const groups = Array.isArray(row.option_groups) ? row.option_groups : []
            let modified = false
            const newGroups = groups.map((g: any) => {
              if (g.id === entityId || (g.name && updated.name && g.name.toLowerCase().trim() === updated.name.toLowerCase().trim())) {
                modified = true
                return {
                  ...g,
                  id: updated.id,
                  name: updated.name,
                  nameEn: updated.name_en || g.nameEn,
                  nameEs: updated.name_es || g.nameEs,
                  subtitle: updated.subtitle || g.subtitle,
                  subtitleEn: updated.subtitle_en || g.subtitleEn,
                  subtitleEs: updated.subtitle_es || g.subtitleEs,
                  options: Array.isArray(updated.options) && updated.options.length > 0 ? updated.options : g.options,
                }
              }
              return g
            })
            if (modified) {
              await query(
                `UPDATE product_containers SET option_groups = $1::jsonb WHERE id = $2`,
                [JSON.stringify(newGroups), row.id]
              )
            }
          }
        } catch (syncErr) {
          console.warn('Erro ao sincronizar recipientes após salvar tradução de modelo:', syncErr)
        }

        // Incrementa versão do catálogo
        await query(`UPDATE store_catalog_versions SET version = version + 1, updated_at = timezone('utc'::text, now())`)

        return NextResponse.json({
          success: true,
          message: 'Tradução do modelo de opções salva com sucesso em toda a rede.',
        })
      }

      if (entityType === 'menu') {
        await query(
          `UPDATE menus 
           SET name_en = $1, name_es = $2, description_en = $3, description_es = $4
           WHERE id::text = $5`,
          [nameEn || null, nameEs || null, descriptionEn || null, descriptionEs || null, entityId]
        )
        await query(`UPDATE store_catalog_versions SET version = version + 1, updated_at = timezone('utc'::text, now())`)
        return NextResponse.json({ success: true, message: 'Tradução do menu salva com sucesso.' })
      }

      if (entityType === 'category') {
        await query(
          `UPDATE categories 
           SET name_en = $1, name_es = $2, description_en = $3, description_es = $4
           WHERE id::text = $5`,
          [nameEn || null, nameEs || null, descriptionEn || null, descriptionEs || null, entityId]
        )
        await query(`UPDATE store_catalog_versions SET version = version + 1, updated_at = timezone('utc'::text, now())`)
        return NextResponse.json({ success: true, message: 'Tradução da categoria salva com sucesso.' })
      }

      if (entityType === 'product') {
        // Obter nome ou código para replicar para todas as lojas canônicas
        const prodRes = await query(`SELECT name, code FROM product_containers WHERE id::text = $1 LIMIT 1`, [entityId])
        const prodName = prodRes.rows[0]?.name
        const prodCode = prodRes.rows[0]?.code

        if (prodCode) {
          await query(
            `UPDATE product_containers 
             SET name_en = $1, name_es = $2, description_en = $3, description_es = $4, updated_at = timezone('utc'::text, now())
             WHERE code = $5 OR id::text = $6`,
            [nameEn || null, nameEs || null, descriptionEn || null, descriptionEs || null, prodCode, entityId]
          )
        } else if (prodName) {
          await query(
            `UPDATE product_containers 
             SET name_en = $1, name_es = $2, description_en = $3, description_es = $4, updated_at = timezone('utc'::text, now())
             WHERE name = $5 OR id::text = $6`,
            [nameEn || null, nameEs || null, descriptionEn || null, descriptionEs || null, prodName, entityId]
          )
        } else {
          await query(
            `UPDATE product_containers 
             SET name_en = $1, name_es = $2, description_en = $3, description_es = $4, updated_at = timezone('utc'::text, now())
             WHERE id::text = $5`,
            [nameEn || null, nameEs || null, descriptionEn || null, descriptionEs || null, entityId]
          )
        }
        await query(`UPDATE store_catalog_versions SET version = version + 1, updated_at = timezone('utc'::text, now())`)
        return NextResponse.json({ success: true, message: 'Tradução do produto salva com sucesso em toda a rede.' })
      }

      if (entityType === 'story') {
        await query(
          `UPDATE store_stories 
           SET title_en = $1, title_es = $2, subtitle_en = $3, subtitle_es = $4, updated_at = timezone('utc'::text, now())
           WHERE id::text = $5`,
          [nameEn || null, nameEs || null, descriptionEn || null, descriptionEs || null, entityId]
        )
        return NextResponse.json({ success: true, message: 'Tradução do destaque salva com sucesso.' })
      }
    }

    // 2. Tratamento para itens de interface / pesquisas de satisfação
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
