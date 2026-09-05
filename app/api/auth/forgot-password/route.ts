import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { recordAuditLog } from '@/lib/repositories/auditRepository'
import { sendPasswordResetEmail } from '@/lib/services/emailService'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body?.action || 'EMAIL'
    const rawEmail = body?.email
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'O e-mail é obrigatório.' }, { status: 400 })
    }

    const cleanEmail = rawEmail.toLowerCase().trim()

    // =========================================================================
    // FLUXO 1: Envio de Código 24/7 via Resend API
    // =========================================================================
    if (action === 'EMAIL') {
      // 1. Consulta se o usuário existe e está ativo no PostgreSQL
      const userRes = await query(
        `SELECT id, email, name, role, tenant_id 
         FROM users 
         WHERE LOWER(email) = $1 AND active = true AND deleted_at IS NULL 
         LIMIT 1`,
        [cleanEmail]
      )

      // Por segurança contra enumeração de contas, se o e-mail não existir retornamos sucesso genérico
      if (!userRes.rows || userRes.rows.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Se o e-mail estiver cadastrado na rede, você receberá o código em instantes.',
        })
      }

      const user = userRes.rows[0]

      // 2. Gera código numérico aleatório de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const codeHash = bcrypt.hashSync(code, 8)

      // 3. Invalida tokens anteriores não usados para este e-mail
      await query(
        `UPDATE password_reset_tokens 
         SET used = true 
         WHERE LOWER(email) = $1 AND used = false`,
        [cleanEmail]
      )

      // 4. Salva novo token válido por 15 minutos
      await query(
        `INSERT INTO password_reset_tokens (email, code_hash, expires_at, ip_address)
         VALUES ($1, $2, NOW() + INTERVAL '15 minutes', $3)`,
        [cleanEmail, codeHash, ipAddress]
      )

      // 5. Envia o e-mail via Resend API
      const sendResult = await sendPasswordResetEmail({
        to: cleanEmail,
        code,
        name: user.name,
      })

      if (!sendResult.success) {
        console.error('Falha no envio via Resend:', sendResult.error)
        return NextResponse.json(
          { error: 'Não foi possível enviar o e-mail no momento. Tente novamente ou use o canal de contingência.' },
          { status: 500 }
        )
      }

      // 6. Auditoria de segurança
      await recordAuditLog({
        tenantId: user.tenant_id,
        action: 'PASSWORD_RESET_EMAIL_DISPATCHED',
        entity: 'AUTH',
        message: `Código de redefinição enviado via Resend para ${cleanEmail}`,
        metadata: { email: cleanEmail, ip: ipAddress, resendId: sendResult.id },
      })

      return NextResponse.json({
        success: true,
        message: 'Código de verificação enviado com sucesso para o seu e-mail!',
      })
    }

    // =========================================================================
    // FLUXO 2: Contingência Emergencial (Franqueadora / TI via WhatsApp)
    // =========================================================================
    if (action === 'MANUAL') {
      const storeName = body?.storeName || 'Loja / Franquia'
      const contactName = body?.contactName || 'Operador / Gerente'
      const whatsappPhone = body?.whatsappPhone || ''
      const reason = body?.reason || 'Sem acesso ao e-mail corporativo'
      const tenantId = body?.tenantId || null

      await query(
        `INSERT INTO password_reset_requests (email, tenant_id, store_name, contact_name, whatsapp_phone, reason, ip_address, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
        [cleanEmail, tenantId, storeName, contactName, whatsappPhone, reason, ipAddress]
      )

      await recordAuditLog({
        tenantId: tenantId || undefined,
        action: 'PASSWORD_RESET_MANUAL_REQUESTED',
        entity: 'AUTH',
        message: `Solicitação manual de redefinição de palavra-passe pela loja ${storeName}`,
        metadata: { email: cleanEmail, storeName, contactName, whatsappPhone, ip: ipAddress },
      })

      return NextResponse.json({
        success: true,
        message: 'Solicitação emergencial registrada! A Franqueadora / TI entrará em contato via WhatsApp.',
      })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro na rota forgot-password:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao processar a recuperação de senha.' },
      { status: 500 }
    )
  }
}
