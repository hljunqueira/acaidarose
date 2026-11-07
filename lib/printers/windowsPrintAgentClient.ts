/**
 * lib/printers/windowsPrintAgentClient.ts
 * 
 * Cliente para comunicação com o Agente de Impressão Windows do Açaí da Rose.
 * Suporta modo duplo:
 * 1. Loopback Local direto (http://127.0.0.1:4040) quando em ambiente HTTP ou desenvolvimento;
 * 2. Conexão em Nuvem (/api/printers/agent/status) quando acessado via HTTPS de produção,
 *    evitando bloqueios de Mixed Content do Chrome/Edge.
 */

const AGENT_URL = 'http://127.0.0.1:4040'

export interface AgentStatus {
  online: boolean
  source?: 'LOCAL' | 'CLOUD_HEARTBEAT'
  service?: string
  version?: string
  machine?: string
  storeToken?: string
  storeName?: string
  apiUrl?: string
  diffSeconds?: number
  lastSeenAt?: string
  error?: string
}

export interface AgentPrintPayload {
  tenantId?: string
  orderId?: string
  orderNumber?: string | number
  printerName: string
  rawBase64?: string
  rawText?: string
  copies?: number
  docName?: string
  forceReprint?: boolean
}

/**
 * Verifica se o executável do Agente está aberto e rodando no Windows.
 * Em HTTPS (produção), consulta o heartbeat na nuvem para não ser bloqueado por Mixed Content.
 */
export async function checkAgentStatus(tenantId?: string): Promise<AgentStatus> {
  if (typeof window === 'undefined') {
    return { online: false, error: 'Executado fora do navegador' }
  }

  const isHttps = window.location.protocol === 'https:'

  // 1. Se estamos em HTTPS, consulta prioritariamente o heartbeat em nuvem do servidor
  if (isHttps || tenantId) {
    try {
      const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
      const res = await fetch(`/api/printers/agent/status${q}`, {
        method: 'GET',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.online) {
          return {
            online: true,
            source: 'CLOUD_HEARTBEAT',
            service: data.service || 'Servidor Windows Ativo (Nuvem)',
            storeName: data.tenantName,
            lastSeenAt: data.lastSeenAt,
            diffSeconds: data.diffSeconds,
          }
        }
      }
    } catch {
      // continua para tentar o loopback local se houver
    }
  }

  // 2. Tenta o loopback local na porta 4040
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 800)

  try {
    const res = await fetch(`${AGENT_URL}/status`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      return {
        online: true,
        source: 'LOCAL',
        service: data.service,
        version: data.version,
        machine: data.machine,
        storeToken: data.storeToken,
        storeName: data.storeName,
        apiUrl: data.apiUrl,
      }
    }
  } catch {
    clearTimeout(timeoutId)
  }

  // 3. Fallback final: se tenantId foi passado mas a etapa 1 falhou por timeout
  if (tenantId) {
    try {
      const res = await fetch(`/api/printers/agent/status?tenantId=${encodeURIComponent(tenantId)}`, {
        method: 'GET',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        return {
          online: Boolean(data.online),
          source: 'CLOUD_HEARTBEAT',
          service: data.service,
          storeName: data.tenantName,
          diffSeconds: data.diffSeconds,
        }
      }
    } catch {}
  }

  return { online: false, error: 'Servidor Windows não detectado nesta máquina ou unidade' }
}

/**
 * Obtém a lista de impressoras físicas instaladas no Windows detectadas pelo Agente
 */
export async function getAgentPrinters(tenantId?: string): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 800)

    const res = await fetch(`${AGENT_URL}/printers`, { method: 'GET', signal: controller.signal })
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.printers) && data.printers.length > 0) {
        return data.printers
      }
    }
  } catch {
    // Se o loopback falhar (Mixed Content em HTTPS), busca as impressoras cadastradas no banco da loja
  }

  if (tenantId) {
    try {
      const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/printers`, { method: 'GET' })
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data.printers) ? data.printers : []
        const driverNames = list.map((p: any) => p.driverName || p.driver_name).filter(Boolean)
        return Array.from(new Set(driverNames)) as string[]
      }
    } catch {}
  }

  return []
}

/**
 * Envia um payload de impressão:
 * - Se o agente local responder via loopback, imprime imediatamente via spooler local;
 * - Se estiver em HTTPS de produção ou loopback bloqueado, enfileira automaticamente na nuvem (/api/printers/agent/jobs).
 */
export async function printViaAgent(payload: AgentPrintPayload): Promise<{ success: boolean; error?: string; usedEngine?: string }> {
  // 1. Tenta impressão direta local se não estiver bloqueado
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000)

    const res = await fetch(`${AGENT_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await res.json()
    if (res.ok && data.success) {
      return { success: true, usedEngine: 'LOCAL_AGENT' }
    }
  } catch {
    // Se o loopback falhar (ex: bloqueado por Mixed Content em HTTPS), enfileira na nuvem
  }

  // 2. Enfileira na fila em nuvem (/api/printers/agent/jobs)
  try {
    const res = await fetch('/api/printers/agent/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: payload.tenantId,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        printerName: payload.printerName,
        docName: payload.docName || 'Cupom Açaí da Rose',
        payloadText: payload.rawText,
        payloadBase64: payload.rawBase64,
        copies: payload.copies || 1,
        forceReprint: payload.forceReprint,
      }),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      return { success: true, usedEngine: 'CLOUD_QUEUE' }
    }
    return { success: false, error: data.error || 'Falha ao enfileirar job na nuvem' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de comunicação com o servidor de impressão' }
  }
}

/**
 * Vincula o Token da Loja diretamente no executável local com 1 clique
 */
export async function configureAgentStoreToken(storeToken: string, apiUrl?: string): Promise<{ success: boolean; error?: string; storeName?: string }> {
  try {
    const res = await fetch(`${AGENT_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeToken,
        apiUrl: apiUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
      }),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      return { success: true, storeName: data.storeName }
    }
    return { success: false, error: data.error || 'Erro ao vincular token' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Agente Windows não respondeu' }
  }
}
