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
    const idempotencyKey = request.headers.get('x-idempotency-key') || body?.idempotency_key;

    const { tenant_id, customer_id, order_id, items, cashier_user_id } = body;

    if (!tenant_id || !customer_id || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: tenant_id, customer_id e items.' },
        { status: 400 }
      );
    }

    // Busca se há campanha promocional com multiplicador ativo, config do recibo e lojas habilitadas
    const [activeCampaign, receiptCfg, storesCfg] = await Promise.all([
      loyaltyRepository.getActiveCampaign(tenant_id),
      loyaltyRepository.getReceiptConfig(),
      loyaltyRepository.getEnabledStoresConfig(),
    ]);

    if ((storesCfg.disabled_tenant_ids || []).includes(tenant_id)) {
      return NextResponse.json(
        { error: 'Esta loja não participa do programa de Cashback.' },
        { status: 403 }
      );
    }
    const campaignMultiplier = activeCampaign ? Number(activeCampaign.multiplier) : 1.0;

    const result = await loyaltyRepository.creditPointsForOrder({
      tenant_id,
      customer_id,
      order_id,
      items,
      idempotency_key: idempotencyKey,
      cashier_user_id: cashier_user_id || user?.id,
      campaign_multiplier: campaignMultiplier,
    });

    if (!result.alreadyProcessed && result.pointsCredited > 0) {
      notifyLoyaltyCustomer(customer_id, {
        title: `Ganhaste +${result.pointsCredited} pontos!`,
        body: activeCampaign
          ? `${activeCampaign.title} aplicada. O teu novo saldo é ${result.newBalance} pts.`
          : `Obrigado pela tua visita! O teu novo saldo é ${result.newBalance} pts.`,
        data: { type: 'POINTS_CREDITED', points: result.pointsCredited, balance: result.newBalance },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        pointsCredited: result.pointsCredited,
        newBalance: result.newBalance,
        alreadyProcessed: result.alreadyProcessed ?? false,
        campaignApplied: activeCampaign?.title || null,
        showPointsOnReceipt: receiptCfg.show_points_on_receipt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/pdv/loyalty/credit:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao creditar pontos no PDV.' },
      { status: 500 }
    );
  }
}
