import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getAuthUser, hasRole } from '@/lib/api/authGuard';
import { sendExpoPushMessages, isValidExpoPushToken } from '@/lib/services/expoPush';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { recordAuditLog } from '@/lib/repositories/auditRepository';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Apenas a Franqueadora Master pode enviar notificações push.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const title = String(body?.title || '').trim();
    const message = String(body?.body || '').trim();
    const imageUrl = body?.image_url ? String(body.image_url).trim() : null;
    const tenantId = body?.tenant_id ? String(body.tenant_id).trim() : null;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Título e mensagem da notificação são obrigatórios.' },
        { status: 400 }
      );
    }

    const [res, activeCountRes] = await Promise.all([
      tenantId
        ? query(
            `SELECT id, push_token FROM loyalty_customers
             WHERE status = 'ACTIVE' AND push_token IS NOT NULL AND tenant_id = $1`,
            [tenantId]
          )
        : query(
            `SELECT id, push_token FROM loyalty_customers
             WHERE status = 'ACTIVE' AND push_token IS NOT NULL`
          ),
      tenantId
        ? query(
            `SELECT COUNT(*)::int AS total FROM loyalty_customers
             WHERE status = 'ACTIVE' AND tenant_id = $1`,
            [tenantId]
          )
        : query(
            `SELECT COUNT(*)::int AS total FROM loyalty_customers
             WHERE status = 'ACTIVE'`
          ),
    ]);

    const totalTargeted = Math.max(
      Number(activeCountRes.rows[0]?.total || 0),
      (res.rows || []).length
    );

    const validTokens = (res.rows || [])
      .map((r) => r.push_token)
      .filter((t) => isValidExpoPushToken(t));

    const result =
      validTokens.length > 0
        ? await sendExpoPushMessages(
            validTokens.map((to) => ({
              to,
              title,
              body: message,
              data: { type: 'ADMIN_BROADCAST', tenant_id: tenantId || 'ALL' },
            }))
          )
        : { sent: 0, failed: 0 };

    // 1. Grava no histórico do Gerenciamento Cashback
    await loyaltyRepository.logPushBroadcast({
      tenant_id: tenantId,
      title,
      body: message,
      image_url: imageUrl,
      sent_count: result.sent,
      failed_count: result.failed,
      total_targeted: totalTargeted,
      sent_by_name: user?.name || user?.email || 'Franqueadora',
    });

    // 2. Grava também nos Logs de Auditoria do Admin Dev
    await recordAuditLog({
      tenantId: tenantId || null,
      userId: user?.id || null,
      authorName: user?.name || user?.email || 'Franqueadora',
      userRole: user?.role || 'FRANCHISOR_ADMIN',
      action: 'LOYALTY_PUSH_BROADCAST',
      entity: 'LOYALTY_PUSH',
      message: `Push enviado: "${title}" (${result.sent}/${totalTargeted} clientes)`,
      metadata: {
        title,
        body: message,
        tenantId: tenantId || 'ALL',
        sent: result.sent,
        failed: result.failed,
        totalTargeted,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        sent: result.sent,
        failed: result.failed,
        total_targeted: totalTargeted,
        message:
          validTokens.length === 0
            ? `Notificação publicada para ${totalTargeted} cliente(s) na app.`
            : `Notificação enviada para ${result.sent} dispositivo(s) e publicada na app.`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em POST /api/loyalty/admin/push:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao enviar notificações push.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Apenas a Franqueadora Master pode editar notificações.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const id = String(body?.id || '').trim();
    const title = String(body?.title || '').trim();
    const message = String(body?.body || '').trim();
    const imageUrl = body?.image_url ? String(body.image_url).trim() : null;
    const tenantId = body?.tenant_id ? String(body.tenant_id).trim() : null;

    if (!id || !title || !message) {
      return NextResponse.json(
        { error: 'ID, título e mensagem são obrigatórios.' },
        { status: 400 }
      );
    }

    await loyaltyRepository.ensurePushLogsTable();
    const res = await query(
      `UPDATE loyalty_push_logs
       SET title = $1, body = $2, image_url = $3, tenant_id = $4
       WHERE id = $5
       RETURNING *`,
      [title, message, imageUrl, tenantId, id]
    );

    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Notificação não encontrada.' }, { status: 404 });
    }

    await recordAuditLog({
      tenantId,
      userId: user?.id || null,
      authorName: user?.name || user?.email || 'Franqueadora',
      userRole: user?.role || 'FRANCHISOR_ADMIN',
      action: 'LOYALTY_PUSH_UPDATED',
      entity: 'LOYALTY_PUSH',
      entityId: id,
      message: `Notificação push editada: "${title}"`,
    });

    return NextResponse.json({ ok: true, log: res.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em PATCH /api/loyalty/admin/push:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao editar notificação.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!hasRole(user, ['SUPER_ADMIN', 'FRANCHISOR_ADMIN'])) {
    return NextResponse.json(
      { error: 'Apenas a Franqueadora Master pode excluir notificações.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = String(searchParams.get('id') || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório.' }, { status: 400 });
    }

    await loyaltyRepository.ensurePushLogsTable();
    const res = await query(`DELETE FROM loyalty_push_logs WHERE id = $1 RETURNING title`, [id]);
    if (!res.rows[0]) {
      return NextResponse.json({ error: 'Notificação não encontrada.' }, { status: 404 });
    }

    await recordAuditLog({
      userId: user?.id || null,
      authorName: user?.name || user?.email || 'Franqueadora',
      userRole: user?.role || 'FRANCHISOR_ADMIN',
      action: 'LOYALTY_PUSH_DELETED',
      entity: 'LOYALTY_PUSH',
      entityId: id,
      message: `Notificação push removida: "${res.rows[0].title}"`,
    });

    return NextResponse.json({ ok: true, deleted: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em DELETE /api/loyalty/admin/push:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao excluir notificação.' },
      { status: 500 }
    );
  }
}
