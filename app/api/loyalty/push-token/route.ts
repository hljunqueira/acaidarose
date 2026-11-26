import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const payload = loyaltyAuth.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sessão expirada ou não autorizada.' }, { status: 401 });
    }

    const body = await request.json();
    const { push_token, push_platform } = body || {};

    if (!push_token || typeof push_token !== 'string') {
      return NextResponse.json({ error: 'Push token inválido.' }, { status: 400 });
    }

    const platform = push_platform === 'ios' || push_platform === 'android' ? push_platform : null;
    await loyaltyRepository.updateCustomerPushToken(payload.customerId, push_token.trim(), platform);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em /api/loyalty/push-token:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao registar token de notificações.' },
      { status: 500 }
    );
  }
}
