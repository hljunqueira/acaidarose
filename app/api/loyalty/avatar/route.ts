import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { loyaltyRepository } from '@/lib/repositories/loyaltyRepository';
import { loyaltyAuth } from '@/lib/services/loyaltyAuth';

export const dynamic = 'force-dynamic';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function extractCustomerId(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const payload = loyaltyAuth.verifyAccessToken(token);
  return payload?.customerId || null;
}

export async function POST(request: NextRequest) {
  try {
    const customerId = extractCustomerId(request);
    if (!customerId) {
      return NextResponse.json({ error: 'Sessão expirada ou não autorizada.' }, { status: 401 });
    }

    const existing = await loyaltyRepository.findCustomerById(customerId);
    if (!existing || existing.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let ext = 'jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = (formData as any).get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'Nenhuma imagem enviada.' }, { status: 400 });
      }
      const mappedExt = MIME_TO_EXT[(file.type || '').toLowerCase()];
      if (!mappedExt) {
        return NextResponse.json(
          { error: 'Formato inválido. Usa JPG, PNG ou WebP.' },
          { status: 400 }
        );
      }
      ext = mappedExt;
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await request.json();
      const rawBase64 = String(body?.imageBase64 || '').trim();
      if (!rawBase64) {
        return NextResponse.json({ error: 'Imagem em base64 obrigatória.' }, { status: 400 });
      }

      let detectedMime = String(body?.mimeType || 'image/jpeg').toLowerCase();
      let cleanBase64 = rawBase64;
      const dataUrlMatch = rawBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (dataUrlMatch) {
        detectedMime = dataUrlMatch[1].toLowerCase();
        cleanBase64 = dataUrlMatch[2];
      }

      const mappedExt = MIME_TO_EXT[detectedMime];
      if (!mappedExt) {
        return NextResponse.json(
          { error: 'Formato inválido. Usa JPG, PNG ou WebP.' },
          { status: 400 }
        );
      }
      ext = mappedExt;
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Ficheiro de imagem vazio.' }, { status: 400 });
    }
    if (buffer.length > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: 'A imagem excede o tamanho máximo de 3 MB.' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    const filename = `${customerId}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    const [updated, referralsCount] = await Promise.all([
      loyaltyRepository.updateCustomerProfile(customerId, { avatar_url: avatarUrl }),
      loyaltyRepository.countCustomerReferrals(customerId),
    ]);

    const c = updated || existing;
    return NextResponse.json(
      {
        avatar_url: avatarUrl,
        customer: {
          id: c.id,
          username: c.username,
          phone: c.phone,
          name: c.name,
          email: c.email,
          nif: c.nif,
          birth_date: c.birth_date,
          points_balance: c.points_balance,
          referral_code: c.referral_code,
          avatar_url: c.avatar_url,
          tenant_id: c.tenant_id,
          referrals_count: referralsCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro em POST /api/loyalty/avatar:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao guardar foto de perfil.' },
      { status: 500 }
    );
  }
}
