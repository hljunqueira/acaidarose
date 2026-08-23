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

export const INITIAL_OFFERS: OfferItem[] = [
  // Campanhas Oficiais da Franqueadora (Rede)
  {
    id: 'off-global-01',
    title: 'Happy Hour de Verão — Açaí 350g',
    description: '20% de desconto no copo de 350g em dias úteis no período da tarde.',
    scope: 'GLOBAL',
    tenantId: null,
    productId: 'cnt-350',
    productName: 'Açaí 350g',
    originalPrice: 9.00,
    discountedPrice: 7.20,
    discountPercent: 20,
    validDays: 'Segunda a Sexta',
    validHours: '14:00 às 18:00',
    couponCode: 'HAPPYROSE',
    badgeLabel: 'HAPPY HOUR',
    active: true,
  },
  {
    id: 'off-global-02',
    title: 'Combo Barca Família 1Kg Especial',
    description: 'Balde de 1Kg com frutas frescas e coberturas completas com desconto especial de rede.',
    scope: 'GLOBAL',
    tenantId: null,
    productId: 'cnt-1000',
    productName: 'Açaí 1 Kg',
    originalPrice: 25.90,
    discountedPrice: 21.90,
    discountPercent: 15,
    validDays: 'Todos os dias',
    validHours: 'Sempre ativo',
    couponCode: 'FAMILIAROSE',
    badgeLabel: 'COMBO FAMÍLIA',
    active: true,
  },
  {
    id: 'off-global-03',
    title: 'Fidelidade S2 — 10% Cashback',
    description: 'Ganhe 10% de crédito para resgatar em copos grátis na próxima visita a qualquer loja.',
    scope: 'GLOBAL',
    tenantId: null,
    productId: 'cnt-500',
    productName: 'Açaí 500g',
    originalPrice: 12.90,
    discountedPrice: 11.60,
    discountPercent: 10,
    validDays: 'Todos os dias',
    validHours: 'Sempre ativo',
    couponCode: 'S2CASHBACK',
    badgeLabel: 'FIDELIDADE',
    active: true,
  },

  // Ofertas Locais de Demonstração
  {
    id: 'off-local-lx-01',
    title: 'Açaí Sunset Parque das Nações (Lisboa)',
    description: 'Promoção especial de fim de tarde para clientes da esplanada de Lisboa.',
    scope: 'LOCAL',
    tenantId: 'tenant-lisboa',
    productId: 'cnt-500',
    productName: 'Açaí 500g',
    originalPrice: 12.90,
    discountedPrice: 10.90,
    discountPercent: 15,
    validDays: 'Segunda a Quinta',
    validHours: '17:00 às 20:00',
    couponCode: 'LISBOASUNSET',
    badgeLabel: 'PROMOÇÃO LISBOA',
    active: true,
  },
  {
    id: 'off-local-st-01',
    title: 'Terça Ribatejana (Santarém)',
    description: 'Desconto especial no copo tradicional para os clientes locais de Santarém.',
    scope: 'LOCAL',
    tenantId: 'tenant-santarem',
    productId: 'cnt-250',
    productName: 'Açaí 250g',
    originalPrice: 6.50,
    discountedPrice: 5.50,
    discountPercent: 15,
    validDays: 'Terça-feira',
    validHours: '13:00 às 19:00',
    couponCode: 'SANTAREM15',
    badgeLabel: 'TERÇA EM SANTARÉM',
    active: true,
  },
]

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
      storeOfferOverrides: {
        'tenant-torres-novas': {},
        'tenant-lisboa': {},
        'tenant-santarem': {},
        'tenant-aveiro': {},
      },

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
