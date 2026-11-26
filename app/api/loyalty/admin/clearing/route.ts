import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json({ error: 'Acesso restrito à Franqueadora.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID do lançamento é obrigatório.' }, { status: 400 });
    }

    const res = await query(
      `UPDATE loyalty_clearing_settlements
       SET status = 'SETTLED_IN_ROYALTIES', settled_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ settlement: res.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em PATCH /api/loyalty/admin/clearing:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao liquidar compensação.' },
      { status: 500 }
    );
  }
}
