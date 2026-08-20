'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartDraftItem, CartItem, ProductBase, ProductContainer, ProductTopping, OrderItemTopping } from '@/types'

export function computeItemLineTotal(item: CartDraftItem | CartItem | null | undefined): number {
  if (!item?.container) return 0
  const base = Number(item.container.precoBase) || 0
  const isOver500g = (item.container.weightGrams || 0) > 500

  let extra = 0

  for (const t of item.toppings || []) {
    if (t.isSpecialAddon || t.category === 'Adicionais') {
      const price = isOver500g ? (t.priceTierHigh || 2.00) : (t.priceTierLow || 1.00)
      extra += Number(price) || 0
    } else if (t.isPremium && t.precoExtra) {
      extra += Number(t.precoExtra) || 0
    }
  }

  return +(base + extra).toFixed(2)
}

export function computeToppingBreakdown(item: CartDraftItem | CartItem): OrderItemTopping[] {
  const isOver500g = (item?.container?.weightGrams || 0) > 500

  return (item?.toppings || []).map((t) => {
    if (t.isSpecialAddon || t.category === 'Adicionais') {
      const price = isOver500g ? (t.priceTierHigh || 2.00) : (t.priceTierLow || 1.00)
      return { ...t, isPaid: true, precoCobrado: Number(price) || 0 }
    }
    if (t.isPremium && t.precoExtra) {
      return { ...t, isPaid: true, precoCobrado: Number(t.precoExtra) || 0 }
    }
    return { ...t, isPaid: false, precoCobrado: 0 }
  })
}

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).slice(2) + Date.now()

interface CartState {
  items: CartItem[]
  draft: CartDraftItem | null
  startDraft: (container: ProductContainer) => void
  resetDraft: () => void
  toggleBase: (base: ProductBase) => void
  toggleTopping: (topping: ProductTopping) => void
  addDraftToCart: () => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      draft: null,

      startDraft: (container: ProductContainer) =>
        set({ draft: { id: genId(), container, bases: [], toppings: [] } }),

      resetDraft: () => set({ draft: null }),

      toggleBase: (base: ProductBase) =>
        set((s) => {
          if (!s.draft || !s.draft.container) return s
          const exists = s.draft.bases.find((b) => b.id === base.id)
          let bases: ProductBase[]
          if (exists) {
            bases = s.draft.bases.filter((b) => b.id !== base.id)
          } else {
            const max = s.draft.container.limiteCremes || s.draft.container.limiteBases || 1
            if (s.draft.bases.length >= max) {
              bases = [...s.draft.bases.slice(1), base]
            } else {
              bases = [...s.draft.bases, base]
            }
          }
          return { draft: { ...s.draft, bases } }
        }),

      toggleTopping: (topping: ProductTopping) =>
        set((s) => {
          if (!s.draft) return s
          const exists = s.draft.toppings.find((t) => t.id === topping.id)
          const toppings = exists
            ? s.draft.toppings.filter((t) => t.id !== topping.id)
            : [...s.draft.toppings, topping]
          return { draft: { ...s.draft, toppings } }
        }),

      addDraftToCart: () =>
        set((s) => {
          if (!s.draft || !s.draft.container || s.draft.bases.length === 0) return s
          const enrichedToppings = computeToppingBreakdown(s.draft)
          const lineTotal = computeItemLineTotal(s.draft)
          const item: CartItem = {
            id: s.draft.id,
            container: s.draft.container,
            bases: s.draft.bases,
            toppings: enrichedToppings,
            lineTotal,
          }
          return { items: [...s.items, item], draft: null }
        }),

      removeItem: (id: string) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [], draft: null }),

      total: () =>
        +get().items.reduce((sum, i) => sum + (Number(i.lineTotal) || 0), 0).toFixed(2),
    }),
    {
      name: 'acai-rose-cart-v3',
      partialize: (s) => ({ items: s.items, draft: s.draft }),
    }
  )
)
