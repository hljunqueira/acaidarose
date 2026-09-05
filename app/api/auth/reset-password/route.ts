import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawEmail = body?.email
    const rawCode = body?.code
    const newPassword = body?.newPassword

    if (!rawEmail || !rawCode || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código de verificação e nova palavra-passe são obrigatórios.' },
        { status: 400 }
      )
    }

    const cleanEmail = String(rawEmail).toLowerCase().trim()
    const cleanCode = String(rawCode).trim()
    const cleanPass = String(newPassword).trim()

    if (cleanPass.length < 6) {
      return NextResponse.json(
        { error: 'A nova palavra-passe deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      )
    }

    // 1. Busca o token ativo e não expirado mais recente para o e-mail
    const tokenRes = await query(
      `SELECT id, code_hash, expires_at, used 
       FROM password_reset_tokens 
       WHERE LOWER(email) = $1 AND used = false AND expires_at > NOW() 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [cleanEmail]
    )

    if (!tokenRes.rows || tokenRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'O código informado é inválido ou expirou. Por favor, solicite um novo código.' },
        { status: 400 }
      )
    }

    const tokenRow = tokenRes.rows[0]

    // 2. Valida o código com bcrypt
    const isCodeValid = bcrypt.compareSync(cleanCode, tokenRow.code_hash)
    if (!isCodeValid) {
      return NextResponse.json(
        { error: 'Código de verificação incorreto. Verifique o número digitado.' },
        { status: 400 }
      )
    }

    // 3. Consulta usuário no PostgreSQL
    const userRes = await query(
      `SELECT id, tenant_id 
       FROM users 
       WHERE LOWER(email) = $1 AND active = true AND deleted_at IS NULL 
       LIMIT 1`,
      [cleanEmail]
    )

    if (!userRes.rows || userRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado ou inativo na base de dados.' },
        { status: 404 }
      )
    }

    const user = userRes.rows[0]

    // 4. Criptografa a nova senha com bcrypt
    const newHash = bcrypt.hashSync(cleanPass, 10)

    // 5. Atualiza a senha na tabela users
    await query(
      `UPDATE users 
       SET password_hash = $1, updated_at = timezone('utc'::text, now()) 
       WHERE id = $2`,
      [newHash, user.id]
    )

    // 6. Invalida o token utilizado
    await query(
      `UPDATE password_reset_tokens 
       SET used = true 
       WHERE id = $1`,
      [tokenRow.id]
    )

    // 7. Auditoria de segurança
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
    await recordAuditLog({
      tenantId: user.tenant_id,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'AUTH',
      message: `Palavra-passe redefinida com sucesso para ${cleanEmail}`,
      metadata: { email: cleanEmail, ip: ipAddress },
    })

    return NextResponse.json({
      success: true,
      message: 'Palavra-passe redefinida com sucesso! Pode agora iniciar sessão.',
    })
  } catch (err: any) {
    console.error('Erro na rota reset-password:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao redefinir a palavra-passe.' },
      { status: 500 }
    )
  }
}
