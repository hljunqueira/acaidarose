import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Acesso restrito à Franqueadora Master.' },
      { status: 403 }
    );
  }

  try {
    await Promise.all([
      query(`ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`),
      loyaltyRepository.ensureCampaignExtraColumns(),
    ]);

    const [
      referral,
      campaignsConfig,
      birthdayConfig,
      receiptConfig,
      storesConfig,
      contentConfig,
      presentationConfig,
      pointsRateConfig,
      pushLogs,
      statsRes,
      rewardsRes,
      campaignsRes,
      customersRes,
      vouchersRes,
      clearingRes,
      tenantsRes,
      catalogProductsRes,
    ] = await Promise.all([
      loyaltyRepository.getReferralConfig(),
      loyaltyRepository.getCampaignsConfig(),
      loyaltyRepository.getBirthdayConfig(),
      loyaltyRepository.getReceiptConfig(),
      loyaltyRepository.getEnabledStoresConfig(),
      loyaltyRepository.getContentConfig(),
      loyaltyRepository.getPresentationConfig(),
      loyaltyRepository.getPointsRateConfig(),
      loyaltyRepository.listPushLogs(30),
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM loyalty_customers WHERE status = 'ACTIVE') AS total_customers,
          (SELECT COUNT(*)::int FROM loyalty_customers WHERE status = 'ACTIVE' AND push_token IS NOT NULL) AS push_enabled_customers,
          (SELECT COALESCE(SUM(points_balance), 0)::int FROM loyalty_customers WHERE status = 'ACTIVE') AS total_points,
          (SELECT COUNT(*)::int FROM loyalty_vouchers WHERE status = 'ACTIVE' AND expires_at > NOW()) AS active_vouchers,
          (SELECT COUNT(*)::int FROM loyalty_vouchers WHERE status = 'REDEEMED') AS redeemed_vouchers,
          (SELECT COALESCE(SUM(cost_amount), 0)::float FROM loyalty_clearing_settlements WHERE status = 'PENDING') AS pending_clearing_eur
      `),
      query(`
        SELECT r.*, t.name AS tenant_name,
               (SELECT COUNT(*)::int FROM loyalty_vouchers v WHERE v.reward_id = r.id) AS total_redemptions
        FROM loyalty_rewards r
        LEFT JOIN tenants t ON t.id = r.tenant_id
        WHERE r.deleted_at IS NULL
        ORDER BY r.active DESC, r.order_index ASC, r.points_cost ASC
      `),
      query(`
        SELECT c.*, t.name AS tenant_name
        FROM loyalty_campaigns c
        LEFT JOIN tenants t ON t.id = c.tenant_id
        ORDER BY c.active DESC, c.start_date DESC
      `),
      query(`
        SELECT c.id, c.name, c.username, c.phone, c.email, c.nif, c.points_balance,
               c.referral_code, c.status, c.created_at, c.tenant_id, t.name AS tenant_name,
               (SELECT COUNT(*)::int FROM loyalty_customers r WHERE r.referred_by_id = c.id) AS referrals_count
        FROM loyalty_customers c
        LEFT JOIN tenants t ON t.id = c.tenant_id
        WHERE c.status = 'ACTIVE'
        ORDER BY c.points_balance DESC, c.created_at DESC
        LIMIT 5000
      `),
      query(`
        SELECT v.id, v.voucher_code, v.status, v.expires_at, v.redeemed_at, v.created_at,
               c.name AS customer_name, c.username AS customer_username, c.phone AS customer_phone,
               r.name AS reward_name, r.points_cost,
               t.name AS tenant_name
        FROM loyalty_vouchers v
        JOIN loyalty_customers c ON c.id = v.customer_id
        JOIN loyalty_rewards r ON r.id = v.reward_id
        LEFT JOIN tenants t ON t.id = v.tenant_id
        ORDER BY v.created_at DESC
        LIMIT 60
      `),
      query(`
        SELECT s.id, s.cost_amount, s.status, s.settled_at, s.created_at,
               v.voucher_code,
               it.name AS issuing_tenant_name,
               rt.name AS redeeming_tenant_name
        FROM loyalty_clearing_settlements s
        JOIN loyalty_vouchers v ON v.id = s.voucher_id
        LEFT JOIN tenants it ON it.id = s.issuing_tenant_id
        LEFT JOIN tenants rt ON rt.id = s.redeeming_tenant_id
        ORDER BY s.created_at DESC
        LIMIT 60
      `),
      query(`SELECT id, name, city, is_headquarters FROM tenants WHERE deleted_at IS NULL AND active = true ORDER BY is_headquarters DESC, name ASC`),
      query(`
        SELECT * FROM (
          SELECT DISTINCT ON (LOWER(TRIM(pc.name)))
                 pc.id,
                 pc.name,
                 pc.description,
                 pc.preco_base::float AS preco_base,
                 pc.weight_grams,
                 pc.display_order,
                 COALESCE(pc.image_url, pc.video_poster) AS image_url,
                 cat.name AS category_name,
                 cat.display_order AS cat_order,
                 m.name AS menu_name,
                 m.display_order AS menu_order
          FROM product_containers pc
          LEFT JOIN categories cat ON cat.id = pc.category_id
          LEFT JOIN menus m ON m.id = cat.menu_id
          LEFT JOIN tenants t ON t.id = pc.tenant_id
          WHERE pc.deleted_at IS NULL
            AND pc.active = true
          ORDER BY LOWER(TRIM(pc.name)), t.is_headquarters DESC NULLS LAST, pc.display_order ASC
        ) sub
        ORDER BY
          CASE
            WHEN LOWER(COALESCE(sub.menu_name, '') || ' ' || COALESCE(sub.category_name, '') || ' ' || sub.name) ~ '(açaí|acai|copo|sensação|sensacao|família|familia|taça|taca)'
            THEN 0
            ELSE 1
          END ASC,
          COALESCE(sub.menu_order, 999) ASC,
          COALESCE(sub.cat_order, 999) ASC,
          COALESCE(sub.weight_grams, 99999) ASC,
          COALESCE(sub.display_order, 999) ASC,
          sub.name ASC
      `),
    ]);

    return NextResponse.json(
      {
        stats: statsRes.rows[0] || {
          total_customers: 0,
          total_points: 0,
          active_vouchers: 0,
          redeemed_vouchers: 0,
          pending_clearing_eur: 0,
        },
        referral,
        campaigns_config: campaignsConfig,
        birthday_config: birthdayConfig,
        receipt_config: receiptConfig,
        stores_config: storesConfig,
        content_config: contentConfig,
        presentation_config: presentationConfig,
        points_rate_config: pointsRateConfig,
        push_logs: pushLogs,
        rewards: rewardsRes.rows || [],
        campaigns: campaignsRes.rows || [],
        customers: customersRes.rows || [],
        vouchers: vouchersRes.rows || [],
        clearing: clearingRes.rows || [],
        tenants: tenantsRes.rows || [],
        catalog_products: catalogProductsRes.rows || [],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em GET /api/loyalty/admin/overview:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar painel de cashback.' },
      { status: 500 }
    );
  }
}
