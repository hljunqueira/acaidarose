import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [referral, campaigns, birthday, receipt, stores, content, presentation, points_rate] = await Promise.all([
      loyaltyRepository.getReferralConfig(),
      loyaltyRepository.getCampaignsConfig(),
      loyaltyRepository.getBirthdayConfig(),
      loyaltyRepository.getReceiptConfig(),
      loyaltyRepository.getEnabledStoresConfig(),
      loyaltyRepository.getContentConfig(),
      loyaltyRepository.getPresentationConfig(),
      loyaltyRepository.getPointsRateConfig(),
    ]);
    return NextResponse.json(
      { referral, campaigns, birthday, receipt, stores, content, presentation, points_rate },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Erro em GET /api/loyalty/settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar configurações de fidelidade.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Apenas a Franqueadora pode alterar configurações de cashback.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const [currentReferral, currentCampaigns, currentBirthday, currentReceipt, currentStores] = await Promise.all([
      loyaltyRepository.getReferralConfig(),
      loyaltyRepository.getCampaignsConfig(),
      loyaltyRepository.getBirthdayConfig(),
      loyaltyRepository.getReceiptConfig(),
      loyaltyRepository.getEnabledStoresConfig(),
    ]);

    let referral = currentReferral;
    const hasReferralUpdate =
      body?.referral !== undefined ||
      typeof body?.enabled === 'boolean' ||
      body?.bonus_points !== undefined;

    if (hasReferralUpdate) {
      const enabled =
        typeof body?.referral?.enabled === 'boolean'
          ? body.referral.enabled
          : typeof body?.enabled === 'boolean'
          ? body.enabled
          : currentReferral.enabled;
      const bonusPoints =
        body?.referral?.bonus_points ?? body?.bonus_points ?? currentReferral.bonus_points;

      referral = await loyaltyRepository.updateReferralConfig({
        enabled,
        bonus_points: Number(bonusPoints),
      });
    }

    let campaigns = currentCampaigns;
    const hasCampaignsUpdate =
      body?.campaigns !== undefined ||
      typeof body?.campaigns_enabled === 'boolean' ||
      body?.default_multiplier !== undefined;

    if (hasCampaignsUpdate) {
      const enabled =
        typeof body?.campaigns?.enabled === 'boolean'
          ? body.campaigns.enabled
          : typeof body?.campaigns_enabled === 'boolean'
          ? body.campaigns_enabled
          : currentCampaigns.enabled;
      const defaultMultiplier =
        body?.campaigns?.default_multiplier ??
        body?.default_multiplier ??
        currentCampaigns.default_multiplier;

      campaigns = await loyaltyRepository.updateCampaignsConfig({
        enabled,
        default_multiplier: Number(defaultMultiplier),
      });
    }

    let birthday = currentBirthday;
    if (body?.birthday !== undefined) {
      birthday = await loyaltyRepository.updateBirthdayConfig({
        enabled:
          typeof body.birthday.enabled === 'boolean'
            ? body.birthday.enabled
            : currentBirthday.enabled,
        bonus_points: body.birthday.bonus_points ?? currentBirthday.bonus_points,
      });
    }

    let receipt = currentReceipt;
    if (body?.receipt !== undefined) {
      receipt = await loyaltyRepository.updateReceiptConfig({
        show_points_on_receipt:
          typeof body.receipt.show_points_on_receipt === 'boolean'
            ? body.receipt.show_points_on_receipt
            : currentReceipt.show_points_on_receipt,
      });
    }

    let stores = currentStores;
    if (body?.stores !== undefined && Array.isArray(body.stores.disabled_tenant_ids)) {
      stores = await loyaltyRepository.updateEnabledStoresConfig({
        disabled_tenant_ids: body.stores.disabled_tenant_ids,
      });
    }

    let content = await loyaltyRepository.getContentConfig();
    if (body?.content !== undefined && typeof body.content === 'object') {
      content = await loyaltyRepository.updateContentConfig({
        faq: Array.isArray(body.content.faq) ? body.content.faq : undefined,
        terms_text:
          typeof body.content.terms_text === 'string' ? body.content.terms_text : undefined,
        privacy_text:
          typeof body.content.privacy_text === 'string' ? body.content.privacy_text : undefined,
      });
    }

    let presentation = await loyaltyRepository.getPresentationConfig();
    if (body?.presentation !== undefined && Array.isArray(body.presentation.scenes)) {
      presentation = await loyaltyRepository.updatePresentationConfig({
        scenes: body.presentation.scenes,
      });
    }

    let points_rate = await loyaltyRepository.getPointsRateConfig();
    if (body?.points_rate !== undefined && body.points_rate?.points_per_euro !== undefined) {
      points_rate = await loyaltyRepository.updatePointsRateConfig({
        points_per_euro: Number(body.points_rate.points_per_euro),
      });
    }

    return NextResponse.json(
      { referral, campaigns, birthday, receipt, stores, content, presentation, points_rate },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em PATCH /api/loyalty/settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar configurações de fidelidade.' },
      { status: 500 }
    );
  }
}
