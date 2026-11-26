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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const [transactions, customer] = await Promise.all([
      loyaltyRepository.listCustomerTransactions(payload.customerId, limit, offset),
      loyaltyRepository.findCustomerById(payload.customerId),
    ]);

    return NextResponse.json(
      {
        balance: customer?.points_balance ?? 0,
        transactions,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/transactions:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar extrato de transações.' },
      { status: 500 }
    );
  }
}
