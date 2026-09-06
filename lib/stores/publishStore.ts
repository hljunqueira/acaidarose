'use client'

import { create } from 'zustand'
import { emitCatalogSync } from '@/lib/utils/catalogSync'

export interface PendingChangeItem {
  reason: string
  timestamp: string
}

interface PublishState {
  hasPendingChanges: boolean
  pendingCount: number
  pendingSummary: PendingChangeItem[]
  currentVersion: number
  lastPublishedAt: string | null
  isPublishing: boolean
  lastCheckedTenantId: string | null

  checkPending: (tenantId: string, customFetch?: (url: string, init?: RequestInit) => Promise<Response>) => Promise<void>
  markDirty: (tenantId: string, reason: string, customFetch?: (url: string, init?: RequestInit) => Promise<Response>) => Promise<void>
  publish: (
    tenantId: string,
    options?: { replicateAll?: boolean; note?: string },
    customFetch?: (url: string, init?: RequestInit) => Promise<Response>
  ) => Promise<{ success: boolean; version?: number; message?: string }>
}

export const usePublishStore = create<PublishState>((set, get) => ({
  hasPendingChanges: false,
  pendingCount: 0,
  pendingSummary: [],
  currentVersion: 1,
  lastPublishedAt: null,
  isPublishing: false,
  lastCheckedTenantId: null,

  checkPending: async (tenantId: string, customFetch) => {
    if (!tenantId) return
    try {
      const fetcher = customFetch || fetch
      const res = await fetcher(`/api/catalog/version?tenantId=${encodeURIComponent(tenantId)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        set({
          hasPendingChanges: Boolean(data.hasPendingChanges),
          pendingCount: Number(data.pendingCount) || 0,
          pendingSummary: Array.isArray(data.pendingSummary) ? data.pendingSummary : [],
          currentVersion: Number(data.version) || 1,
          lastPublishedAt: data.publishedAt || null,
          lastCheckedTenantId: tenantId,
        })
      }
    } catch {
      // fallback silencioso
    }
  },

  markDirty: async (tenantId: string, reason: string, customFetch) => {
    if (!tenantId) return
    // Atualização otimista imediata na UI
    const newItem: PendingChangeItem = { reason, timestamp: new Date().toISOString() }
    set((state) => ({
      hasPendingChanges: true,
      pendingCount: state.pendingCount + 1,
      pendingSummary: [newItem, ...state.pendingSummary].slice(0, 20),
    }))

    try {
      const fetcher = customFetch || fetch
      await fetcher('/api/catalog/mark-dirty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, reason }),
      })
    } catch (err) {
      console.error('Erro ao marcar alteração pendente no backend:', err)
    }
  },

  publish: async (tenantId: string, options = {}, customFetch) => {
    if (!tenantId) return { success: false, message: 'ID da loja obrigatório' }
    set({ isPublishing: true })

    try {
      const fetcher = customFetch || fetch
      const res = await fetcher('/api/catalog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          replicateAll: options.replicateAll || false,
          note: options.note || '',
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        set({
          hasPendingChanges: false,
          pendingCount: 0,
          pendingSummary: [],
          currentVersion: data.version || get().currentVersion + 1,
          lastPublishedAt: data.publishedAt || new Date().toISOString(),
          isPublishing: false,
        })

        // Emite evento para todos os clientes locais
        emitCatalogSync({
          tenantId,
          entity: 'catalog',
          action: 'update',
        })

        return {
          success: true,
          version: data.version,
          message: data.message || 'Publicado com sucesso!',
        }
      }

      set({ isPublishing: false })
      return { success: false, message: data.error || 'Falha ao publicar alterações' }
    } catch (err: any) {
      set({ isPublishing: false })
      return { success: false, message: err?.message || 'Erro de conexão ao publicar' }
    }
  },
}))
