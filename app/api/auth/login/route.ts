import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { User, UserRole } from '@/types'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e palavra-passe são obrigatórios.' },
        { status: 400 }
      )
    }

    const cleanEmail = String(email).toLowerCase().trim()
    const cleanPass = String(password).trim()

    // 1. Consulta usuário ativo no PostgreSQL 16 da VPS
    const res = await query(
      `SELECT id, email, name, password_hash, role, tenant_id, active, created_at, updated_at 
       FROM users 
       WHERE LOWER(email) = $1 AND active = true AND deleted_at IS NULL 
       LIMIT 1`,
      [cleanEmail]
    )

    if (!res || !res.rows || res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.' },
        { status: 401 }
      )
    }

    const userRow = res.rows[0]

    // 2. Validação segura da palavra-passe (bcrypt ou plain text fallback)
    let isMatch = false
    if (userRow.password_hash?.startsWith('$2')) {
      try {
        isMatch = bcrypt.compareSync(cleanPass, userRow.password_hash)
      } catch {
        isMatch = false
      }
    } else {
      isMatch = userRow.password_hash === cleanPass
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique o seu e-mail e palavra-passe.' },
        { status: 401 }
      )
    }

    // 3. Monta o payload seguro do utilizador
    const safeUser: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role as UserRole,
      tenantId: userRow.tenant_id,
      active: userRow.active,
      createdAt: userRow.created_at,
      updatedAt: userRow.updated_at,
    }

    // Utiliza o ID do usuário como token de sessão autenticada
    const token = userRow.id

    return NextResponse.json({
      token,
      user: safeUser,
      message: 'Sessão iniciada com sucesso.',
    })
  } catch (err: any) {
    console.error('Erro na rota de login PostgreSQL:', err)
    return NextResponse.json(
      { error: 'Erro ao conectar à base de dados. Por favor, tente novamente.' },
      { status: 500 }
    )
  }
}
