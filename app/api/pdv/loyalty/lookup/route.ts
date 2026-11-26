import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN', 'TENANT_ADMIN', 'CASHIER'])) {
    return NextResponse.json(
      { error: 'Acesso restrito a operadores autenticados do PDV.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const queryText = body?.query?.trim();

    if (!queryText) {
      return NextResponse.json(
        { error: 'Informe o telemóvel, @username ou código QR do cliente.' },
        { status: 400 }
      );
    }

    const result = await loyaltyRepository.lookupCustomerForPDV(queryText);

    if (!result.customer) {
      return NextResponse.json(
        { customer: null, active_vouchers: [], message: 'Cliente não cadastrado no programa de fidelidade.' },
        { status: 200 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Erro em /api/pdv/loyalty/lookup:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar cliente no PDV.' },
      { status: 500 }
    );
  }
}
