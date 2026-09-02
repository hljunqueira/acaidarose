/**
 * Utilitário de sincronização em tempo real do catálogo (Menu, Categorias, Produtos e Opcionais)
 * Permite atualizar o cardápio público, PDV e QR Code instantaneamente sem recarregar a página (F5)
 */

export interface CatalogSyncEventDetail {
  tenantId?: string
  entity?: 'product' | 'category' | 'menu' | 'option' | 'catalog'
  action?: 'toggle_active' | 'update' | 'reorder' | 'delete'
  entityId?: string
  active?: boolean
  timestamp: number
}

const SYNC_CHANNEL_NAME = 'acai_catalog_sync_channel'
const SYNC_EVENT_NAME = 'acai_catalog_updated'
const STORAGE_KEY = 'acai_last_catalog_sync'

let broadcastChannel: BroadcastChannel | null = null

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  if (!broadcastChannel && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME)
    } catch {
      broadcastChannel = null
    }
  }
  return broadcastChannel
}

/**
 * Emite um evento de sincronização para todas as abas e instâncias locais
 */
export function emitCatalogSync(detail: Omit<CatalogSyncEventDetail, 'timestamp'>) {
  if (typeof window === 'undefined') return

  const payload: CatalogSyncEventDetail = {
    ...detail,
    timestamp: Date.now(),
  }

  // 1. Emite para a janela atual via CustomEvent
  window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail: payload }))

  // 2. Emite entre abas/janelas via BroadcastChannel
  const ch = getBroadcastChannel()
  if (ch) {
    ch.postMessage(payload)
  }

  // 3. Fallback via LocalStorage para navegadores sem BroadcastChannel
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

/**
 * Registra um ouvinte para sincronização em tempo real do catálogo
 */
export function subscribeCatalogSync(callback: (detail: CatalogSyncEventDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  // Ouvinte do evento na mesma janela
  const handleLocalEvent = (e: Event) => {
    const customEvt = e as CustomEvent<CatalogSyncEventDetail>
    if (customEvt.detail) {
      callback(customEvt.detail)
    }
  }
  window.addEventListener(SYNC_EVENT_NAME, handleLocalEvent)

  // Ouvinte entre abas via BroadcastChannel
  const ch = getBroadcastChannel()
  const handleBroadcastMessage = (e: MessageEvent) => {
    if (e.data && e.data.timestamp) {
      callback(e.data)
    }
  }
  if (ch) {
    ch.addEventListener('message', handleBroadcastMessage)
  }

  // Ouvinte de fallback via LocalStorage
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        callback(data)
      } catch {
        // ignore
      }
    }
  }
  window.addEventListener('storage', handleStorageEvent)

  return () => {
    window.removeEventListener(SYNC_EVENT_NAME, handleLocalEvent)
    if (ch) {
      ch.removeEventListener('message', handleBroadcastMessage)
    }
    window.removeEventListener('storage', handleStorageEvent)
  }
}
