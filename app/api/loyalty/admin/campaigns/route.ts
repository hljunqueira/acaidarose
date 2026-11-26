import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';

export const dynamic = 'force-dynamic';

const VALID_TYPES = new Set(['MULTIPLIER', 'HIGHLIGHT', 'AD']);

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json({ error: 'Acesso restrito à Franqueadora.' }, { status: 403 });
  }

  try {
    await loyaltyRepository.ensureCampaignExtraColumns();

    const body = await request.json();
    const rawType = String(body?.campaign_type || 'MULTIPLIER').trim().toUpperCase();
    const campaignType = VALID_TYPES.has(rawType) ? rawType : 'MULTIPLIER';
    const title = String(body?.title || '').trim();
    const subtitle = body?.subtitle ? String(body.subtitle).trim() : null;
    const description = body?.description ? String(body.description).trim() : subtitle;
    const content = body?.content ? String(body.content).trim() : null;
    const bannerUrl = body?.banner_url ? String(body.banner_url).trim() : null;
    const linkUrl = body?.link_url ? String(body.link_url).trim() : null;
    const multiplier = campaignType === 'MULTIPLIER' ? Number(body?.multiplier || 2) : 1;
    const startDate = body?.start_date ? new Date(body.start_date) : new Date();
    const endDate = body?.end_date
      ? new Date(body.end_date)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tenantId = body?.tenant_id ? String(body.tenant_id).trim() : null;
    const active = body?.active !== false;

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 });
    }
    if (campaignType === 'MULTIPLIER' && (!Number.isFinite(multiplier) || multiplier < 1)) {
      return NextResponse.json(
        { error: 'Multiplicador deve ser maior ou igual a 1.' },
        { status: 400 }
      );
    }

    const res = await query(
      `INSERT INTO loyalty_campaigns (
         tenant_id, campaign_type, title, subtitle, description, content,
         banner_url, link_url, multiplier, start_date, end_date, active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        tenantId || null,
        campaignType,
        title,
        subtitle,
        description,
        content,
        bannerUrl,
        linkUrl,
        multiplier,
        startDate.toISOString(),
        endDate.toISOString(),
        active,
      ]
    );

    return NextResponse.json({ campaign: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Erro em POST /api/loyalty/admin/campaigns:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao criar campanha.' },
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
    await loyaltyRepository.ensureCampaignExtraColumns();

    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.campaign_type !== undefined) {
      const rawType = String(body.campaign_type || 'MULTIPLIER').trim().toUpperCase();
      if (VALID_TYPES.has(rawType)) {
        fields.push(`campaign_type = $${idx++}`);
        values.push(rawType);
      }
    }
    if (body.title !== undefined) {
      const title = String(body.title || '').trim();
      if (!title) {
        return NextResponse.json({ error: 'Título não pode ficar vazio.' }, { status: 400 });
      }
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (body.subtitle !== undefined) {
      fields.push(`subtitle = $${idx++}`);
      values.push(body.subtitle ? String(body.subtitle).trim() : null);
    }
    if (body.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(body.description ? String(body.description).trim() : null);
    }
    if (body.content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(body.content ? String(body.content).trim() : null);
    }
    if (body.banner_url !== undefined) {
      fields.push(`banner_url = $${idx++}`);
      values.push(body.banner_url ? String(body.banner_url).trim() : null);
    }
    if (body.link_url !== undefined) {
      fields.push(`link_url = $${idx++}`);
      values.push(body.link_url ? String(body.link_url).trim() : null);
    }
    if (body.multiplier !== undefined) {
      const mult = Number(body.multiplier);
      if (!Number.isFinite(mult) || mult < 1) {
        return NextResponse.json({ error: 'Multiplicador deve ser >= 1.' }, { status: 400 });
      }
      fields.push(`multiplier = $${idx++}`);
      values.push(mult);
    }
    if (body.start_date !== undefined) {
      fields.push(`start_date = $${idx++}`);
      values.push(new Date(body.start_date).toISOString());
    }
    if (body.end_date !== undefined) {
      fields.push(`end_date = $${idx++}`);
      values.push(new Date(body.end_date).toISOString());
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
      `UPDATE loyalty_campaigns SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ campaign: res.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em PATCH /api/loyalty/admin/campaigns:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar campanha.' },
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
      return NextResponse.json({ error: 'ID da campanha é obrigatório.' }, { status: 400 });
    }

    await query(`DELETE FROM loyalty_campaigns WHERE id = $1`, [id]);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em DELETE /api/loyalty/admin/campaigns:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao remover campanha.' },
      { status: 500 }
    );
  }
}
