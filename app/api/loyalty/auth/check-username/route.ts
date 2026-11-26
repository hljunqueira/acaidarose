import { NextRequest, NextResponse } from 'next/server';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get('username') || '').trim().replace(/^@+/, '');

    const valid = /^[a-zA-Z0-9._-]{3,30}$/.test(raw);
    if (!valid) {
      return NextResponse.json({ available: false, valid: false }, { status: 200 });
    }

    const available = await loyaltyRepository.isUsernameAvailable(raw);
    return NextResponse.json({ available, valid: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro em /api/loyalty/auth/check-username:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao verificar disponibilidade.' },
      { status: 500 }
    );
  }
}
