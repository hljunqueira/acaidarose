import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OfferItem {
  id: string
  title: string
  description: string
  scope: 'GLOBAL' | 'LOCAL'
  tenantId?: string | null
  productId?: string | null
  productName?: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  validDays: string
  validHours: string
  couponCode?: string
  badgeLabel?: string
  active: boolean
  createdAt?: string
}

export const INITIAL_OFFERS: OfferItem[] = []

interface OffersState {
  offers: OfferItem[]
  storeOfferOverrides: Record<string, Record<string, boolean>> // tenantId -> { offerId: boolean }

  addOffer: (offer: OfferItem) => void
  updateOffer: (id: string, updates: Partial<OfferItem>) => void
  deleteOffer: (id: string) => void
  toggleOfferActiveGlobal: (id: string) => void
  toggleOfferActiveStore: (tenantId: string, offerId: string) => void
  getOffersForTenant: (tenantId: string) => OfferItem[]
  getActiveOffersForTenant: (tenantId: string) => OfferItem[]
  isOfferActiveInStore: (tenantId: string, offer: OfferItem) => boolean
}

export const useOffersStore = create<OffersState>()(
  persist(
    (set, get) => ({
      offers: INITIAL_OFFERS,
      storeOfferOverrides: {},

      addOffer: (offer) => {
        set((state) => ({
          offers: [offer, ...state.offers],
        }))
      },

      updateOffer: (id, updates) => {
        set((state) => ({
          offers: state.offers.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        }))
      },

      deleteOffer: (id) => {
        set((state) => ({
          offers: state.offers.filter((o) => o.id !== id),
        }))
      },

      toggleOfferActiveGlobal: (id) => {
        set((state) => ({
          offers: state.offers.map((o) => (o.id === id ? { ...o, active: !o.active } : o)),
        }))
      },

      toggleOfferActiveStore: (tenantId, offerId) => {
        set((state) => {
          const storeOverrides = state.storeOfferOverrides[tenantId] || {}
          const offer = state.offers.find((o) => o.id === offerId)
          const currentlyActive = storeOverrides[offerId] !== undefined ? storeOverrides[offerId] : (offer?.active ?? true)
          
          return {
            storeOfferOverrides: {
              ...state.storeOfferOverrides,
              [tenantId]: {
                ...storeOverrides,
                [offerId]: !currentlyActive,
              },
            },
          }
        })
      },

      isOfferActiveInStore: (tenantId, offer) => {
        if (!offer.active) return false
        const overrides = get().storeOfferOverrides[tenantId]
        if (overrides && overrides[offer.id] !== undefined) {
          return overrides[offer.id]
        }
        return offer.active
      },

      getOffersForTenant: (tenantId) => {
        return get().offers.filter(
          (o) => o.scope === 'GLOBAL' || o.tenantId === tenantId
        )
      },

      getActiveOffersForTenant: (tenantId) => {
        return get().offers.filter((o) => {
          const belongs = o.scope === 'GLOBAL' || o.tenantId === tenantId
          if (!belongs) return false
          return get().isOfferActiveInStore(tenantId, o)
        })
      },
    }),
    {
      name: 'acai-rose-offers-storage-v1',
    }
  )
)
