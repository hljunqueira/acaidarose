'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Tenant } from '@/types'

export const DEFAULT_FIGUEIRA_TENANT: Tenant = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Loja 1 - Figueira da Foz (Matriz)',
  slug: 'figueira-da-foz',
  nif: '500123456',
  address: 'Avenida 25 de Abril, Edifício Claridade',
  city: 'Figueira da Foz',
  postalCode: '3080-001',
  phone: '+351 913 550 770',
  mbwayPhone: '+351 913 550 770',
  currency: 'EUR',
  isHeadquarters: true,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const DEFAULT_TORRES_NOVAS_TENANT: Tenant = {
  id: '22222222-2222-2222-2222-222222222222',
  name: 'Loja 2 - Torres Novas (Filial 1)',
  slug: 'torres-novas',
  nif: '500987654',
  address: 'Rua do Comércio 12',
  city: 'Torres Novas',
  postalCode: '2350-001',
  phone: '+351 913 400 600',
  mbwayPhone: '+351 913 400 600',
  currency: 'EUR',
  isHeadquarters: false,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const DEFAULT_AVEIRO_FRANCHISE_TENANT: Tenant = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Loja 3 - Aveiro (Franquia)',
  slug: 'aveiro',
  nif: '500333222',
  address: 'Avenida Dr. Lourenço Peixinho 85',
  city: 'Aveiro',
  postalCode: '3800-164',
  phone: '+351 913 300 400',
  mbwayPhone: '+351 913 300 400',
  currency: 'EUR',
  isHeadquarters: false,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Retrocompatibilidade
export const DEFAULT_AVEIRO_TENANT = DEFAULT_FIGUEIRA_TENANT

export const INITIAL_TENANTS: Tenant[] = [
  DEFAULT_FIGUEIRA_TENANT,
  DEFAULT_TORRES_NOVAS_TENANT,
  DEFAULT_AVEIRO_FRANCHISE_TENANT,
]

interface FranchiseState {
  currentTenant: Tenant
  tenants: Tenant[]
  setCurrentTenant: (tenant: Tenant) => void
  setTenants: (tenants: Tenant[]) => void
  fetchTenants: (customFetch?: (url: string, init?: RequestInit) => Promise<Response>) => Promise<Tenant[]>
  getTenant: (idOrSlug?: string | null) => Tenant | undefined
}

export const useFranchiseStore = create<FranchiseState>()(
  persist(
    (set, get) => ({
      currentTenant: DEFAULT_FIGUEIRA_TENANT,
      tenants: INITIAL_TENANTS,
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
        const clean = String(idOrSlug).trim().toLowerCase()
        const list = get().tenants || INITIAL_TENANTS
        // Busca exata por ID ou por Slug
        return (
          list.find((t) => t.id === idOrSlug || t.slug.toLowerCase() === clean) ||
          list.find((t) => t.name.toLowerCase().includes(clean)) ||
          get().currentTenant
        )
      },
    }),
    {
      name: 'acai-rose-franchise-v3', // v3 para limpar cache persistido com nome antigo de Aveiro na Matriz
    }
  )
)
