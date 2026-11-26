import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const payload = loyaltyAuth.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Sessão expirada ou não autorizada.' },
        { status: 401 }
      );
    }

    const vouchers = await loyaltyRepository.listCustomerVouchers(payload.customerId);

    return NextResponse.json(
      { vouchers },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/vouchers:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao listar vouchers do cliente.' },
      { status: 500 }
    );
  }
}
