import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';

export const dynamic = 'force-dynamic';

function extractCustomerId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const payload = loyaltyAuth.verifyAccessToken(token);
  return payload?.customerId || null;
}

function isValidPortugueseNif(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const first = Number(nif[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(first)) return false;
  let total = 0;
  for (let i = 0; i < 8; i++) {
    total += Number(nif[i]) * (9 - i);
  }
  const mod = total % 11;
  const check = mod < 2 ? 0 : 11 - mod;
  return check === Number(nif[8]);
}

function formatCustomerPublic(customer: any, referralsCount?: number) {
  return {
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
    ...(referralsCount !== undefined ? { referrals_count: referralsCount } : {}),
  };
}

export async function GET(request: NextRequest) {
  try {
    const customerId = extractCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: 'Sessão expirada ou não autorizada.' }, { status: 401 });
    }

    const [customer, referralsCount] = await Promise.all([
      loyaltyRepository.findCustomerById(customerId),
      loyaltyRepository.countCustomerReferrals(customerId),
    ]);

    if (!customer || customer.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(
      { customer: formatCustomerPublic(customer, referralsCount) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em GET /api/loyalty/profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar perfil.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customerId = extractCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: 'Sessão expirada ou não autorizada.' }, { status: 401 });
    }

    const existing = await loyaltyRepository.findCustomerById(customerId);
    if (!existing || existing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, nif, birth_date, tenant_id, avatar_url, current_password, new_password } = body || {};

    if (avatar_url !== undefined && avatar_url !== null && avatar_url !== '') {
      const cleanAvatar = String(avatar_url).trim();
      const validAvatar =
        cleanAvatar.startsWith('/uploads/') ||
        cleanAvatar.startsWith('https://') ||
        cleanAvatar.startsWith('http://');
      if (!validAvatar) {
        return NextResponse.json({ error: 'URL de foto de perfil inválida.' }, { status: 400 });
      }
    }

    if (name !== undefined && String(name).trim().length < 2) {
      return NextResponse.json({ error: 'Indica um nome válido.' }, { status: 400 });
    }

    if (email !== undefined && email !== null && String(email).trim() !== '') {
      const cleanEmail = String(email).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
      }
    }

    if (nif !== undefined && nif !== null && String(nif).trim() !== '') {
      const cleanNif = String(nif).replace(/\s+/g, '').trim();
      if (!isValidPortugueseNif(cleanNif)) {
        return NextResponse.json(
          { error: 'NIF inválido. Deve conter 9 dígitos portugueses válidos.' },
          { status: 400 }
        );
      }
    }

    if (birth_date !== undefined && birth_date !== null && String(birth_date).trim() !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birth_date).trim())) {
        return NextResponse.json(
          { error: 'Data de nascimento inválida (usa AAAA-MM-DD).' },
          { status: 400 }
        );
      }
    }

    if (new_password !== undefined && String(new_password).trim() !== '') {
      const cleanNewPass = String(new_password).trim();
      if (cleanNewPass.length < 4) {
        return NextResponse.json(
          { error: 'A nova palavra-passe deve ter pelo menos 4 caracteres.' },
          { status: 400 }
        );
      }
      if (!current_password || !existing.password_hash || !loyaltyAuth.comparePassword(String(current_password), existing.password_hash)) {
        return NextResponse.json(
          { error: 'Palavra-passe atual incorreta.' },
          { status: 400 }
        );
      }
      await loyaltyRepository.updateCustomerPassword(customerId, loyaltyAuth.hashPassword(cleanNewPass));
    }

    const updated = await loyaltyRepository.updateCustomerProfile(customerId, {
      name: name !== undefined ? String(name).trim() : undefined,
      email: email !== undefined ? (email ? String(email).trim() : null) : undefined,
      nif: nif !== undefined ? (nif ? String(nif).replace(/\s+/g, '').trim() : null) : undefined,
      birth_date: birth_date !== undefined ? (birth_date ? String(birth_date).trim() : null) : undefined,
      tenant_id: tenant_id !== undefined ? tenant_id : undefined,
      avatar_url: avatar_url !== undefined ? (avatar_url ? String(avatar_url).trim() : null) : undefined,
    });

    const referralsCount = await loyaltyRepository.countCustomerReferrals(customerId);
    return NextResponse.json(
      { customer: formatCustomerPublic(updated || existing, referralsCount) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em PATCH /api/loyalty/profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar perfil.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const customerId = extractCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: 'Sessão expirada ou não autorizada.' }, { status: 401 });
    }

    const deleted = await loyaltyRepository.anonymizeCustomerAccount(customerId);
    if (!deleted) {
      return NextResponse.json({ error: 'Conta não encontrada ou já eliminada.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'A tua conta foi eliminada e os dados pessoais foram anonimizados com sucesso.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em DELETE /api/loyalty/profile:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao eliminar conta.' },
      { status: 500 }
    );
  }
}
