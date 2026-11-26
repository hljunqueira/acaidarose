// ============================================================================
// AÇAÍ DA ROSE - TIPOS TYPESCRIPT DO MÓDULO DE CASHBACK & FIDELIDADE
// ============================================================================

export type LoyaltyCustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface LoyaltyCustomer {
  id: string;
  tenant_id: string | null;
  username: string;
  phone: string;
  name: string;
  email: string | null;
  nif: string | null;
  birth_date: string | null;
  password_hash?: string;
  push_token?: string | null;
  push_platform?: 'ios' | 'android' | null;
  points_balance: number;
  referral_code: string;
  referred_by_id: string | null;
  avatar_url: string | null;
  status: LoyaltyCustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyReward {
  id: string;
  tenant_id: string | null;
  product_container_id: string | null;
  code: string | null;
  name: string;
  description: string | null;
  points_cost: number;
  category: string;
  image_url: string | null;
  active: boolean;
  order_index: number;
  created_at: string;
  // Campos preenchidos via JOIN com product_containers quando disponível
  preco_base?: number | null;
  weight_grams?: number | null;
}

export type LoyaltyTransactionType = 'CREDIT' | 'DEBIT';
export type LoyaltyTransactionStatus = 'APPROVED' | 'PENDING' | 'CANCELLED';

export interface LoyaltyTransaction {
  id: string;
  tenant_id: string;
  tenant_name?: string | null;
  tenant_city?: string | null;
  customer_id: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  order_id: string | null;
  idempotency_key: string | null;
  offline_synced: boolean;
  cashier_user_id: string | null;
  status: LoyaltyTransactionStatus;
  created_at: string;
}

export type LoyaltyVoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'REFUNDED';

export interface LoyaltyVoucher {
  id: string;
  tenant_id: string;
  customer_id: string;
  reward_id: string;
  voucher_code: string;
  status: LoyaltyVoucherStatus;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_order_id: string | null;
  cashier_user_id: string | null;
  created_at: string;
  // Join com o prêmio
  reward?: LoyaltyReward;
}

export interface LoyaltyCampaign {
  id: string;
  tenant_id: string | null;
  title: string;
  description: string | null;
  multiplier: number;
  start_date: string;
  end_date: string;
  active: boolean;
  banner_url: string | null;
  created_at: string;
}

export type LoyaltyClearingStatus = 'PENDING' | 'SETTLED_IN_ROYALTIES';

export interface LoyaltyClearingSettlement {
  id: string;
  issuing_tenant_id: string;
  redeeming_tenant_id: string;
  voucher_id: string;
  cost_amount: number;
  status: LoyaltyClearingStatus;
  settled_at: string | null;
  created_at: string;
}

export interface LoyaltyAd {
  id: string;
  tenant_id: string | null;
  advertiser_name: string;
  campaign_title: string;
  badge_label: string;
  banner_url: string;
  target_url: string;
  placement: 'HOME_FEED' | 'REWARDS_TOP' | 'VOUCHER_MODAL';
  start_date: string;
  end_date: string;
  priority: number;
  impressions_count: number;
  clicks_count: number;
  active: boolean;
  created_at: string;
}

export interface LoyaltySettings {
  id: string;
  tenant_id: string | null;
  key: string;
  value: Record<string, any>;
  description: string | null;
  updated_at: string;
}

// ============================================================================
// DTOs DE REQUISIÇÃO E RESPOSTA PARA PDV E MOBILE API
// ============================================================================

export interface PDVCustomerLookupResult {
  customer: {
    id: string;
    name: string;
    username: string;
    phone: string;
    points_balance: number;
  } | null;
  active_vouchers: Array<{
    id: string;
    voucher_code: string;
    reward_name: string;
    points_cost: number;
    expires_at: string;
    product_container_id: string | null;
  }>;
}

export interface PDVCreditPointsInput {
  tenant_id: string;
  customer_id: string;
  order_id?: string;
  items: Array<{
    product_id: string;
    name: string;
    line_total: number;
    cashback_enabled?: boolean;
  }>;
  idempotency_key?: string;
  cashier_user_id?: string;
  campaign_multiplier?: number;
}

export interface PDVRedeemVoucherInput {
  voucher_code: string;
  tenant_id: string;
  order_id?: string;
  cashier_user_id?: string;
}

export interface LoyaltyRegisterInput {
  phone: string;
  name: string;
  password: string; // PIN de 4 dígitos ou palavra-passe
  referral_code?: string;
  tenant_id?: string;
}

export interface LoyaltyLoginInput {
  login: string; // Telemóvel ou @username
  password: string;
}

export interface LoyaltyAuthResponse {
  customer: {
    id: string;
    username: string;
    phone: string;
    name: string;
    email: string | null;
    nif?: string | null;
    birth_date?: string | null;
    points_balance: number;
    referral_code: string;
    avatar_url: string | null;
    tenant_id: string | null;
  };
  accessToken: string;
  refreshToken: string;
}
