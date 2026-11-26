import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const payload = loyaltyAuth.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Sessão expirada ou não autorizada. Faça login novamente.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reward_id, tenant_id } = body;

    if (!reward_id) {
      return NextResponse.json(
        { error: 'ID do prémio é obrigatório.' },
        { status: 400 }
      );
    }

    let targetTenantId = tenant_id || payload.tenantId || null;
    if (!targetTenantId) {
      const hqRes = await query(
        `SELECT id FROM tenants WHERE deleted_at IS NULL AND active = true ORDER BY is_headquarters DESC, created_at ASC LIMIT 1`
      );
      targetTenantId = hqRes.rows[0]?.id || null;
    }
    if (!targetTenantId) {
      return NextResponse.json(
        { error: 'Nenhuma loja ativa encontrada para emitir o voucher.' },
        { status: 400 }
      );
    }

    const storesCfg = await loyaltyRepository.getEnabledStoresConfig();
    if ((storesCfg.disabled_tenant_ids || []).includes(targetTenantId)) {
      return NextResponse.json(
        { error: 'A loja selecionada não participa atualmente do programa de Cashback.' },
        { status: 403 }
      );
    }

    const voucher = await loyaltyRepository.generateRewardVoucher(
      payload.customerId,
      reward_id,
      targetTenantId
    );

    return NextResponse.json(
      {
        success: true,
        voucher,
        message: 'Prémio resgatado com sucesso! Apresenta o voucher no balcão dentro de 24 horas.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/rewards/redeem:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao resgatar prémio.' },
      { status: 400 }
    );
  }
}
