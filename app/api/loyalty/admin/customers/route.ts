import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db/postgres';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';
import { notifyLoyaltyCustomer } from '@/lib/services/expoPush';

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
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }

    const [txRes, vouchersRes] = await Promise.all([
      query(
        `SELECT lt.id, lt.type, lt.points, lt.description, lt.status, lt.created_at,
                t.name AS tenant_name
         FROM loyalty_transactions lt
         LEFT JOIN tenants t ON t.id = lt.tenant_id
         WHERE lt.customer_id = $1
         ORDER BY lt.created_at DESC
         LIMIT 200`,
        [id]
      ),
      query(
        `SELECT v.id, v.voucher_code, v.status, v.expires_at, v.redeemed_at, v.created_at,
                r.name AS reward_name, r.points_cost, t.name AS tenant_name
         FROM loyalty_vouchers v
         JOIN loyalty_rewards r ON r.id = v.reward_id
         LEFT JOIN tenants t ON t.id = v.tenant_id
         WHERE v.customer_id = $1
         ORDER BY v.created_at DESC
         LIMIT 50`,
        [id]
      ),
    ]);

    return NextResponse.json(
      {
        transactions: txRes.rows || [],
        vouchers: vouchersRes.rows || [],
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Erro em GET /api/loyalty/admin/customers:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar extrato do cliente.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Acesso restrito à Franqueadora Master.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }

    // AÇÃO 1: Ajuste manual de pontos (+/-) com registo no extrato
    if (body?.action === 'ADJUST_POINTS') {
      const delta = Math.round(Number(body?.points_delta));
      const reason = String(body?.reason || '').trim();

      if (!Number.isFinite(delta) || delta === 0) {
        return NextResponse.json(
          { error: 'Indica uma quantidade de pontos válida diferente de zero.' },
          { status: 400 }
        );
      }

      const result = await withTransaction(async (client) => {
        const custRes = await client.query(
          `SELECT id, tenant_id, points_balance FROM loyalty_customers WHERE id = $1 AND status = 'ACTIVE' FOR UPDATE`,
          [id]
        );
        const customer = custRes.rows[0];
        if (!customer) {
          throw new Error('NOT_FOUND');
        }

        const currentBalance = Number(customer.points_balance) || 0;
        const newBalance = currentBalance + delta;
        if (newBalance < 0) {
          throw new Error(`Saldo insuficiente (${currentBalance} pts) para remover ${Math.abs(delta)} pts.`);
        }

        await client.query(
          `UPDATE loyalty_customers SET points_balance = $1, updated_at = NOW() WHERE id = $2`,
          [newBalance, id]
        );

        const txType = delta > 0 ? 'CREDIT' : 'DEBIT';
        const description =
          reason ||
          (delta > 0
            ? 'Créditos concedidos pelo Açaí da Rose'
            : 'Ajustes pelo Açaí da Rose');

        await client.query(
          `INSERT INTO loyalty_transactions (
             tenant_id, customer_id, type, points, description, cashier_user_id, status
           ) VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED')`,
          [
            customer.tenant_id || null,
            id,
            txType,
            Math.abs(delta),
            description,
            user?.id || null,
          ]
        );

        return { newBalance };
      });

      notifyLoyaltyCustomer(id, {
        title: delta > 0 ? `Recebeste +${delta} pontos!` : 'Ajuste no teu saldo de pontos',
        body: reason
          ? `${reason}. Novo saldo: ${result.newBalance} pts.`
          : `O teu saldo atual de Cashback é ${result.newBalance} pts.`,
        data: { type: 'POINTS_ADJUSTED', delta, balance: result.newBalance },
      }).catch(() => {});

      return NextResponse.json(
        { ok: true, points_balance: result.newBalance },
        { status: 200 }
      );
    }

    // AÇÃO 2: Editar dados do cliente e/ou redefinir palavra-passe
    const existingRes = await query(
      `SELECT id, username, phone FROM loyalty_customers WHERE id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [id]
    );
    if (!existingRes.rows[0]) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.name !== undefined) {
      const name = String(body.name || '').trim();
      if (!name) {
        return NextResponse.json({ error: 'O nome não pode ficar vazio.' }, { status: 400 });
      }
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    if (body.username !== undefined) {
      const rawUser = String(body.username || '').trim().toLowerCase();
      if (!rawUser) {
        return NextResponse.json({ error: 'O @username não pode ficar vazio.' }, { status: 400 });
      }
      const normalizedUsername = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;
      const dupUser = await query(
        `SELECT id FROM loyalty_customers WHERE LOWER(username) = $1 AND id <> $2 AND status = 'ACTIVE' LIMIT 1`,
        [normalizedUsername, id]
      );
      if (dupUser.rows[0]) {
        return NextResponse.json({ error: 'Este @username já está em uso.' }, { status: 409 });
      }
      fields.push(`username = $${idx++}`);
      values.push(normalizedUsername);
    }

    if (body.phone !== undefined) {
      const phone = String(body.phone || '').trim();
      if (!phone) {
        return NextResponse.json({ error: 'O telemóvel não pode ficar vazio.' }, { status: 400 });
      }
      const dupPhone = await query(
        `SELECT id FROM loyalty_customers WHERE phone = $1 AND id <> $2 AND status = 'ACTIVE' LIMIT 1`,
        [phone, id]
      );
      if (dupPhone.rows[0]) {
        return NextResponse.json({ error: 'Este telemóvel já está registado noutro cliente.' }, { status: 409 });
      }
      fields.push(`phone = $${idx++}`);
      values.push(phone);
    }

    if (body.email !== undefined) {
      const email = String(body.email || '').trim().toLowerCase() || null;
      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (body.nif !== undefined) {
      const nif = String(body.nif || '').trim() || null;
      fields.push(`nif = $${idx++}`);
      values.push(nif);
    }

    if (body.tenant_id !== undefined) {
      const tenantId = String(body.tenant_id || '').trim() || null;
      fields.push(`tenant_id = $${idx++}`);
      values.push(tenantId);
    }

    let passwordUpdated = false;
    if (body.new_password !== undefined && String(body.new_password).trim() !== '') {
      const newPassword = String(body.new_password).trim();
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' },
          { status: 400 }
        );
      }
      fields.push(`password_hash = $${idx++}`);
      values.push(loyaltyAuth.hashPassword(newPassword));
      passwordUpdated = true;
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração enviada.' }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const updatedRes = await query(
      `UPDATE loyalty_customers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, username, phone, email, nif, tenant_id, points_balance`,
      values
    );

    if (passwordUpdated) {
      await query(`DELETE FROM loyalty_refresh_tokens WHERE customer_id = $1`, [id]).catch(() => {});
    }

    return NextResponse.json(
      { ok: true, customer: updatedRes.rows[0], password_updated: passwordUpdated },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }
    console.error('Erro em PATCH /api/loyalty/admin/customers:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar cliente.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Acesso restrito à Franqueadora Master.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório.' }, { status: 400 });
    }

    const suffix = `_del_${Date.now()}`;
    await withTransaction(async (client) => {
      const check = await client.query(
        `SELECT id, username, phone, email FROM loyalty_customers WHERE id = $1 AND status = 'ACTIVE' FOR UPDATE`,
        [id]
      );
      const cust = check.rows[0];
      if (!cust) {
        throw new Error('NOT_FOUND');
      }

      // Soft-delete seguro preservando histórico financeiro/vouchers e libertando telemóvel/email/username
      await client.query(
        `UPDATE loyalty_customers
         SET status = 'DELETED',
             username = LEFT(username, 35) || $2,
             phone = CASE WHEN phone IS NOT NULL THEN LEFT(phone, 20) || $2 ELSE NULL END,
             email = CASE WHEN email IS NOT NULL THEN LEFT(email, 80) || $2 ELSE NULL END,
             refresh_token_hash = NULL,
             push_token = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [id, suffix]
      );
    });

    return NextResponse.json({ ok: true, message: 'Cliente removido com sucesso.' }, { status: 200 });
  } catch (error: any) {
    if (error?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }
    console.error('Erro em DELETE /api/loyalty/admin/customers:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao remover cliente.' },
      { status: 500 }
    );
  }
}
