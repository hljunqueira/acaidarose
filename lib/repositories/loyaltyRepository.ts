import { query, withTransaction } from '@/lib/db/postgres';
import {
  LoyaltyCustomer,
  LoyaltyReward,
  LoyaltyTransaction,
  LoyaltyVoucher,
  LoyaltyCampaign,
  PDVCustomerLookupResult,
  PDVCreditPointsInput,
  PDVRedeemVoucherInput,
} from '@/types/loyalty';
import crypto from 'crypto';
import { notifyLoyaltyCustomer } from '@/lib/services/expoPush';

const ALPHANUMERIC_SAFE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomAlphanumeric(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHANUMERIC_SAFE[crypto.randomInt(0, ALPHANUMERIC_SAFE.length)];
  }
  return out;
}

/**
 * Gera código único de voucher com letras e números aleatórios (ex: ROSE-A7K9X2)
 * Usa alfabeto sem caracteres ambíguos (0/O, 1/I/L).
 */
function generateVoucherCode(): string {
  return `ROSE-${randomAlphanumeric(6)}`;
}

/**
 * Gera código de indicação com o primeiro nome do cliente + número aleatório (ex: HENRIQUE4821)
 */
function generateReferralCode(customerName?: string): string {
  const firstWord = (customerName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)[0] || '';
  const cleanName = firstWord.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8);
  const prefix = cleanName.length >= 2 ? cleanName : 'ROSE';
  const randomNum = crypto.randomInt(1000, 9999);
  return `${prefix}${randomNum}`;
}

