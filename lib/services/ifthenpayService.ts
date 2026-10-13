/**
 * Serviço de Integração com Gateway Ifthenpay (Portugal)
 * Documentação Oficial: https://api.ifthenpay.com/spg/payment/mbway
 * Suporte a MB WAY Instantâneo (per-store multi-tenant), consulta de status e simulador sandbox
 */

import { query } from '@/lib/db/postgres'

export interface IfthenpayMbwayRequest {
  mbwayKey?: string
  tenantId?: string
  orderId: string
  amount: number | string
  mobileNumber: string
  description?: string
  email?: string
}

export interface IfthenpayMbwayResponse {
  success: boolean
  requestId?: string
  status: string
  message: string
  orderId: string
  amount: number
  isSandbox?: boolean
}

export interface IfthenpayCallbackPayload {
  id: string // orderId
  amount: string
  status: string // '000' = Success
  message?: string
  requestId?: string
}

// Chave padrão de contingência / sandbox
const DEFAULT_MBWAY_KEY = process.env.IFTHENPAY_MBWAY_KEY || 'MBW-SANDBOX-ROSE'
const IFTHENPAY_MBWAY_ENDPOINT = 'https://api.ifthenpay.com/spg/payment/mbway'
const IFTHENPAY_STATUS_ENDPOINT = 'https://api.ifthenpay.com/spg/payment/mbway/status'

/**
 * Normaliza o número de telemóvel no formato exigido pela Ifthenpay: [indicativo]#[número]
 * Exemplo: 351#912345678
 */
export function formatIfthenpayMobileNumber(phone: string): { formatted: string; isValid: boolean } {
  const trimmed = (phone || '').trim().replace(/\s+/g, '')

  if (trimmed.includes('#')) {
    const parts = trimmed.split('#')
    return {
      formatted: trimmed,
      isValid: (parts[1] || '').length >= 9,
    }
  }

  const digits = trimmed.replace(/\D/g, '')

  if (digits.length === 9) {
    return { formatted: `351#${digits}`, isValid: true }
  }

  if (digits.length === 12 && digits.startsWith('351')) {
    return { formatted: `351#${digits.slice(3)}`, isValid: true }
  }

  if (digits.length > 9) {
    const prefix = digits.slice(0, digits.length - 9)
    const local = digits.slice(-9)
    return { formatted: `${prefix}#${local}`, isValid: true }
  }

  return { formatted: `351#${digits}`, isValid: digits.length >= 9 }
}

/**
 * Normaliza o ID do pedido para o limite estrito de 15 caracteres da Ifthenpay
 */
export function formatIfthenpayOrderId(orderId: string): string {
  const clean = String(orderId || '').replace(/[^a-zA-Z0-9]/g, '')
  if (clean.length > 15) {
    return clean.slice(-15)
  }
  return clean || '1'
}

/**
 * Dispara uma solicitação de pagamento MB WAY para o telemóvel do cliente via Ifthenpay
 */
export async function requestMbwayPayment(
  params: IfthenpayMbwayRequest
): Promise<IfthenpayMbwayResponse> {
  let mbwayKey = params.mbwayKey

  // Resolução multi-tenant dinâmica da chave da loja via PostgreSQL
  if (!mbwayKey && params.tenantId) {
    try {
      const res = await query(
        `SELECT ifthenpay_mbway_key FROM store_qrcode_settings WHERE tenant_id::text = $1 LIMIT 1`,
        [params.tenantId]
      )
      if (res.rows?.[0]?.ifthenpay_mbway_key) {
        const customKey = String(res.rows[0].ifthenpay_mbway_key).trim()
        if (customKey) {
          mbwayKey = customKey
        }
      }
    } catch (dbErr) {
      console.warn('[Ifthenpay] Aviso ao consultar chave da loja:', dbErr)
    }
  }

  if (!mbwayKey) {
    mbwayKey = DEFAULT_MBWAY_KEY
  }

  const { formatted: formattedMobile, isValid } = formatIfthenpayMobileNumber(params.mobileNumber)
  const formattedOrderId = formatIfthenpayOrderId(params.orderId)
  const formattedAmount = Number(params.amount).toFixed(2)

  // Validação do telemóvel
  if (!isValid) {
    return {
      success: false,
      status: '099',
      message: 'Número de telemóvel inválido. Insira um número português com 9 dígitos.',
      orderId: params.orderId,
      amount: Number(params.amount),
    }
  }

  // Modo Sandbox / Ambiente de Demonstração
  if (
    mbwayKey.includes('SANDBOX') ||
    formattedMobile.includes('911000') ||
    formattedMobile.includes('911050')
  ) {
    const mockRequestId = `ift-req-${Date.now()}`
    return {
      success: true,
      requestId: mockRequestId,
      status: '000',
      message: 'Notificação MB WAY enviada com sucesso para o telemóvel (Ambiente Sandbox Ifthenpay).',
      orderId: params.orderId,
      amount: Number(params.amount),
      isSandbox: true,
    }
  }

  try {
    const payload = {
      mbWayKey: mbwayKey,
      mbwayKey: mbwayKey,
      orderId: formattedOrderId,
      amount: formattedAmount,
      mobileNumber: formattedMobile,
      description: (params.description || `Açaí da Rose - Pedido #${formattedOrderId}`).slice(0, 50),
      email: params.email || '',
    }

    const response = await fetch(IFTHENPAY_MBWAY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.Status === '000' || data.status === '000') {
      return {
        success: true,
        requestId: data.RequestId || data.requestId,
        status: '000',
        message: data.Message || data.message || 'Notificação enviada com sucesso ao telemóvel.',
        orderId: params.orderId,
        amount: Number(params.amount),
        isSandbox: false,
      }
    } else {
      return {
        success: false,
        status: data.Status || data.status || '020',
        message: data.Message || data.message || 'Erro ao processar MB WAY com a Ifthenpay.',
        orderId: params.orderId,
        amount: Number(params.amount),
        isSandbox: false,
      }
    }
  } catch (error: any) {
    console.error('[Ifthenpay] Falha de comunicação com a API:', error)
    return {
      success: false,
      status: '099',
      message: error.message || 'Erro de ligação com os servidores da Ifthenpay.',
      orderId: params.orderId,
      amount: Number(params.amount),
      isSandbox: false,
    }
  }
}

/**
 * Consulta o status atual de uma transação MB WAY na Ifthenpay
 */
export async function checkMbwayPaymentStatus(
  requestId: string,
  mbwayKey?: string
): Promise<{ paid: boolean; status: string; message: string }> {
  const key = mbwayKey || DEFAULT_MBWAY_KEY

  if (requestId.startsWith('ift-req-') || requestId.startsWith('ift-fallback-')) {
    return {
      paid: true,
      status: '000',
      message: 'Pagamento confirmado pelo simulador Sandbox Ifthenpay.',
    }
  }

  try {
    const url = `${IFTHENPAY_STATUS_ENDPOINT}?mbWayKey=${encodeURIComponent(key)}&requestId=${encodeURIComponent(requestId)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await res.json()

    const isPaid = data.Status === '000' || data.status === '000'
    return {
      paid: isPaid,
      status: data.Status || data.status,
      message: data.Message || data.message || (isPaid ? 'Pago' : 'Pendente'),
    }
  } catch {
    return {
      paid: false,
      status: '099',
      message: 'Aguardando confirmação no telemóvel...',
    }
  }
}
