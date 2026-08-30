'use client'

export interface TVCallEvent {
  ticket: string
  customerName?: string
  tableNumber?: string | number | null
  status?: string
  timestamp: number
  isQRCode?: boolean
}

const CHANNEL_NAME = 'acai_tv_orders_channel'
const STORAGE_KEY_PREFIX = 'acai_tv_last_call'

const getCallKey = (tenantId?: string) => `${STORAGE_KEY_PREFIX}_${tenantId || 'default'}`

/**
 * Transmite um evento de chamada de senha para a TV
 */
export function broadcastTVCall(data: Omit<TVCallEvent, 'timestamp'>, tenantId?: string) {
  const payload: TVCallEvent = {
    ...data,
    timestamp: Date.now(),
  }

  // 1. Envio via API Backend para sincronização via rede / Smart TV em outros dispositivos
  if (typeof window !== 'undefined') {
    try {
      fetch('/api/tv/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: data.ticket,
          customerName: data.customerName,
          tableNumber: data.tableNumber,
          status: data.status,
          isQRCode: data.isQRCode,
          tenantId,
        }),
      }).catch(() => {})
    } catch {
      // fallback silencioso
    }
  }

  // 2. BroadcastChannel (mesmo navegador / abas abertas)
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage({ type: 'CALL', payload, tenantId })
      channel.close()
    } catch {
      // fallback silencioso
    }
  }

  // 3. LocalStorage (dispara evento 'storage' entre abas e persiste o último chamado)
  if (typeof window !== 'undefined') {
    try {
      if (tenantId) {
        localStorage.setItem(getCallKey(tenantId), JSON.stringify(payload))
      }
      // Sempre grava também na chave padrão para garantir recebimento em Smart TVs sem tenant explicitado
      localStorage.setItem(getCallKey(undefined), JSON.stringify(payload))
      localStorage.setItem('acai_tv_last_call_trigger', String(Date.now()))
    } catch {
      // fallback silencioso
    }
  }
}

/**
 * Limpa a senha em exibição na Smart TV
 */
export function broadcastTVClearCall(tenantId?: string) {
  // 1. Limpa na API Backend
  if (typeof window !== 'undefined') {
    try {
      const url = tenantId ? `/api/tv/call?tenantId=${encodeURIComponent(tenantId)}` : '/api/tv/call'
      fetch(url, { method: 'DELETE' }).catch(() => {})
    } catch {}
  }

  // 2. Limpa no LocalStorage
  if (typeof window !== 'undefined') {
    try {
      if (tenantId) {
        localStorage.removeItem(getCallKey(tenantId))
      }
      localStorage.removeItem(getCallKey(undefined))
      localStorage.setItem('acai_tv_last_call_trigger', String(Date.now()))
    } catch {}
  }

  // 3. Notifica via BroadcastChannel
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage({ type: 'CLEAR', tenantId })
      channel.close()
    } catch {}
  }
}

/**
 * Registra um ouvinte para receber chamadas de senha na TV
 */
export function subscribeToTVCalls(
  callback: (event: TVCallEvent) => void,
  onClear?: () => void,
  targetTenantId?: string
) {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.onmessage = (msg) => {
        if (!msg.data) return
        if (targetTenantId && msg.data.tenantId && msg.data.tenantId !== targetTenantId) return

        if (msg.data.type === 'CLEAR') {
          onClear?.()
        } else if (msg.data.type === 'CALL' && msg.data.payload?.ticket) {
          callback(msg.data.payload)
        } else if (msg.data.ticket) {
          callback(msg.data)
        }
      }
    } catch {
      // fallback
    }
  }

  const handleStorage = (e: StorageEvent) => {
    const key = getCallKey(targetTenantId)
    if (e.key === key) {
      if (!e.newValue) {
        onClear?.()
      } else {
        try {
          const data = JSON.parse(e.newValue)
          if (data && data.ticket) {
            callback(data)
          }
        } catch {}
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
export function getLastTVCall(tenantId?: string): TVCallEvent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getCallKey(tenantId))
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

const SOUND_CONFIG_CHANNEL = 'acai_tv_sound_config_channel'
const SOUND_CONFIG_KEY = 'acai_tv_sound_config'

export interface TVSoundConfig {
  enabled: boolean
  gender: 'female' | 'male'
}

export function broadcastTVSoundConfig(config: TVSoundConfig) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(config))
  } catch {}

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(SOUND_CONFIG_CHANNEL)
      channel.postMessage(config)
      channel.close()
    } catch {}
  }
}

export function subscribeToTVSoundConfig(callback: (config: TVSoundConfig) => void) {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(SOUND_CONFIG_CHANNEL)
      channel.onmessage = (msg) => {
        if (msg.data && typeof msg.data.enabled === 'boolean') {
          callback(msg.data)
        }
      }
    } catch {}
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SOUND_CONFIG_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        if (data && typeof data.enabled === 'boolean') {
          callback(data)
        }
      } catch {}
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.close()
    window.removeEventListener('storage', handleStorage)
  }
}

export function getStoredTVSoundConfig(): TVSoundConfig {
  if (typeof window === 'undefined') return { enabled: true, gender: 'female' }
  try {
    const raw = localStorage.getItem(SOUND_CONFIG_KEY)
    if (!raw) return { enabled: true, gender: 'female' }
    return JSON.parse(raw)
  } catch {
    return { enabled: true, gender: 'female' }
  }
}

