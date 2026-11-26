import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';
import { checkRateLimit } from '@/lib/services/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 'loyalty_register', 6, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Demasiadas tentativas de registo. Tenta novamente em ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const { phone, name, password, username, nif, referral_code, tenant_id } = body;

    if (!phone || !name || !password) {
      return NextResponse.json(
        { error: 'Telemóvel, nome e palavra-passe (ou PIN) são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();
    const cleanName = String(name).trim();
    const cleanPass = String(password).trim();

    // Valida se o telemóvel já está registrado
    const existing = await loyaltyRepository.findCustomerByLogin(cleanPhone);
    if (existing) {
      return NextResponse.json(
        { error: 'Este número de telemóvel já se encontra registrado. Faça login.' },
        { status: 409 }
      );
    }

    if (username) {
      const cleanUser = String(username).trim();
      const existingUser = await loyaltyRepository.findCustomerByLogin(cleanUser);
      if (existingUser) {
        return NextResponse.json(
          { error: 'Este nome de utilizador (@username) já se encontra em uso.' },
          { status: 409 }
        );
      }
    }

    const passwordHash = loyaltyAuth.hashPassword(cleanPass);

    const customer = await loyaltyRepository.createCustomer({
      phone: cleanPhone,
      name: cleanName,
      password_hash: passwordHash,
      username: username ? String(username).trim() : undefined,
      nif: nif ? String(nif).trim() : undefined,
      tenant_id,
      referral_code_used: referral_code ? String(referral_code).trim() : undefined,
    });

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
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/auth/register:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao realizar registo no programa de fidelidade.' },
      { status: 500 }
    );
  }
}
