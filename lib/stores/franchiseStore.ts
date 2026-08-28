'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Tenant } from '@/types'

export const DEFAULT_AVEIRO_TENANT: Tenant = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Açaí da Rose — Sede Franqueadora & Matriz Aveiro',
  slug: 'aveiro',
  nif: '500123456',
  address: 'Aveiro, Portugal',
  city: 'Aveiro',
  postalCode: '3800-001',
  phone: '',
  mbwayPhone: '',
  currency: 'EUR',
  isHeadquarters: true,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

interface FranchiseState {
  currentTenant: Tenant
  setCurrentTenant: (tenant: Tenant) => void
}

export const useFranchiseStore = create<FranchiseState>()(
  persist(
    (set) => ({
      currentTenant: DEFAULT_AVEIRO_TENANT,
      setCurrentTenant: (tenant: Tenant) => set({ currentTenant: tenant }),
    }),
    { name: 'acai-rose-franchise-v2' }
  )
)
