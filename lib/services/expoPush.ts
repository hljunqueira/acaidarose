import { query } from '@/lib/db/postgres';

export interface ExpoPushPayload {
  to: string;
  title: string;
  body: string;
  sound?: 'default' | null;
  data?: Record<string, any>;
  channelId?: string;
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export function isValidExpoPushToken(token?: string | null): token is string {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return /^Expo(nent)?PushToken\[.+\]$/.test(trimmed);
}

/**
 * Envia notificações push em lotes de até 100 tokens via Expo Push API oficial.
 * Nunca lança erro fatal para não bloquear fluxos de caixa/PDV.
 */
export async function sendExpoPushMessages(messages: ExpoPushPayload[]): Promise<{
  sent: number;
  failed: number;
}> {
  const valid = messages.filter((m) => isValidExpoPushToken(m.to));
  if (valid.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < valid.length; i += 100) {
    const chunk = valid.slice(i, i + 100).map((m) => ({
      to: m.to.trim(),
      title: m.title,
      body: m.body,
      sound: m.sound === undefined ? 'default' : m.sound,
      channelId: m.channelId || 'default',
      data: m.data || {},
    }));

    try {
      const res = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      if (!res.ok) {
        failed += chunk.length;
        continue;
      }

      const json = await res.json().catch(() => null);
      const tickets = Array.isArray(json?.data) ? json.data : [];
      if (tickets.length === 0) {
        sent += chunk.length;
      } else {
        for (const t of tickets) {
          if (t?.status === 'ok') sent++;
          else failed++;
        }
      }
    } catch (err) {
      console.error('Erro ao enviar Expo Push:', err);
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

/**
 * Envia push para um cliente específico (se tiver push_token ativo registado).
 */
export async function notifyLoyaltyCustomer(
  customerId: string,
  payload: { title: string; body: string; data?: Record<string, any> }
): Promise<void> {
  try {
    const res = await query(
      `SELECT push_token FROM loyalty_customers WHERE id = $1 AND status = 'ACTIVE' AND push_token IS NOT NULL LIMIT 1`,
      [customerId]
    );
    const token = res.rows[0]?.push_token;
    if (!isValidExpoPushToken(token)) return;

    await sendExpoPushMessages([
      {
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
    ]);
  } catch (err) {
    console.error('Erro em notifyLoyaltyCustomer:', err);
  }
}
