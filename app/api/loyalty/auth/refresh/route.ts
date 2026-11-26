import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body || {};

    if (!refreshToken || typeof refreshToken !== 'string') {
      return NextResponse.json({ error: 'Refresh token obrigatório.' }, { status: 400 });
    }

    const verified = loyaltyAuth.verifyRefreshToken(refreshToken);
    if (!verified) {
      return NextResponse.json({ error: 'Sessão expirada. Inicia sessão novamente.' }, { status: 401 });
    }

    const customer = await loyaltyRepository.findCustomerById(verified.customerId);
    if (!customer || customer.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conta não encontrada ou inativa.' }, { status: 401 });
    }

    // Se já houver refresh_token_hash guardado, exige correspondência exata (rotação)
    const incomingHash = loyaltyAuth.hashRefreshToken(refreshToken);
    const storedHash = (customer as any).refresh_token_hash as string | null | undefined;
    if (storedHash && storedHash !== incomingHash) {
      return NextResponse.json({ error: 'Token de atualização inválido ou já utilizado.' }, { status: 401 });
    }

    const newAccessToken = loyaltyAuth.generateAccessToken(
      customer.id,
      customer.username,
      customer.phone,
      customer.tenant_id
    );
    const newRefreshToken = loyaltyAuth.generateRefreshToken(customer.id);
    await loyaltyRepository.updateRefreshTokenHash(
      customer.id,
      loyaltyAuth.hashRefreshToken(newRefreshToken)
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
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/auth/refresh:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao renovar sessão.' },
      { status: 500 }
    );
  }
}
