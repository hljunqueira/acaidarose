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
