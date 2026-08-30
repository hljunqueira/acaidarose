'use client'

export interface TVCallEvent {
  ticket: string
  customerName?: string
  status?: string
  timestamp: number
}

const CHANNEL_NAME = 'acai_tv_orders_channel'
const STORAGE_KEY = 'acai_tv_last_call'

/**
 * Transmite um evento de chamada de senha para a TV
 */
export function broadcastTVCall(data: Omit<TVCallEvent, 'timestamp'>) {
  const payload: TVCallEvent = {
    ...data,
    timestamp: Date.now(),
  }

  // 1. BroadcastChannel (mesmo navegador / abas abertas)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage(payload)
      channel.close()
    } catch {
      // fallback silencioso
    }
  }

  // 2. LocalStorage (dispara evento 'storage' entre abas e persiste o último chamado)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // fallback silencioso
    }
  }
}

/**
 * Registra um ouvinte para receber chamadas de senha na TV
 */
export function subscribeToTVCalls(callback: (event: TVCallEvent) => void) {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.onmessage = (msg) => {
        if (msg.data && msg.data.ticket) {
          callback(msg.data)
        }
      }
    } catch {
      // fallback
    }
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        if (data && data.ticket) {
          callback(data)
        }
      } catch {
        // ignore
      }
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) {
      channel.close()
    }
    window.removeEventListener('storage', handleStorage)
  }
}

/**
 * Obtém a última chamada salva
 */
export function getLastTVCall(): TVCallEvent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const MARQUEE_CHANNEL = 'acai_tv_marquee_channel'
const MARQUEE_STORAGE_KEY = 'acai_tv_custom_marquee'

/**
 * Transmite uma mensagem personalizada para o Marquee da TV
 */
export function broadcastTVMarquee(message: string) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MARQUEE_STORAGE_KEY, message)
  } catch {}

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(MARQUEE_CHANNEL)
      channel.postMessage({ message, timestamp: Date.now() })
      channel.close()
    } catch {}
  }
}

/**
 * Registra um ouvinte para receber atualizações do Marquee na TV
 */
export function subscribeToTVMarquee(callback: (message: string) => void) {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(MARQUEE_CHANNEL)
      channel.onmessage = (msg) => {
        if (msg.data && typeof msg.data.message === 'string') {
          callback(msg.data.message)
        }
      }
    } catch {}
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === MARQUEE_STORAGE_KEY && typeof e.newValue === 'string') {
      callback(e.newValue)
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.close()
    window.removeEventListener('storage', handleStorage)
  }
}

/**
 * Retorna a mensagem personalizada gravada do Marquee
 */
export function getCustomTVMarquee(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(MARQUEE_STORAGE_KEY) || ''
  } catch {}
  return ''
}
