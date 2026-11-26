import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';
import { notifyLoyaltyCustomer } from '@/lib/services/expoPush';

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
    const { voucher_code, tenant_id, order_id, cashier_user_id } = body;

    if (!voucher_code || !tenant_id) {
      return NextResponse.json(
        { error: 'Código do voucher e ID da loja (tenant_id) são obrigatórios.' },
        { status: 400 }
      );
    }

    const storesCfg = await loyaltyRepository.getEnabledStoresConfig();
    if ((storesCfg.disabled_tenant_ids || []).includes(tenant_id)) {
      return NextResponse.json(
        { error: 'Esta loja não participa do programa de Cashback.' },
        { status: 403 }
      );
    }

    const result = await loyaltyRepository.redeemVoucherInPDV({
      voucher_code,
      tenant_id,
      order_id,
      cashier_user_id: cashier_user_id || user?.id,
    });

    if (result.customerId) {
      notifyLoyaltyCustomer(result.customerId, {
        title: 'Voucher validado no balcão!',
        body: `O teu prémio "${result.rewardName}" (${result.voucherCode}) foi confirmado. Bom apetite!`,
        data: { type: 'VOUCHER_REDEEMED', voucher_code: result.voucherCode },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: `Voucher ${result.voucherCode} validado com sucesso!`,
        rewardName: result.rewardName,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/pdv/loyalty/redeem-voucher:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao validar e queimar voucher no PDV.' },
      { status: 400 }
    );
  }
}
