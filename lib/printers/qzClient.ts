/**
 * lib/printers/qzClient.ts
 * 
 * Gerenciador singleton do QZ Tray para Next.js (Client-side)
 * Comunicação direta com o serviço QZ Tray local (WSS porta 8182 / WS 8181)
 */

let qzInstance: any = null

async function getQZ() {
  if (typeof window === 'undefined') return null
  if (!qzInstance) {
    const mod = await import('qz-tray')
    qzInstance = mod.default || mod
  }
  return qzInstance
}

export interface QZConnectionStatus {
  connected: boolean
  version?: string
  error?: string
}

let securityConfigured = false

/**
 * Configura os certificados e promessas de assinatura digital com a API da Franqueadora (se configurados)
 */
async function configureSecurity(qz: any) {
  if (securityConfigured) return
  try {
    const certRes = await fetch('/api/qz/cert')
    if (certRes.ok) {
      const cert = await certRes.text()
      if (cert && cert.includes('BEGIN CERTIFICATE') && !cert.includes('não configurado')) {
        qz.security.setCertificatePromise((resolve: (c: string) => void) => resolve(cert))
        qz.security.setSignatureAlgorithm('SHA512')
        qz.security.setSignaturePromise((toSign: string) => {
          return (resolve: (signature: string) => void, reject: (err: any) => void) => {
            fetch('/api/qz/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: toSign,
            })
              .then((res) => res.text())
              .then((signature) => resolve(signature))
              .catch((err) => reject(err))
          }
        })
      }
    }
    securityConfigured = true
  } catch (err) {
    console.warn('[QZ Tray] Assinatura opcional não configurada:', err)
  }
}

/**
 * Conecta ao QZ Tray no computador local
 */
export async function connectQZ(): Promise<QZConnectionStatus> {
  if (typeof window === 'undefined') {
    return { connected: false, error: 'Executado fora do navegador' }
  }

  try {
    const qz = await getQZ()
    if (!qz) return { connected: false, error: 'Biblioteca QZ Tray indisponível' }

    if (qz.websocket.isActive()) {
      const version = qz.version || 'v2.2+'
      return { connected: true, version }
    }

    await configureSecurity(qz)

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'

    // Usa a configuração oficial e automática do QZ Tray:
    // - Em HTTPS: usa WSS (portas seguras 8181, 8282) e domínios com fallback (localhost, localhost.qz.io, qz.surf)
    // - Em HTTP: usa WS (portas inseguras 8182, 8283)
    await qz.websocket.connect({
      usingSecure: isHttps,
      keepAlive: 60,
      retries: 2,
      delay: 1,
    })

    const version = qz.version || 'v2.2+'
    return { connected: true, version }
  } catch (err: any) {
    console.warn('[QZ Tray] Erro de conexão:', err?.message || err)
    return {
      connected: false,
      error: err?.message || 'QZ Tray não está em execução ou foi bloqueado pelo navegador.',
    }
  }
}

/**
 * Verifica se a conexão com o QZ Tray está ativa
 */
export async function isQZConnected(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const qz = await getQZ()
    return qz?.websocket?.isActive() || false
  } catch {
    return false
  }
}

/**
 * Lista todas as impressoras instaladas no Windows / Mac / Linux detectadas pelo QZ Tray
 */
export async function getInstalledPrinters(): Promise<string[]> {
  try {
    const qz = await getQZ()
    if (!qz) return []

    if (!qz.websocket.isActive()) {
      const conn = await connectQZ()
      if (!conn.connected) return []
    }

    const printers = await qz.printers.find()
    return Array.isArray(printers) ? printers : []
  } catch (err) {
    console.warn('[QZ Tray] Erro ao listar impressoras instaladas:', err)
    return []
  }
}

/**
 * Envia dados brutos ESC/POS para a impressora via QZ Tray
 */
export async function printRawData(printerName: string, rawData: (string | number[])[]): Promise<boolean> {
  const qz = await getQZ()
  if (!qz) throw new Error('Biblioteca QZ Tray indisponível')

  if (!qz.websocket.isActive()) {
    const conn = await connectQZ()
    if (!conn.connected) {
      throw new Error(conn.error || 'Não foi possível conectar ao QZ Tray local.')
    }
  }

  const config = qz.configs.create(printerName, {
    encoding: 'CP850', // Tabela para suporte de acentuação em PT-PT
  })

  await qz.print(config, rawData)
  return true
}