export const loyaltyRepository = {
  // ==========================================================================
  // CLIENTES (AUTENTICAÇÃO & PERFIL)
  // ==========================================================================

  async findCustomerByLogin(login: string): Promise<LoyaltyCustomer | null> {
    const cleanLogin = login.trim().toLowerCase();
    const cleanPhone = login.replace(/\D/g, ''); // Apenas dígitos para busca telefônica
    const phoneSuffix = cleanPhone.length >= 6 ? `%${cleanPhone.slice(-9)}` : '';

    const res = await query(
      `SELECT * FROM loyalty_customers 
       WHERE status = 'ACTIVE'
         AND (
           LOWER(username) = $1 
           OR LOWER(username) = $2
           OR phone = $3 
           OR ($4 <> '' AND phone LIKE $4)
         )
       LIMIT 1`,
      [
        cleanLogin,
        cleanLogin.startsWith('@') ? cleanLogin.slice(1) : `@${cleanLogin}`,
        cleanLogin,
        phoneSuffix,
      ]
    );

    return res.rows[0] || null;
  },

  async findCustomerById(id: string): Promise<LoyaltyCustomer | null> {
    const res = await query(`SELECT * FROM loyalty_customers WHERE id = $1 LIMIT 1`, [id]);
    return res.rows[0] || null;
  },

  async isUsernameAvailable(username: string): Promise<boolean> {
    const normalized = username.trim().toLowerCase().startsWith('@')
      ? username.trim().toLowerCase()
      : `@${username.trim().toLowerCase()}`;
    const res = await query(
      `SELECT id FROM loyalty_customers WHERE LOWER(username) = $1 LIMIT 1`,
      [normalized]
    );
    return res.rows.length === 0;
  },

  async createCustomer(data: {
    phone: string;
    name: string;
    password_hash: string;
    username?: string;
    nif?: string;
    tenant_id?: string;
    referral_code_used?: string;
  }): Promise<LoyaltyCustomer> {
    let username = data.username?.trim().toLowerCase();
    if (!username) {
      const cleanName = data.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const randomSuffix = crypto.randomInt(100, 999);
      username = `@${cleanName || 'cliente'}_${randomSuffix}`;
    } else if (!username.startsWith('@')) {
      username = `@${username}`;
    }

    let referredById: string | null = null;
    if (data.referral_code_used) {
      const refConfig = await this.getReferralConfig();
      if (refConfig.enabled) {
        const cleanRef = data.referral_code_used.trim().toUpperCase();
        const refCheck = await query(
          `SELECT id FROM loyalty_customers WHERE UPPER(referral_code) = $1 AND status = 'ACTIVE' LIMIT 1`,
          [cleanRef]
        );
        if (refCheck.rows[0]) {
          referredById = refCheck.rows[0].id;
        }
      }
    }

    // Garante código de referral único (Primeiro Nome + 4 dígitos aleatórios)
    let referralCode = generateReferralCode(data.name);
    let unique = false;
    while (!unique) {
      const check = await query(
        `SELECT id FROM loyalty_customers WHERE UPPER(referral_code) = $1 LIMIT 1`,
        [referralCode]
      );
      if (check.rows.length === 0) {
        unique = true;
      } else {
        referralCode = generateReferralCode(data.name);
      }
    }

    const res = await query(
      `INSERT INTO loyalty_customers (
        tenant_id, username, phone, name, password_hash, nif, 
        referral_code, referred_by_id, points_balance, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'ACTIVE')
      RETURNING *`,
      [
        data.tenant_id || null,
        username,
        data.phone.trim(),
        data.name.trim(),
        data.password_hash,
        data.nif?.trim() || null,
        referralCode,
        referredById,
      ]
    );

    return res.rows[0];
  },

  async updateCustomerPushToken(
    customerId: string,
    token: string | null,
    platform: 'ios' | 'android' | null
  ): Promise<void> {
    await query(
      `UPDATE loyalty_customers 
       SET push_token = $1, push_platform = $2, updated_at = NOW() 
       WHERE id = $3`,
      [token, platform, customerId]
    );
  },

  async updateCustomerPassword(customerId: string, passwordHash: string): Promise<void> {
    await query(
      `UPDATE loyalty_customers 
       SET password_hash = $1, updated_at = NOW() 
       WHERE id = $2`,
      [passwordHash, customerId]
    );
  },

  async updateRefreshTokenHash(customerId: string, tokenHash: string | null): Promise<void> {
    await query(
      `UPDATE loyalty_customers 
       SET refresh_token_hash = $1, updated_at = NOW() 
       WHERE id = $2`,
      [tokenHash, customerId]
    );
  },

  async updateCustomerProfile(
    customerId: string,
    data: {
      name?: string;
      email?: string | null;
      nif?: string | null;
      birth_date?: string | null;
      tenant_id?: string | null;
      avatar_url?: string | null;
    }
  ): Promise<LoyaltyCustomer | null> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      sets.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.email !== undefined) {
      sets.push(`email = $${idx++}`);
      values.push(data.email ? data.email.trim().toLowerCase() : null);
    }
    if (data.nif !== undefined) {
      sets.push(`nif = $${idx++}`);
      values.push(data.nif ? data.nif.trim() : null);
    }
    if (data.birth_date !== undefined) {
      sets.push(`birth_date = $${idx++}`);
      values.push(data.birth_date || null);
    }
    if (data.tenant_id !== undefined) {
      sets.push(`tenant_id = $${idx++}`);
      values.push(data.tenant_id || null);
    }
    if (data.avatar_url !== undefined) {
      sets.push(`avatar_url = $${idx++}`);
      values.push(data.avatar_url || null);
    }

    if (sets.length === 0) {
      return this.findCustomerById(customerId);
    }

    sets.push('updated_at = NOW()');
    values.push(customerId);

    const res = await query(
      `UPDATE loyalty_customers SET ${sets.join(', ')} WHERE id = $${idx} AND status = 'ACTIVE' RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },

  async countCustomerReferrals(customerId: string): Promise<number> {
    const res = await query(
      `SELECT COUNT(*)::int AS total FROM loyalty_customers WHERE referred_by_id = $1`,
      [customerId]
    );
    return Number(res.rows[0]?.total || 0);
  },

  async anonymizeCustomerAccount(customerId: string): Promise<boolean> {
    return await withTransaction(async (client) => {
      const updated = await client.query(
        `UPDATE loyalty_customers
         SET status = 'INACTIVE',
             name = 'Conta Eliminada',
             username = '@deleted_' || SUBSTRING(id::text, 1, 8),
             phone = 'DEL-' || SUBSTRING(id::text, 1, 12),
             email = NULL,
             nif = NULL,
             birth_date = NULL,
             push_token = NULL,
             push_platform = NULL,
             refresh_token_hash = NULL,
             avatar_url = NULL,
             points_balance = 0,
             updated_at = NOW()
         WHERE id = $1 AND status = 'ACTIVE'
         RETURNING id`,
        [customerId]
      );

      if (updated.rows.length === 0) {
        return false;
      }

      await client.query(
        `UPDATE loyalty_vouchers
         SET status = 'EXPIRED'
         WHERE customer_id = $1 AND status = 'ACTIVE'`,
        [customerId]
      );

      return true;
    });
  },

  // ==========================================================================
  // OPERAÇÕES DO PDV BALCÃO
  // ==========================================================================

  async lookupCustomerForPDV(queryText: string): Promise<PDVCustomerLookupResult> {
    let customer: LoyaltyCustomer | null = null;
    const trimmed = queryText.trim();

    // Suporte nativo ao QR Code dinâmico da app mobile: {"id":"...","phone":"...","type":"CUSTOMER_IDENTIFIER","ts":...}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed?.id && typeof parsed.id === 'string') {
          const byId = await this.findCustomerById(parsed.id);
          if (byId && byId.status === 'ACTIVE') {
            customer = byId;
          }
        }
        if (!customer && parsed?.phone) {
          customer = await this.findCustomerByLogin(String(parsed.phone));
        }
      } catch {
        // Segue para busca normal
      }
    }

    if (!customer) {
      customer = await this.findCustomerByLogin(trimmed);
    }

    if (!customer) {
      return { customer: null, active_vouchers: [] };
    }

    const vouchersRes = await query(
      `SELECT v.id, v.voucher_code, v.expires_at, 
              r.name as reward_name, r.points_cost, r.product_container_id
       FROM loyalty_vouchers v
       JOIN loyalty_rewards r ON r.id = v.reward_id
       WHERE v.customer_id = $1 
         AND v.status = 'ACTIVE' 
         AND v.expires_at > NOW()
       ORDER BY v.created_at ASC`,
      [customer.id]
    );

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        username: customer.username,
        phone: customer.phone,
        points_balance: customer.points_balance,
      },
      active_vouchers: vouchersRes.rows,
    };
  },

  /**
   * Credita pontos por fechamento de pedido no PDV com garantia de idempotência.
   * Filtra exclusivamente itens elegíveis (cashback_enabled = true).
   */
  async creditPointsForOrder(input: PDVCreditPointsInput): Promise<{
    pointsCredited: number;
    newBalance: number;
    alreadyProcessed?: boolean;
  }> {
    // 1. Idempotência estrita: se já existir transação com esta chave, retorna sem duplicar
    if (input.idempotency_key) {
      const existing = await query(
        `SELECT points FROM loyalty_transactions WHERE idempotency_key = $1 LIMIT 1`,
        [input.idempotency_key]
      );
      if (existing.rows[0]) {
        const cust = await this.findCustomerById(input.customer_id);
        return {
          pointsCredited: existing.rows[0].points,
          newBalance: cust?.points_balance ?? 0,
          alreadyProcessed: true,
        };
      }
    }

    // 2. Calcula total elegível (apenas itens com cashback_enabled = true)
    const eligibleTotal = input.items
      .filter((item) => item.cashback_enabled !== false)
      .reduce((sum, item) => sum + (Number(item.line_total) || 0), 0);

    const multiplier = Number(input.campaign_multiplier) || 1.0;
    const pointsToCredit = Math.floor(eligibleTotal * multiplier);

    if (pointsToCredit <= 0) {
      const cust = await this.findCustomerById(input.customer_id);
      return {
        pointsCredited: 0,
        newBalance: cust?.points_balance ?? 0,
      };
    }

    // 3. Execução em transação atômica
    const refConfig = await this.getReferralConfig();
    let referralAwarded: { referrerId: string; bonus: number; inviteeName: string } | null = null;

    const txResult = await withTransaction(async (client) => {
      // Trava a linha do cliente para concorrência
      const custRes = await client.query(
        `SELECT points_balance, referred_by_id, username, name FROM loyalty_customers WHERE id = $1 FOR UPDATE`,
        [input.customer_id]
      );

      if (!custRes.rows[0]) {
        throw new Error('Cliente de fidelidade não encontrado.');
      }

      const currentBalance = custRes.rows[0].points_balance;
      const referredById: string | null = custRes.rows[0].referred_by_id || null;
      const customerUsername: string = custRes.rows[0].username || '';
      const customerName: string = custRes.rows[0].name || customerUsername || 'novo cliente';
      let newBalance = currentBalance + pointsToCredit;

      // Atualiza o saldo do cliente
      await client.query(
        `UPDATE loyalty_customers 
         SET points_balance = $1, updated_at = NOW() 
         WHERE id = $2`,
        [newBalance, input.customer_id]
      );

      // Insere o extrato com chave de idempotência
      await client.query(
        `INSERT INTO loyalty_transactions (
          tenant_id, customer_id, type, points, description, 
          order_id, idempotency_key, cashier_user_id, status
        ) VALUES ($1, $2, 'CREDIT', $3, $4, $5, $6, $7, 'APPROVED')`,
        [
          input.tenant_id,
          input.customer_id,
          pointsToCredit,
          `Pontos de compra — Pedido #${input.order_id?.slice(0, 8) || 'Balcão'}`,
          input.order_id || null,
          input.idempotency_key || null,
          input.cashier_user_id || null,
        ]
      );

      // Bónus de indicação na 1ª compra do convidado (se ativo pelo admin)
      if (referredById && refConfig.enabled && refConfig.bonus_points > 0) {
        const inviteeKey = `REFERRAL_BONUS_INVITEE_${input.customer_id}`;
        const referrerKey = `REFERRAL_BONUS_REFERRER_${input.customer_id}`;
        const alreadyAwarded = await client.query(
          `SELECT id FROM loyalty_transactions WHERE idempotency_key = $1 LIMIT 1`,
          [inviteeKey]
        );

        if (alreadyAwarded.rows.length === 0) {
          const bonus = refConfig.bonus_points;
          newBalance += bonus;

          await client.query(
            `UPDATE loyalty_customers SET points_balance = points_balance + $1, updated_at = NOW() WHERE id = $2`,
            [bonus, input.customer_id]
          );
          await client.query(
            `INSERT INTO loyalty_transactions (
              tenant_id, customer_id, type, points, description, idempotency_key, status
            ) VALUES ($1, $2, 'CREDIT', $3, $4, $5, 'APPROVED')`,
            [
              input.tenant_id,
              input.customer_id,
              bonus,
              'Bónus de boas-vindas — Convite de amigo',
              inviteeKey,
            ]
          );

          await client.query(
            `UPDATE loyalty_customers SET points_balance = points_balance + $1, updated_at = NOW() WHERE id = $2`,
            [bonus, referredById]
          );
          await client.query(
            `INSERT INTO loyalty_transactions (
              tenant_id, customer_id, type, points, description, idempotency_key, status
            ) VALUES ($1, $2, 'CREDIT', $3, $4, $5, 'APPROVED')`,
            [
              input.tenant_id,
              referredById,
              bonus,
              `Bónus Convidar Amigo (${customerUsername || 'novo cliente'})`,
              referrerKey,
            ]
          );

          referralAwarded = {
            referrerId: referredById,
            bonus,
            inviteeName: customerName,
          };
        }
      }

      return {
        pointsCredited: pointsToCredit,
        newBalance,
      };
    });

    if (referralAwarded) {
      const awarded = referralAwarded as { referrerId: string; bonus: number; inviteeName: string };
      notifyLoyaltyCustomer(awarded.referrerId, {
        title: `Ganhaste +${awarded.bonus} pontos de convite!`,
        body: `${awarded.inviteeName} fez a primeira compra com o teu código de convite.`,
        data: { type: 'REFERRAL_BONUS', points: awarded.bonus },
      }).catch(() => {});
    }

    return txResult;
  },

  /**
   * Valida e queima um voucher no balcão do PDV com trava atômica SELECT FOR UPDATE.
   */
  async redeemVoucherInPDV(input: PDVRedeemVoucherInput): Promise<{
    success: boolean;
    rewardName: string;
    voucherCode: string;
    customerId: string;
  }> {
    const cleanCode = input.voucher_code.trim().toUpperCase();

    return await withTransaction(async (client) => {
      // 1. Trava estrita de linha para evitar resgates concorrentes em múltiplos caixas
      const voucherRes = await client.query(
        `SELECT v.*, r.name as reward_name, r.points_cost 
         FROM loyalty_vouchers v
         JOIN loyalty_rewards r ON r.id = v.reward_id
         WHERE UPPER(v.voucher_code) = $1 
         FOR UPDATE`,
        [cleanCode]
      );

      const voucher = voucherRes.rows[0];
      if (!voucher) {
        throw new Error('Voucher de fidelidade não encontrado.');
      }

      if (voucher.status === 'REDEEMED') {
        throw new Error('Este voucher já foi resgatado anteriormente.');
      }

      if (voucher.status === 'EXPIRED' || new Date(voucher.expires_at) < new Date()) {
        throw new Error('Este voucher expirou.');
      }

      if (voucher.status !== 'ACTIVE') {
        throw new Error(`Voucher não está ativo (Status: ${voucher.status}).`);
      }

      // 2. Atualiza voucher para REDEEMED
      await client.query(
        `UPDATE loyalty_vouchers 
         SET status = 'REDEEMED', 
             redeemed_at = NOW(), 
             redeemed_order_id = $1, 
             cashier_user_id = $2
         WHERE id = $3`,
        [input.order_id || null, input.cashier_user_id || null, voucher.id]
      );

      // 3. Se a loja de resgate for diferente da loja de emissão, registra compensação B2B
      if (voucher.tenant_id !== input.tenant_id) {
        // Custo estimado de insumo (CMV padrão aprox 2.00 €)
        const estimatedCmv = 2.0;
        await client.query(
          `INSERT INTO loyalty_clearing_settlements (
            issuing_tenant_id, redeeming_tenant_id, voucher_id, cost_amount, status
          ) VALUES ($1, $2, $3, $4, 'PENDING')`,
          [voucher.tenant_id, input.tenant_id, voucher.id, estimatedCmv]
        );
      }

      return {
        success: true,
        rewardName: voucher.reward_name,
        voucherCode: voucher.voucher_code,
        customerId: voucher.customer_id,
      };
    });
  },

  // ==========================================================================
  // CATÁLOGO DE RECOMPENSAS & RESGATE PELO CLIENTE (APP MOBILE)
  // ==========================================================================

  async listActiveRewards(tenantId?: string): Promise<LoyaltyReward[]> {
    const res = await query(
      `SELECT r.*, 
              COALESCE(r.image_url, pc.image_url, pc.video_poster) as display_image,
              pc.preco_base,
              pc.weight_grams
       FROM loyalty_rewards r
       LEFT JOIN product_containers pc ON pc.id = r.product_container_id
       WHERE r.active = TRUE
         AND (r.tenant_id IS NULL OR r.tenant_id = $1 OR $1 IS NULL)
       ORDER BY r.order_index ASC, r.points_cost ASC`,
      [tenantId || null]
    );

    return res.rows.map((row) => ({
      ...row,
      image_url: row.display_image || row.image_url,
    }));
  },

  /**
   * Resgate de prêmio iniciado pelo cliente no app mobile.
   * Debita os pontos e cria o voucher de 24h.
   */
  async generateRewardVoucher(
    customerId: string,
    rewardId: string,
    tenantId: string
  ): Promise<LoyaltyVoucher> {
    return await withTransaction(async (client) => {
      // 1. Busca e trava o cliente
      const custRes = await client.query(
        `SELECT points_balance FROM loyalty_customers WHERE id = $1 FOR UPDATE`,
        [customerId]
      );
      const customer = custRes.rows[0];
      if (!customer) {
        throw new Error('Cliente não encontrado.');
      }

      // 2. Busca o prémio ativo e não excluído
      await client.query(`ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
      const rewardRes = await client.query(
        `SELECT * FROM loyalty_rewards WHERE id = $1 AND active = TRUE AND deleted_at IS NULL LIMIT 1`,
        [rewardId]
      );
      const reward = rewardRes.rows[0];
      if (!reward) {
        throw new Error('Prémio indisponível ou inativo.');
      }

      if (reward.tenant_id && reward.tenant_id !== tenantId) {
        throw new Error('Este prémio é exclusivo de outra unidade.');
      }

      if (customer.points_balance < reward.points_cost) {
        throw new Error(
          `Saldo insuficiente. Necessário: ${reward.points_cost} pts, Disponível: ${customer.points_balance} pts.`
        );
      }

      // 3. Debita pontos do cliente
      const newBalance = customer.points_balance - reward.points_cost;
      await client.query(
        `UPDATE loyalty_customers 
         SET points_balance = $1, updated_at = NOW() 
         WHERE id = $2`,
        [newBalance, customerId]
      );

      // 4. Registra transação DEBIT
      await client.query(
        `INSERT INTO loyalty_transactions (
          tenant_id, customer_id, type, points, description, status
        ) VALUES ($1, $2, 'DEBIT', $3, $4, 'APPROVED')`,
        [tenantId, customerId, reward.points_cost, `Troca de pontos por: ${reward.name}`]
      );

      // 5. Gera código único alfanumérico aleatório com validade de 24 horas
      let voucherCode = generateVoucherCode();
      let uniqueCode = false;
      while (!uniqueCode) {
        const exists = await client.query(
          `SELECT id FROM loyalty_vouchers WHERE UPPER(voucher_code) = $1 LIMIT 1`,
          [voucherCode]
        );
        if (exists.rows.length === 0) {
          uniqueCode = true;
        } else {
          voucherCode = generateVoucherCode();
        }
      }
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

      const voucherRes = await client.query(
        `INSERT INTO loyalty_vouchers (
          tenant_id, customer_id, reward_id, voucher_code, status, expires_at
        ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
        RETURNING *`,
        [tenantId, customerId, reward.id, voucherCode, expiresAt.toISOString()]
      );

      return {
        ...voucherRes.rows[0],
        reward,
      };
    });
  },

  async listCustomerVouchers(customerId: string): Promise<LoyaltyVoucher[]> {
    const res = await query(
      `SELECT v.*, 
              r.name as reward_name, 
              r.points_cost, 
              r.category as reward_category,
              r.product_container_id,
              COALESCE(r.image_url, pc.image_url, pc.video_poster) as reward_image
       FROM loyalty_vouchers v
       JOIN loyalty_rewards r ON r.id = v.reward_id
       LEFT JOIN product_containers pc ON pc.id = r.product_container_id
       WHERE v.customer_id = $1
       ORDER BY v.created_at DESC`,
      [customerId]
    );

    return res.rows.map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      customer_id: row.customer_id,
      reward_id: row.reward_id,
      voucher_code: row.voucher_code,
      status: row.status,
      expires_at: row.expires_at,
      redeemed_at: row.redeemed_at,
      redeemed_order_id: row.redeemed_order_id,
      cashier_user_id: row.cashier_user_id,
      created_at: row.created_at,
      reward: {
        id: row.reward_id,
        tenant_id: row.tenant_id,
        product_container_id: row.product_container_id,
        code: null,
        name: row.reward_name,
        description: null,
        points_cost: row.points_cost,
        category: row.reward_category,
        image_url: row.reward_image,
        active: true,
        order_index: 0,
        created_at: row.created_at,
      },
    }));
  },

  async listCustomerTransactions(
    customerId: string,
    limit = 20,
    offset = 0
  ): Promise<LoyaltyTransaction[]> {
    const res = await query(
      `SELECT lt.*, t.name AS tenant_name, t.city AS tenant_city
       FROM loyalty_transactions lt
       LEFT JOIN tenants t ON t.id = lt.tenant_id
       WHERE lt.customer_id = $1 
       ORDER BY lt.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );
    return res.rows.map((row) => ({
      ...row,
      description:
        row.description === 'Crédito manual de pontos pela Franqueadora'
          ? 'Créditos concedidos pelo Açaí da Rose'
          : row.description === 'Ajuste/débito manual de pontos pela Franqueadora'
            ? 'Ajustes pelo Açaí da Rose'
            : row.description,
    }));
  },

  // ==========================================================================
  // CONFIGURAÇÕES DO ADMIN (PROGRAMA DE INDICAÇÃO / FEATURE FLAGS)
  // ==========================================================================

  async getReferralConfig(): Promise<{ enabled: boolean; bonus_points: number }> {
    try {
      const res = await query(
        `SELECT value FROM loyalty_settings WHERE key = 'feature_referral_enabled' LIMIT 1`
      );
      const val = res.rows[0]?.value;
      if (val && typeof val === 'object') {
        return {
          enabled: val.enabled !== false,
          bonus_points: Number.isFinite(Number(val.bonus_points))
            ? Math.max(0, Number(val.bonus_points))
            : 10,
        };
      }
    } catch {
      // Fallback seguro se a tabela ainda não tiver o registo
    }
    return { enabled: true, bonus_points: 10 };
  },

  async updateReferralConfig(input: {
    enabled: boolean;
    bonus_points?: number;
  }): Promise<{ enabled: boolean; bonus_points: number }> {
    const bonusPoints = Math.max(0, Math.round(Number(input.bonus_points ?? 10)));
    const payload = { enabled: Boolean(input.enabled), bonus_points: bonusPoints };
    await query(
      `INSERT INTO loyalty_settings (key, value, description, updated_at)
       VALUES ('feature_referral_enabled', $1::jsonb, 'Ativa/desativa o programa Indique e Ganhe no app mobile', NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    return payload;
  },

  async getCampaignsConfig(): Promise<{ enabled: boolean; default_multiplier: number }> {
    try {
      const res = await query(
        `SELECT value FROM loyalty_settings WHERE key = 'feature_campaigns_enabled' LIMIT 1`
      );
      const val = res.rows[0]?.value;
      if (val && typeof val === 'object') {
        const mult = Number(val.default_multiplier);
        return {
          enabled: val.enabled !== false,
          default_multiplier: Number.isFinite(mult) && mult >= 1 ? mult : 2,
        };
      }
    } catch {
      // Fallback seguro se a chave ainda não existir
    }
    return { enabled: true, default_multiplier: 2 };
  },

  async updateCampaignsConfig(input: {
    enabled: boolean;
    default_multiplier?: number;
  }): Promise<{ enabled: boolean; default_multiplier: number }> {
    const rawMult = Number(input.default_multiplier ?? 2);
    const defaultMultiplier = Number.isFinite(rawMult) && rawMult >= 1 ? rawMult : 2;
    const payload = { enabled: Boolean(input.enabled), default_multiplier: defaultMultiplier };
    await query(
      `INSERT INTO loyalty_settings (key, value, description, updated_at)
       VALUES ('feature_campaigns_enabled', $1::jsonb, 'Ativa/desativa campanhas multiplicadoras de pontos no app mobile', NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    return payload;
  },

  async getBirthdayConfig(): Promise<{ enabled: boolean; bonus_points: number }> {
    try {
      const res = await query(
        `SELECT value FROM loyalty_settings WHERE key = 'feature_birthday_bonus' LIMIT 1`
      );
      const val = res.rows[0]?.value;
      if (val && typeof val === 'object') {
        const pts = Number(val.bonus_points);
        return {
          enabled: val.enabled === true,
          bonus_points: Number.isFinite(pts) && pts >= 0 ? Math.round(pts) : 25,
        };
      }
    } catch { }
    return { enabled: false, bonus_points: 25 };
  },

  async updateBirthdayConfig(input: {
    enabled: boolean;
    bonus_points?: number;
  }): Promise<{ enabled: boolean; bonus_points: number }> {
    const pts = Math.max(0, Math.round(Number(input.bonus_points ?? 25)));
    const payload = { enabled: Boolean(input.enabled), bonus_points: pts };
    await query(
      `INSERT INTO loyalty_settings (key, value, description, updated_at)
       VALUES ('feature_birthday_bonus', $1::jsonb, 'Ativa/desativa bónus automático de pontos no aniversário do cliente', NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    return payload;
  },

  async getReceiptConfig(): Promise<{ show_points_on_receipt: boolean }> {
    try {
      const res = await query(
        `SELECT value FROM loyalty_settings WHERE key = 'feature_receipt_points' LIMIT 1`
      );
      const val = res.rows[0]?.value;
      if (val && typeof val === 'object') {
        return {
          show_points_on_receipt: val.show_points_on_receipt !== false,
        };
      }
    } catch { }
    return { show_points_on_receipt: true };
  },

  async updateReceiptConfig(input: {
    show_points_on_receipt: boolean;
  }): Promise<{ show_points_on_receipt: boolean }> {
    const payload = { show_points_on_receipt: Boolean(input.show_points_on_receipt) };
    await query(
      `INSERT INTO loyalty_settings (key, value, description, updated_at)
       VALUES ('feature_receipt_points', $1::jsonb, 'Exibe ou oculta o saldo/pontos de cashback no recibo do PDV', NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    return payload;
  },

  async getEnabledStoresConfig(): Promise<{ disabled_tenant_ids: string[] }> {
    try {
      const res = await query(
        `SELECT value FROM loyalty_settings WHERE key = 'feature_enabled_stores' LIMIT 1`
      );
      const val = res.rows[0]?.value;
      if (val && typeof val === 'object' && Array.isArray(val.disabled_tenant_ids)) {
        return {
          disabled_tenant_ids: val.disabled_tenant_ids.filter((id: any) => typeof id === 'string'),
        };
      }
    } catch { }
    return { disabled_tenant_ids: [] };
  },

  async updateEnabledStoresConfig(input: {
    disabled_tenant_ids: string[];
  }): Promise<{ disabled_tenant_ids: string[] }> {
    const uniqueIds = Array.from(
      new Set((input.disabled_tenant_ids || []).filter((id) => typeof id === 'string' && id.trim()))
    );
    const payload = { disabled_tenant_ids: uniqueIds };
    await query(
      `INSERT INTO loyalty_settings (key, value, description, updated_at)
       VALUES ('feature_enabled_stores', $1::jsonb, 'Lista de lojas/franquias excluídas do programa de Cashback e ocultas no app mobile', NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(payload)]
    );
    return payload;
  },

  async getContentConfig(): Promise<{
    faq: Array<{ id: string; question: string; answer: string }>;
    terms_text: string;
    privacy_text: string;
    updated_at: string | null;
  }> {
    try {
      const res = await query(
        `SELECT value, updated_at FROM loyalty_settings WHERE key = 'app_legal_and_faq' LIMIT 1`
      );
      const val = res.rows[0]?.value;
      if (val && typeof val === 'object') {
        const faq = Array.isArray(val.faq)
          ? val.faq
              .filter((i: any) => i && String(i.question || '').trim())
              .map((i: any, idx: number) => ({
                id: String(i.id || `faq-${idx + 1}`),
                question: String(i.question || '').trim(),
                answer: String(i.answer || '').trim(),
              }))
          : [];
        return {
          faq,
          terms_text: typeof val.terms_text === 'string' ? val.terms_text : '',
          privacy_text: typeof val.privacy_text === 'string' ? val.privacy_text : '',
          updated_at: res.rows[0]?.updated_at || null,
        };
      }
    } catch { }
    return { faq: [], terms_text: '', privacy_text: '', updated_at: null };
  },

  async updateContentConfig(input: {
    faq?: Array<{ id?: string; question: string; answer: string }>;
    terms_text?: string;
    privacy_text?: string;
  }): Promise<{
    faq: Array<{ id: string; question: string; answer: string }>;
    terms_text: string;
    privacy_text: string;
    updated_at: string | null;
  }> {
    const current = await this.getContentConfig();
    const nextFaq =
      input.faq !== undefined
        ? input.faq
            .filter((i) => String(i?.question || '').trim())
            .map((i, idx) => ({
              id: String(i.id || `faq-${Date.now()}-${idx}`),
              question: String(i.question || '').trim(),
              answer: String(i.answer || '').trim(),
            }))
        : current.faq;
    const nextTerms =
      input.terms_text !== undefined ? String(input.terms_text).trim() : current.terms_text;
    const nextPrivacy =
      input.privacy_text !== undefined ? String(input.privacy_text).trim() : current.privacy_text;

    const payload = {
      faq: nextFaq,
      terms_text: nextTerms,
      privacy_text: nextPrivacy,
    };

    const res = await query(
      `INSERT INTO loyalty_settings (key, value, description, updated_at)
       VALUES ('app_legal_and_faq', $1::jsonb, 'Perguntas frequentes, Termos de Uso e Política de Privacidade da app Cashback', NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING updated_at`,
      [JSON.stringify(payload)]
    );

    return {
      ...payload,
      updated_at: res.rows[0]?.updated_at || new Date().toISOString(),
    };
  },

  async ensurePushLogsTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS loyalty_push_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NULL REFERENCES tenants(id) ON DELETE SET NULL,
        title VARCHAR(160) NOT NULL,
        body TEXT NOT NULL,
        image_url TEXT NULL,
        sent_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        total_targeted INT NOT NULL DEFAULT 0,
        sent_by_name VARCHAR(160) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await query(`ALTER TABLE loyalty_push_logs ADD COLUMN IF NOT EXISTS image_url TEXT NULL`);
    await query(`
      CREATE TABLE IF NOT EXISTS loyalty_push_deliveries (
        push_log_id UUID NOT NULL REFERENCES loyalty_push_logs(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES loyalty_customers(id) ON DELETE CASCADE,
        delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (push_log_id, customer_id)
      )
    `);
  },

  async recordPushDeliveries(customerId: string, pushLogIds: string[]): Promise<void> {
    if (!customerId || !pushLogIds.length) return;
    try {
      await this.ensurePushLogsTable();
      await query(
        `INSERT INTO loyalty_push_deliveries (push_log_id, customer_id)
         SELECT unnest($1::uuid[]), $2::uuid
         ON CONFLICT (push_log_id, customer_id) DO NOTHING`,
        [pushLogIds, customerId]
      );
    } catch (err) {
      console.error('Erro ao registar loyalty_push_deliveries:', err);
    }
  },

  async logPushBroadcast(input: {
    tenant_id?: string | null;
    title: string;
    body: string;
    image_url?: string | null;
    sent_count: number;
    failed_count: number;
    total_targeted: number;
    sent_by_name?: string | null;
  }): Promise<void> {
    try {
      await this.ensurePushLogsTable();
      await query(
        `INSERT INTO loyalty_push_logs (tenant_id, title, body, image_url, sent_count, failed_count, total_targeted, sent_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          input.tenant_id || null,
          input.title,
          input.body,
          input.image_url || null,
          input.sent_count,
          input.failed_count,
          input.total_targeted,
          input.sent_by_name || null,
        ]
      );
    } catch (err) {
      console.error('Erro ao gravar loyalty_push_logs:', err);
    }
  },

  async listPushLogs(limit = 30): Promise<any[]> {
    try {
      await this.ensurePushLogsTable();
      const res = await query(
        `SELECT l.id,
                l.tenant_id,
                l.title,
                l.body,
                l.image_url,
                GREATEST(
                  l.sent_count,
                  COALESCE((SELECT COUNT(*)::int FROM loyalty_push_deliveries d WHERE d.push_log_id = l.id), 0)
                ) AS sent_count,
                l.failed_count,
                GREATEST(
                  l.total_targeted,
                  CASE
                    WHEN l.total_targeted > 0 THEN l.total_targeted
                    ELSE (SELECT COUNT(*)::int FROM loyalty_customers c WHERE c.status = 'ACTIVE' AND (l.tenant_id IS NULL OR c.tenant_id = l.tenant_id))
                  END,
                  COALESCE((SELECT COUNT(*)::int FROM loyalty_push_deliveries d WHERE d.push_log_id = l.id), 0)
                ) AS total_targeted,
                l.sent_by_name,
                l.created_at,
                t.name AS tenant_name
         FROM loyalty_push_logs l
         LEFT JOIN tenants t ON t.id = l.tenant_id
         ORDER BY l.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.rows || [];
    } catch {
      return [];
    }
  },

  // ==========================================================================
  // CAMPANHAS, DESTAQUES & PUBLICIDADE UNIFICADOS
  // ==========================================================================

  async ensureCampaignExtraColumns(): Promise<void> {
    await query(`ALTER TABLE loyalty_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(30) NOT NULL DEFAULT 'MULTIPLIER'`);
    await query(`ALTER TABLE loyalty_campaigns ADD COLUMN IF NOT EXISTS subtitle TEXT NULL`);
    await query(`ALTER TABLE loyalty_campaigns ADD COLUMN IF NOT EXISTS content TEXT NULL`);
    await query(`ALTER TABLE loyalty_campaigns ADD COLUMN IF NOT EXISTS link_url TEXT NULL`);
    await query(`ALTER TABLE loyalty_campaigns ADD COLUMN IF NOT EXISTS banner_url TEXT NULL`);
  },

  async getActiveCampaign(tenantId?: string): Promise<LoyaltyCampaign | null> {
    const cfg = await this.getCampaignsConfig();
    if (!cfg.enabled) {
      return null;
    }

    await this.ensureCampaignExtraColumns();
    const res = await query(
      `SELECT * FROM loyalty_campaigns 
       WHERE active = TRUE 
         AND start_date <= NOW() 
         AND end_date >= NOW()
         AND (campaign_type = 'MULTIPLIER' OR multiplier > 1)
         AND (tenant_id IS NULL OR tenant_id = $1 OR $1 IS NULL)
       ORDER BY multiplier DESC, created_at DESC
       LIMIT 1`,
      [tenantId || null]
    );
    return res.rows[0] || null;
  },

  async listActiveCampaigns(tenantId?: string): Promise<any[]> {
    const cfg = await this.getCampaignsConfig();
    await this.ensureCampaignExtraColumns();

    // Se multiplicadores estiverem pausados no switch global, oculta apenas MULTIPLIER;
    // Destaques (HIGHLIGHT) e Publicidades (AD) continuam controlados pelo próprio toggle active.
    const res = await query(
      `SELECT id, tenant_id, title, subtitle, description, content,
              COALESCE(campaign_type, 'MULTIPLIER') AS campaign_type,
              multiplier::float AS multiplier,
              banner_url, link_url, start_date, end_date
       FROM loyalty_campaigns
       WHERE active = TRUE
         AND start_date <= NOW()
         AND end_date >= NOW()
         AND ($2::boolean = TRUE OR COALESCE(campaign_type, 'MULTIPLIER') <> 'MULTIPLIER')
         AND (tenant_id IS NULL OR tenant_id = $1 OR $1 IS NULL)
       ORDER BY
         CASE COALESCE(campaign_type, 'MULTIPLIER')
           WHEN 'MULTIPLIER' THEN 0
           WHEN 'HIGHLIGHT' THEN 1
           ELSE 2
         END ASC,
         created_at DESC
       LIMIT 20`,
      [tenantId || null, cfg.enabled]
    );
    return res.rows || [];
  },

  // ==========================================================================
  // ROTINA DIÁRIA DE MANUTENÇÃO (ESTORNO DE VOUCHERS EXPIRADOS)
  // ==========================================================================

  async refundExpiredVouchers(): Promise<number> {
    const expiredRes = await query(
      `SELECT v.id, v.customer_id, v.tenant_id, r.points_cost, r.name as reward_name
       FROM loyalty_vouchers v
       JOIN loyalty_rewards r ON r.id = v.reward_id
       WHERE v.status = 'ACTIVE' 
         AND v.expires_at < NOW()`
    );

    if (expiredRes.rows.length === 0) {
      return 0;
    }

    let count = 0;
    for (const row of expiredRes.rows) {
      await withTransaction(async (client) => {
        // Marca como REFUNDED
        await client.query(
          `UPDATE loyalty_vouchers SET status = 'REFUNDED' WHERE id = $1`,
          [row.id]
        );

        // Estorna pontos para a carteira do cliente
        await client.query(
          `UPDATE loyalty_customers 
           SET points_balance = points_balance + $1, updated_at = NOW() 
           WHERE id = $2`,
          [row.points_cost, row.customer_id]
        );

        // Registra a devolução no extrato
        await client.query(
          `INSERT INTO loyalty_transactions (
            tenant_id, customer_id, type, points, description, status
          ) VALUES ($1, $2, 'CREDIT', $3, $4, 'APPROVED')`,
          [
            row.tenant_id,
            row.customer_id,
            row.points_cost,
            `Estorno automático de voucher não utilizado (${row.reward_name})`,
          ]
        );
      });

      notifyLoyaltyCustomer(row.customer_id, {
        title: 'Os teus pontos foram devolvidos',
        body: `O voucher "${row.reward_name}" expirou e ${row.points_cost} pts voltaram para a tua carteira.`,
        data: { type: 'VOUCHER_REFUNDED', points: row.points_cost },
      }).catch(() => { });

      count++;
    }

    return count;
  },

  /**
   * Credita bónus de aniversário (1x por ano por cliente) se ativo nas regras da Franqueadora.
   */
  async processBirthdayBonuses(): Promise<number> {
    const cfg = await this.getBirthdayConfig();
    if (!cfg.enabled || cfg.bonus_points <= 0) {
      return 0;
    }

    const nowLisbon = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Lisbon',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [yearStr, monthStr, dayStr] = nowLisbon.split('-');
    const targetMonth = Number(monthStr);
    const targetDay = Number(dayStr);

    const birthdayCustomers = await query(
      `SELECT id, name, tenant_id, points_balance
       FROM loyalty_customers
       WHERE status = 'ACTIVE'
         AND birth_date IS NOT NULL
         AND EXTRACT(MONTH FROM birth_date) = $1
         AND EXTRACT(DAY FROM birth_date) = $2`,
      [targetMonth, targetDay]
    );

    let awardedCount = 0;
    for (const c of birthdayCustomers.rows || []) {
      const idempKey = `BIRTHDAY_BONUS_${c.id}_${yearStr}`;
      const awarded = await withTransaction(async (client) => {
        const exists = await client.query(
          `SELECT id FROM loyalty_transactions WHERE idempotency_key = $1 LIMIT 1`,
          [idempKey]
        );
        if (exists.rows.length > 0) return false;

        await client.query(
          `UPDATE loyalty_customers
           SET points_balance = points_balance + $1, updated_at = NOW()
           WHERE id = $2`,
          [cfg.bonus_points, c.id]
        );
        await client.query(
          `INSERT INTO loyalty_transactions (
             tenant_id, customer_id, type, points, description, idempotency_key, status
           ) VALUES ($1, $2, 'CREDIT', $3, $4, $5, 'APPROVED')`,
          [
            c.tenant_id || null,
            c.id,
            cfg.bonus_points,
            `Bónus de Aniversário Açaí da Rose (${yearStr})`,
            idempKey,
          ]
        );
        return true;
      });

      if (awarded) {
        awardedCount++;
        const newBal = (Number(c.points_balance) || 0) + cfg.bonus_points;
        notifyLoyaltyCustomer(c.id, {
          title: 'Parabéns da Açaí da Rose!',
          body: `Feliz aniversário, ${c.name}! Oferecemos +${cfg.bonus_points} pontos no teu Cashback (Saldo: ${newBal} pts).`,
          data: { type: 'BIRTHDAY_BONUS', points: cfg.bonus_points, balance: newBal },
        }).catch(() => { });
      }
    }

    return awardedCount;
  },
};
