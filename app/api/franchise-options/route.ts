import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

// Helper para garantir a existência da tabela e seeding inicial
async function ensureTableAndSeed() {
  try {
    // Tenta uma consulta simples para verificar se a tabela existe
    await query('SELECT id FROM franchise_options LIMIT 1')
  } catch (err: any) {
    console.log('Tabela franchise_options não encontrada. Criando e semeando dados padrões...')
    
    // Cria a tabela caso ela não exista
    await query(`
      CREATE TABLE IF NOT EXISTS franchise_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        value_text VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      )
    `)

    // Semeia as 3 opções padrões com display_order sequencial
    await query(`
      INSERT INTO franchise_options (id, name, value_text, active, display_order)
      VALUES 
        ($1, 'Delivery', '10.000€', TRUE, 1),
        ($2, 'Loja pequena até 20 metros quadrados', '15.000€ a 20.000€', TRUE, 2),
        ($3, 'Loja até 60 metros quadrados', '25.000€ a 30.000€', TRUE, 3)
      ON CONFLICT (name) DO NOTHING
    `, [uuidv4(), uuidv4(), uuidv4()])
    
    console.log('Tabela franchise_options criada e semeada com sucesso!')
  }
}

export async function GET() {
  try {
    await ensureTableAndSeed()

    const res = await query(
      `SELECT id, name, value_text as "valueText", active, display_order as "displayOrder", created_at, updated_at
       FROM franchise_options
       ORDER BY display_order ASC, created_at ASC`
    )

    const response = NextResponse.json({ options: res.rows || [] })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (err: any) {
    console.error('Erro ao buscar opções de franquia:', err)
    const response = NextResponse.json(
      { error: err.message || 'Erro ao carregar opções de franquia' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTableAndSeed()
    const body = await req.json()
    const { name, valueText, active, displayOrder } = body

    if (!name || !valueText) {
      return NextResponse.json({ error: 'Nome e valor são obrigatórios' }, { status: 400 })
    }

    const id = uuidv4()
    const res = await query(
      `INSERT INTO franchise_options (id, name, value_text, active, display_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, now(), now())
       RETURNING id, name, value_text as "valueText", active, display_order as "displayOrder"`,
      [
        id,
        name,
        valueText,
        active !== undefined ? active : true,
        Number(displayOrder) || 0,
      ]
    )

    const response = NextResponse.json({ success: true, option: res.rows[0] }, { status: 201 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (err: any) {
    console.error('Erro ao cadastrar opção de franquia:', err)
    const response = NextResponse.json(
      { error: err.message || 'Erro ao criar opção de franquia' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureTableAndSeed()
    const body = await req.json()
    const { id, name, valueText, active, displayOrder } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const res = await query(
      `UPDATE franchise_options
       SET name = COALESCE($1, name),
           value_text = COALESCE($2, value_text),
           active = COALESCE($3, active),
           display_order = COALESCE($4, display_order),
           updated_at = now()
       WHERE id::text = $5
       RETURNING id, name, value_text as "valueText", active, display_order as "displayOrder"`,
      [
        name || null,
        valueText || null,
        active !== undefined ? active : null,
        displayOrder !== undefined ? Number(displayOrder) : null,
        id,
      ]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Opção não encontrada' }, { status: 404 })
    }

    const response = NextResponse.json({ success: true, option: res.rows[0] })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (err: any) {
    console.error('Erro ao atualizar opção de franquia:', err)
    const response = NextResponse.json(
      { error: err.message || 'Erro ao atualizar opção de franquia' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTableAndSeed()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const res = await query(
      `DELETE FROM franchise_options WHERE id::text = $1`,
      [id]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Opção não encontrada' }, { status: 404 })
    }

    const response = NextResponse.json({ success: true })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (err: any) {
    console.error('Erro ao excluir opção de franquia:', err)
    const response = NextResponse.json(
      { error: err.message || 'Erro ao excluir opção de franquia' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
