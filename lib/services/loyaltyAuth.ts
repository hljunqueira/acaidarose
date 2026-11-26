import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_LOYALTY_SECRET || 'rose_loyalty_jwt_secret_dev_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'rose_loyalty_refresh_secret_dev_key_2026';

export interface LoyaltyTokenPayload {
  customerId: string;
  username: string;
  phone: string;
  tenantId?: string | null;
  exp: number; // timestamp em segundos
}

export const loyaltyAuth = {
  hashPassword(password: string): string {
    return bcrypt.hashSync(password.trim(), 10);
  },

  comparePassword(password: string, hash: string): boolean {
    try {
      return bcrypt.compareSync(password.trim(), hash);
    } catch {
      return false;
    }
  },

  /**
   * Gera um token assinado HMAC-SHA256 (Padrão JWT seguro sem dependência externa)
   */
  generateAccessToken(customerId: string, username: string, phone: string, tenantId?: string | null): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + 15 * 60; // 15 minutos
    const payload = Buffer.from(
      JSON.stringify({
        customerId,
        username,
        phone,
        tenantId,
        exp,
      })
    ).toString('base64url');

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  },

  generateRefreshToken(customerId: string): string {
    const random = crypto.randomBytes(32).toString('hex');
    const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 dias
    const data = `${customerId}:${exp}:${random}`;
    const sig = crypto.createHmac('sha256', REFRESH_SECRET).update(data).digest('hex');
    return Buffer.from(`${data}:${sig}`).toString('base64url');
  },

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  verifyRefreshToken(token: string): { customerId: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 4) return null;

      const [customerId, expStr, random, sig] = parts;
      if (!customerId || !expStr || !random || !sig) return null;

      const data = `${customerId}:${expStr}:${random}`;
      const expectedSig = crypto.createHmac('sha256', REFRESH_SECRET).update(data).digest('hex');

      const sigBuf = Buffer.from(sig, 'hex');
      const expectedBuf = Buffer.from(expectedSig, 'hex');
      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const exp = parseInt(expStr, 10);
      const now = Math.floor(Date.now() / 1000);
      if (!Number.isFinite(exp) || exp < now) {
        return null;
      }

      return { customerId };
    } catch {
      return null;
    }
  },

  verifyAccessToken(token: string): LoyaltyTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as LoyaltyTokenPayload;
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return null; // Expirado
      }

      return decoded;
    } catch {
      return null;
    }
  },
};
