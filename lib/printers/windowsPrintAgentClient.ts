/**
 * lib/printers/windowsPrintAgentClient.ts
 * 
 * Cliente singleton para comunicação com o Agente de Impressão Local do Açaí da Rose.
 * Comunica via HTTP loopback local na porta 4040 (http://127.0.0.1:4040).
 */

const AGENT_URL = 'http://127.0.0.1:4040'

export interface AgentStatus {
  online: boolean
  service?: string
  version?: string
  machine?: string
  storeToken?: string
  storeName?: string
  apiUrl?: string
  error?: string
}

export interface AgentPrintPayload {
  printerName: string
  rawBase64?: string
  rawText?: string
  copies?: number
  docName?: string
}

/**
 * Verifica se o executável do Agente está aberto e rodando no Windows
 */
export async function checkAgentStatus(): Promise<AgentStatus> {
  if (typeof window === 'undefined') {
    return { online: false, error: 'Executado fora do navegador' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1200)

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
        service: data.service,
        version: data.version,
        machine: data.machine,
        storeToken: data.storeToken,
        storeName: data.storeName,
        apiUrl: data.apiUrl,
      }
    }
    return { online: false, error: `HTTP ${res.status}` }
  } catch (err: any) {
    clearTimeout(timeoutId)
    return { online: false, error: 'Agente não está em execução nesta máquina' }
  }
}

/**
 * Obtém a lista de impressoras físicas instaladas no Windows detectadas pelo Agente
 */
export async function getAgentPrinters(): Promise<string[]> {
  try {
    const res = await fetch(`${AGENT_URL}/printers`, { method: 'GET' })
    if (res.ok) {
      const data = await res.json()
      return Array.isArray(data.printers) ? data.printers : []
    }
    return []
  } catch (err) {
    console.warn('[Print Agent] Falha ao listar impressoras:', err)
    return []
  }
}

/**
 * Envia um payload direto de impressão para a impressora do Windows via Spooler local
 */
export async function printViaAgent(payload: AgentPrintPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${AGENT_URL}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (res.ok && data.success) {
      return { success: true }
    }
    return { success: false, error: data.error || 'Erro ao imprimir no Agente Windows' }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de comunicação com o Agente Windows na porta 4040' }
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
