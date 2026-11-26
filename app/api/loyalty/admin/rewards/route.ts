import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json({ error: 'Acesso restrito à Franqueadora.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const pointsCost = Number(body?.points_cost);
    const description = body?.description ? String(body.description).trim() : null;
    const category = String(body?.category || 'COPOS').trim().toUpperCase();
    const imageUrl = body?.image_url ? String(body.image_url).trim() : null;
    const productContainerId = body?.product_container_id
      ? String(body.product_container_id).trim()
      : null;
    const tenantId = body?.tenant_id ? String(body.tenant_id).trim() : null;
    const active = body?.active !== false;

    if (!name || !Number.isFinite(pointsCost) || pointsCost <= 0) {
      return NextResponse.json(
        { error: 'Nome e custo em pontos (maior que 0) são obrigatórios.' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO loyalty_rewards (tenant_id, product_container_id, name, description, points_cost, category, image_url, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId || null,
        productContainerId || null,
        name,
        description,
        Math.round(pointsCost),
        category,
        imageUrl,
        active,
      ]
    );

    return NextResponse.json({ reward: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Erro em POST /api/loyalty/admin/rewards:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar prémio.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json({ error: 'Acesso restrito à Franqueadora.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID do prémio é obrigatório.' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(String(body.name).trim());
    }
    if (body.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(body.description ? String(body.description).trim() : null);
    }
    if (body.points_cost !== undefined) {
      const cost = Math.round(Number(body.points_cost));
      if (!Number.isFinite(cost) || cost <= 0) {
        return NextResponse.json({ error: 'Custo em pontos inválido.' }, { status: 400 });
      }
      fields.push(`points_cost = $${idx++}`);
      values.push(cost);
    }
    if (body.category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(String(body.category).trim().toUpperCase());
    }
    if (body.image_url !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(body.image_url ? String(body.image_url).trim() : null);
    }
    if (body.tenant_id !== undefined) {
      fields.push(`tenant_id = $${idx++}`);
      values.push(body.tenant_id ? String(body.tenant_id).trim() : null);
    }
    if (typeof body.active === 'boolean') {
      fields.push(`active = $${idx++}`);
      values.push(body.active);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração enviada.' }, { status: 400 });
    }

    values.push(id);
    const res = await query(
      `UPDATE loyalty_rewards SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Prémio não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ reward: res.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em PATCH /api/loyalty/admin/rewards:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar prémio.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json({ error: 'Acesso restrito à Franqueadora.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do prémio é obrigatório.' }, { status: 400 });
    }

    await query(`ALTER TABLE loyalty_rewards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);

    // Se já houver vouchers emitidos para este prémio, faz soft-delete para excluir da lista preservando o histórico de vouchers
    const usedRes = await query(
      `SELECT COUNT(*)::int AS total FROM loyalty_vouchers WHERE reward_id = $1`,
      [id]
    );
    if ((usedRes.rows[0]?.total || 0) > 0) {
      await query(
        `UPDATE loyalty_rewards SET active = FALSE, deleted_at = NOW() WHERE id = $1`,
        [id]
      );
      return NextResponse.json(
        { deleted: true, message: 'Prémio excluído.' },
        { status: 200 }
      );
    }

    await query(`DELETE FROM loyalty_rewards WHERE id = $1`, [id]);
    return NextResponse.json({ deleted: true, message: 'Prémio excluído.' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em DELETE /api/loyalty/admin/rewards:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao remover prémio.' },
      { status: 500 }
    );
  }
}
