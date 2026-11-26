import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const payload = loyaltyAuth.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || payload.tenantId || null;

    await loyaltyRepository.ensurePushLogsTable();
    const res = await query(
      `SELECT id, title, body, image_url, tenant_id, created_at
       FROM loyalty_push_logs
       WHERE tenant_id IS NULL OR tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 15`,
      [tenantId]
    );

    const notifications = res.rows || [];
    if (notifications.length > 0 && payload.customerId) {
      await loyaltyRepository.recordPushDeliveries(
        payload.customerId,
        notifications.map((n: any) => n.id)
      );
    }

    return NextResponse.json(
      { notifications },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Erro em GET /api/loyalty/notifications:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao carregar notificações.' },
      { status: 500 }
    );
  }
}
