'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Tenant } from '@/types'
import { DEFAULT_TENANT } from '@/lib/supabase/mockStore'

interface FranchiseState {
  currentTenant: Tenant
  setCurrentTenant: (tenant: Tenant) => void
}

export const useFranchiseStore = create<FranchiseState>()(
  persist(
    (set) => ({
      currentTenant: DEFAULT_TENANT,
      setCurrentTenant: (tenant: Tenant) => set({ currentTenant: tenant }),
    }),
    { name: 'acai-rose-franchise-v1' }
  )
)
