import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { recordAuditLog } from '@/lib/repositories/auditRepository';

export const dynamic = 'force-dynamic';

async function runMaintenance(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const expectedSecret = process.env.CRON_SECRET || 'rose_cron_secret_auth_token_daily_maintenance_351_secure';

    if (token !== expectedSecret) {
      return NextResponse.json(
        { error: 'Acesso não autorizado ao job de manutenção.' },
        { status: 401 }
      );
    }

    // 1. Estorna vouchers expirados com devolução integral de pontos + push
    const refundedCount = await loyaltyRepository.refundExpiredVouchers();

    // 2. Credita bónus de aniversário (se ativo nas regras da Franqueadora) + push
    const birthdayAwardedCount = await loyaltyRepository.processBirthdayBonuses();

    await recordAuditLog({
      action: 'LOYALTY_DAILY_MAINTENANCE',
      entity: 'LOYALTY_CRON',
      authorName: 'Cron Cashback',
      userRole: 'SYSTEM',
      message: `Rotina diária executada: ${refundedCount} voucher(s) estornado(s), ${birthdayAwardedCount} bónus de aniversário creditado(s).`,
      metadata: { refundedCount, birthdayAwardedCount },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Rotina diária de manutenção de fidelidade executada com sucesso.',
        refundedVouchersCount: refundedCount,
        birthdayBonusesCount: birthdayAwardedCount,
        executedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em /api/cron/loyalty-maintenance:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao executar rotina de manutenção.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return runMaintenance(request);
}

export async function GET(request: NextRequest) {
  return runMaintenance(request);
}
