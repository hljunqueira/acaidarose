'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Tenant } from '@/types'

export const FIGUEIRA_HQ_ID = '11111111-1111-1111-1111-111111111111'

// Objeto base mínimo para fallback antes do primeiro fetch ou em SSR
export const DEFAULT_FIGUEIRA_TENANT: Tenant = {
  id: FIGUEIRA_HQ_ID,
  name: 'Loja 1 - Figueira da Foz (Matriz)',
  slug: 'figueira-da-foz',
  currency: 'EUR',
  isHeadquarters: true,
  active: true,
}



export function resolveTenant(idOrSlug?: string | null, tenantsList?: Tenant[]): Tenant {
  const list = tenantsList && tenantsList.length > 0 ? tenantsList : [DEFAULT_FIGUEIRA_TENANT]
  if (!idOrSlug) return list[0] || DEFAULT_FIGUEIRA_TENANT

  const clean = String(idOrSlug).trim().toLowerCase()

  // 1. Busca exata por ID
  const byId = list.find((t) => t.id.toLowerCase() === clean)
  if (byId) return byId

  // 2. Busca exata por Slug
  const bySlug = list.find((t) => t.slug.toLowerCase() === clean)
  if (bySlug) return bySlug

  // 3. Busca inteligente por correspondência no nome ou slug
  const matched = list.find(
    (t) => t.slug.toLowerCase().includes(clean) || t.name.toLowerCase().includes(clean)
  )
  if (matched) return matched

  return list[0] || DEFAULT_FIGUEIRA_TENANT
}

/**
 * Retorna o nome limpo da cidade/localização da loja para exibição em Smart TVs e cabeçalhos,
 * eliminando prefixos técnicos e termos internos como "Loja 1 -" ou "(Matriz)".
 */
export function getDisplayStoreLocation(tenant?: Tenant | null, rawLoja?: string): string {
  if (rawLoja) {
    const clean = rawLoja.toLowerCase().trim()
    if (clean.includes('aveiro') || clean === '3') return 'Aveiro'
    if (clean.includes('torres') || clean === '2') return 'Torres Novas'
    if (clean.includes('figueira') || clean === '1') return 'Figueira da Foz'
  }

  if (!tenant) return 'Figueira da Foz'
  if (tenant.city && tenant.city.trim()) return tenant.city.trim()

  const raw = tenant.name || ''
  const clean = raw
    .replace(/^Loja\s*\d+\s*[-–—]\s*/i, '')
    .replace(/\s*\((Matriz|Franquia|Filial\s*\d*)\)/gi, '')
    .replace(/^Açaí da Rose\s*[-–—·]\s*/i, '')
    .trim()

  return clean || tenant.city || 'Figueira da Foz'
}

/**
 * Retorna o nome público e sanitizado da loja para clientes (Smart TVs, QR Codes de mesa e Ementa),
 * removendo termos de auditoria interna como "Loja 1 -", "(Matriz)", "(Filial 1)", "(Franquia)".
 * Formato limpo: "Açaí da Rose — Figueira da Foz" ou apenas "Figueira da Foz"
 */
export function getPublicStoreName(tenant?: Tenant | null, rawLoja?: string, includeBrand = true): string {
  const location = getDisplayStoreLocation(tenant, rawLoja)
  if (!includeBrand) return location
  return `Açaí da Rose — ${location}`
}

interface FranchiseState {
  currentTenant: Tenant
  tenants: Tenant[]
  setCurrentTenant: (tenant: Tenant) => void
  setTenants: (tenants: Tenant[]) => void
  fetchTenants: (customFetch?: (url: string, init?: RequestInit) => Promise<Response>) => Promise<Tenant[]>
  getTenant: (idOrSlug?: string | null) => Tenant | undefined
}

export const INITIAL_TENANTS: Tenant[] = [DEFAULT_FIGUEIRA_TENANT]

export const useFranchiseStore = create<FranchiseState>()(
  persist(
    (set, get) => ({
      currentTenant: DEFAULT_FIGUEIRA_TENANT,
      tenants: [DEFAULT_FIGUEIRA_TENANT],
      setCurrentTenant: (tenant: Tenant) => {
        set({ currentTenant: tenant })
      },
      setTenants: (tenants: Tenant[]) => {
        set({ tenants })
      },
      fetchTenants: async (customFetch) => {
        try {
          const fetcher = customFetch || fetch
          const res = await fetcher('/api/tenants')
          if (!res.ok) return get().tenants
          const data = await res.json()
          const list: Tenant[] = Array.isArray(data.tenants) ? data.tenants : []
          if (list.length > 0) {
            set({ tenants: list })
            // Se o currentTenant for o padrão antigo ou estiver desatualizado, sincroniza
            const current = get().currentTenant
            const updatedCurrent = list.find((t) => t.id === current.id)
            if (updatedCurrent) {
              set({ currentTenant: updatedCurrent })
            }
            return list
          }
          return get().tenants
        } catch (err) {
          console.error('Erro ao buscar tenants da rede:', err)
          return get().tenants
        }
      },
      getTenant: (idOrSlug?: string | null) => {
        if (!idOrSlug) return get().currentTenant
        return resolveTenant(idOrSlug, get().tenants)
      },
    }),
    {
      name: 'acai-rose-franchise-v4', // v4 para limpar caches persistidos de versões anteriores
    }
  )
)