const DISPLAY_CONFIG_CHANNEL = 'acai_tv_display_config_channel'
const DISPLAY_CONFIG_KEY = 'acai_tv_display_config'

export interface TVDisplayConfig {
  showCompletedOrders: boolean
}

export function broadcastTVDisplayConfig(config: TVDisplayConfig) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DISPLAY_CONFIG_KEY, JSON.stringify(config))
  } catch {}

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(DISPLAY_CONFIG_CHANNEL)
      channel.postMessage(config)
      channel.close()
    } catch {}
  }
}

export function subscribeToTVDisplayConfig(callback: (config: TVDisplayConfig) => void) {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(DISPLAY_CONFIG_CHANNEL)
      channel.onmessage = (msg) => {
        if (msg.data && typeof msg.data.showCompletedOrders === 'boolean') {
          callback(msg.data)
        }
      }
    } catch {}
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === DISPLAY_CONFIG_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        if (data && typeof data.showCompletedOrders === 'boolean') {
          callback(data)
        }
      } catch {}
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.close()
    window.removeEventListener('storage', handleStorage)
  }
}

export function getStoredTVDisplayConfig(): TVDisplayConfig {
  if (typeof window === 'undefined') return { showCompletedOrders: true }
  try {
    const raw = localStorage.getItem(DISPLAY_CONFIG_KEY)
    if (!raw) return { showCompletedOrders: true }
    return JSON.parse(raw)
  } catch {
    return { showCompletedOrders: true }
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

export interface TVVideoItem {
  id: string
  title: string
  url: string
  active: boolean
  isOfficial?: boolean
  tagLeft?: string
  tagRight?: string
  tagPosition?: 'BOTTOM' | 'TOP' | 'SPLIT'
  showTags?: boolean
}

export const DEFAULT_OFFICIAL_VIDEOS: TVVideoItem[] = [
  {
    id: 'v1',
    title: 'Açaí Puro Artesanal (Rotação)',
    url: '/videos/hero_cup_rotation.mp4',
    active: true,
    isOfficial: true,
    tagLeft: 'Açaí Puro Artesanal',
    tagRight: 'acaidarose.pt',
    tagPosition: 'BOTTOM',
    showTags: true,
  },
  {
    id: 'v2',
    title: 'Textura Cremosa Amazônica',
    url: '/videos/hero_gliding_texture.mp4',
    active: true,
    isOfficial: true,
    tagLeft: 'Cremoso & Nobre',
    tagRight: 'acaidarose.pt',
    tagPosition: 'BOTTOM',
    showTags: true,
  },
  {
    id: 'v3',
    title: 'Frutas & Acompanhamentos Nobres',
    url: '/videos/hero_orbiting_cup.mp4',
    active: true,
    isOfficial: true,
    tagLeft: 'Frutas & Acompanhamentos',
    tagRight: 'acaidarose.pt',
    tagPosition: 'BOTTOM',
    showTags: true,
  },
  {
    id: 'v4',
    title: 'Taça Gourmet Completa',
    url: '/videos/hero_revealing_cup.mp4',
    active: true,
    isOfficial: true,
    tagLeft: 'Taça Gourmet Completa',
    tagRight: 'acaidarose.pt',
    tagPosition: 'BOTTOM',
    showTags: true,
  },
]

const VIDEOS_CHANNEL = 'acai_tv_videos_channel'
const VIDEOS_STORAGE_PREFIX = 'acai_tv_store_videos_'

/**
 * Retorna os vídeos configurados da loja (apenas ativos para a TV, ou toda a lista para o admin)
 */
export function getStoreTVVideos(tenantId?: string): TVVideoItem[] {
  if (typeof window === 'undefined') return DEFAULT_OFFICIAL_VIDEOS
  const key = `${VIDEOS_STORAGE_PREFIX}${tenantId || 'default'}`
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {}
  return DEFAULT_OFFICIAL_VIDEOS
}

/**
 * Transmite e salva a lista de vídeos da loja
 */
export function broadcastTVVideos(videos: TVVideoItem[], tenantId?: string) {
  if (typeof window === 'undefined') return
  const key = `${VIDEOS_STORAGE_PREFIX}${tenantId || 'default'}`

  try {
    localStorage.setItem(key, JSON.stringify(videos))
  } catch {}

  if ('BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(VIDEOS_CHANNEL)
      channel.postMessage({ tenantId: tenantId || 'default', videos, timestamp: Date.now() })
      channel.close()
    } catch {}
  }
}

/**
 * Registra um ouvinte para receber atualizações de vídeos da TV em tempo real
 */
export function subscribeToTVVideos(callback: (videos: TVVideoItem[]) => void, tenantId?: string) {
  if (typeof window === 'undefined') return () => {}

  let channel: BroadcastChannel | null = null
  const expectedTenant = tenantId || 'default'

  if ('BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(VIDEOS_CHANNEL)
      channel.onmessage = (msg) => {
        if (msg.data && Array.isArray(msg.data.videos)) {
          if (!msg.data.tenantId || msg.data.tenantId === expectedTenant || expectedTenant === 'default') {
            callback(msg.data.videos)
          }
        }
      }
    } catch {}
  }

  const key = `${VIDEOS_STORAGE_PREFIX}${expectedTenant}`
  const handleStorage = (e: StorageEvent) => {
    if (e.key === key && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue)
        if (Array.isArray(parsed)) {
          callback(parsed)
        }
      } catch {}
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    if (channel) channel.close()
    window.removeEventListener('storage', handleStorage)
  }
}
