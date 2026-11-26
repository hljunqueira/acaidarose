import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db/postgres';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import { checkRateLimit } from '@/lib/services/rateLimit';

export const dynamic = 'force-dynamic';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'loyalty_forgot_password', 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Demasiados pedidos de recuperação. Tenta novamente em ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const rawIdentifier = String(body?.identifier || '').trim();
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    if (!rawIdentifier) {
      return NextResponse.json(
        { error: 'Indica o teu telemóvel, @username ou email.' },
        { status: 400 }
      );
    }

    // Procura por telemóvel/@username ou diretamente por email
    let customer = await loyaltyRepository.findCustomerByLogin(rawIdentifier);
    if (!customer && rawIdentifier.includes('@')) {
      const byEmail = await query(
        `SELECT * FROM loyalty_customers WHERE LOWER(email) = $1 AND status = 'ACTIVE' LIMIT 1`,
        [rawIdentifier.toLowerCase()]
      );
      customer = byEmail.rows[0] || null;
    }

    // Resposta genérica contra enumeração de contas quando não existe ou não tem email
    if (!customer || !customer.email) {
      return NextResponse.json(
        {
          success: true,
          hasEmail: false,
          message:
            'Se a tua conta tiver um email associado, receberás um código de 6 dígitos em instantes.',
        },
        { status: 200 }
      );
    }

    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, 8);
    const tokenKey = `loyalty:${customer.id}`;

    // Invalida códigos anteriores não utilizados
    await query(
      `UPDATE password_reset_tokens SET used = true WHERE email = $1 AND used = false`,
      [tokenKey]
    );

    // Guarda novo código válido por 15 minutos
    await query(
      `INSERT INTO password_reset_tokens (email, code_hash, expires_at, ip_address)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes', $3)`,
      [tokenKey, codeHash, ipAddress]
    );

    const sendResult = await sendPasswordResetEmail({
      to: customer.email,
      code,
      name: customer.name,
    });

    if (!sendResult.success) {
      console.error('Erro ao enviar email de recuperação loyalty:', sendResult.error);
      return NextResponse.json(
        { error: 'Não foi possível enviar o código agora. Tenta novamente em instantes.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        hasEmail: true,
        maskedEmail: maskEmail(customer.email),
        message: `Código de 6 dígitos enviado para ${maskEmail(customer.email)}.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/auth/forgot-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao solicitar recuperação.' },
      { status: 500 }
    );
  }
}
