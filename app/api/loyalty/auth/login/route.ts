import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';
import { checkRateLimit } from '@/lib/services/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'loyalty_login', 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Demasiadas tentativas de login. Tenta novamente em ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Informe o telemóvel ou @username e a palavra-passe.' },
        { status: 400 }
      );
    }

    const customer = await loyaltyRepository.findCustomerByLogin(String(login));
    if (!customer) {
      return NextResponse.json(
        { error: 'Conta não encontrada. Verifique o telemóvel ou faça o registo.' },
        { status: 404 }
      );
    }

    if (!customer.password_hash) {
      return NextResponse.json(
        { error: 'Conta sem palavra-passe definida. Solicite a recuperação.' },
        { status: 401 }
      );
    }

    const isMatch = loyaltyAuth.comparePassword(String(password), customer.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Palavra-passe incorreta.' },
        { status: 401 }
      );
    }

    if (customer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Esta conta encontra-se inativa ou foi eliminada.' },
        { status: 403 }
      );
    }

    const accessToken = loyaltyAuth.generateAccessToken(
      customer.id,
      customer.username,
      customer.phone,
      customer.tenant_id
    );
    const refreshToken = loyaltyAuth.generateRefreshToken(customer.id);
    await loyaltyRepository.updateRefreshTokenHash(
      customer.id,
      loyaltyAuth.hashRefreshToken(refreshToken)
    );

    return NextResponse.json(
      {
        customer: {
          id: customer.id,
          username: customer.username,
          phone: customer.phone,
          name: customer.name,
          email: customer.email,
          nif: customer.nif,
          birth_date: customer.birth_date,
          points_balance: customer.points_balance,
          referral_code: customer.referral_code,
          avatar_url: customer.avatar_url,
          tenant_id: customer.tenant_id,
        },
        accessToken,
        refreshToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/auth/login:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao realizar login.' },
      { status: 500 }
    );
  }
}
