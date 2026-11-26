import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || undefined;

    const [rewards, activeCampaign, activeCampaigns, referral] = await Promise.all([
      loyaltyRepository.listActiveRewards(tenantId),
      loyaltyRepository.getActiveCampaign(tenantId),
      loyaltyRepository.listActiveCampaigns(tenantId),
      loyaltyRepository.getReferralConfig(),
    ]);

    return NextResponse.json(
      {
        rewards,
        campaign: activeCampaign,
        campaigns: activeCampaigns,
        referral,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Erro em /api/loyalty/rewards:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar catálogo de prémios.' },
      { status: 500 }
    );
  }
}
