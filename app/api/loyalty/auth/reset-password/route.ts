import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '@/lib/db/postgres';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { checkRateLimit } from '@/lib/services/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'loyalty_reset_password', 8, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Demasiadas tentativas. Tenta novamente em ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const rawIdentifier = String(body?.identifier || '').trim();
    const code = String(body?.code || '').trim();
    const newPassword = String(body?.newPassword || '').trim();

    if (!rawIdentifier || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Preenche o identificador, o código de 6 dígitos e a nova palavra-passe.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'A nova palavra-passe deve ter pelo menos 4 caracteres.' },
        { status: 400 }
      );
    }

    let customer = await loyaltyRepository.findCustomerByLogin(rawIdentifier);
    if (!customer && rawIdentifier.includes('@')) {
      const byEmail = await query(
        `SELECT * FROM loyalty_customers WHERE LOWER(email) = $1 AND status = 'ACTIVE' LIMIT 1`,
        [rawIdentifier.toLowerCase()]
      );
      customer = byEmail.rows[0] || null;
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado.' },
        { status: 400 }
      );
    }

    const tokenKey = `loyalty:${customer.id}`;
    const tokenRes = await query(
      `SELECT id, code_hash FROM password_reset_tokens
       WHERE email = $1 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenKey]
    );

    const tokenRow = tokenRes.rows[0];
    if (!tokenRow) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado. Solicita um novo código.' },
        { status: 400 }
      );
    }

    const isCodeValid = await bcrypt.compare(code, tokenRow.code_hash);
    if (!isCodeValid) {
      return NextResponse.json(
        { error: 'Código de verificação incorreto.' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE password_reset_tokens SET used = true WHERE id = $1`,
        [tokenRow.id]
      );
      await client.query(
        `UPDATE loyalty_customers
         SET password_hash = $1, refresh_token_hash = NULL, updated_at = NOW()
         WHERE id = $2`,
        [newHash, customer!.id]
      );
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Palavra-passe atualizada com sucesso. Já podes iniciar sessão.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/auth/reset-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno ao redefinir palavra-passe.' },
      { status: 500 }
    );
  }
}
