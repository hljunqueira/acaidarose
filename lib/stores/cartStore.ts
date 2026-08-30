'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartDraftItem, CartItem, ProductBase, ProductContainer, ProductTopping, OrderItemTopping } from '@/types'

export function getPremiumToppingPrice(toppingName: string, weightGrams: number, explicitPrice?: number): number {
  if (explicitPrice && explicitPrice > 0) return explicitPrice
  const name = toppingName.toLowerCase()
  const isLarge = weightGrams > 500
  if (name.includes('pistache')) {
    return isLarge ? 4.0 : 2.0
  }
  if (name.includes('nutella') || name.includes('leite em p') || name.includes('ninho') || name.includes('ferrero') || name.includes('kinder')) {
    return isLarge ? 2.0 : 1.0
  }
  return isLarge ? 2.0 : 1.0
}

export function computeItemLineTotal(item: CartDraftItem | CartItem | null | undefined): number {
  if (!item?.container) return 0
  const weight = Number(item.container.weightGrams) || 500
  const basePrice = Number(item.container.precoBase) || 0
  const isUnlimited = weight >= 500

  // 1. Cremes / Bases Extras (+€ 2,00 por creme além do limite)
  const maxBases = item.container.limiteCremes || item.container.limiteBases || 1
  const extraBasesCount = Math.max(0, (item.bases?.length || 0) - maxBases)
  const extraBasesPrice = extraBasesCount * 2.00

  // 2. Frutas & Toppings Tradicionais vs Premium
  const maxFrutas = item.container.limiteFrutas || (isUnlimited ? 999 : weight === 250 ? 2 : 3)
  const maxToppings = item.container.limiteToppings || (isUnlimited ? 999 : 3)

  let frutasCount = 0
  let toppingsTradicionaisCount = 0
  let premiumsPrice = 0

  for (const t of item.toppings || []) {
    const isSpecial = t.isSpecialAddon || t.category === 'Adicionais' || t.isPremium || (t.precoExtra && t.precoExtra > 0)
    const isFruta = t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f))

    if (isSpecial) {
      premiumsPrice += getPremiumToppingPrice(t.name, weight, t.precoExtra)
    } else if (isFruta) {
      frutasCount++
    } else {
      toppingsTradicionaisCount++
    }
  }

  const extraFrutasCount = isUnlimited ? 0 : Math.max(0, frutasCount - maxFrutas)
  const extraFrutasPrice = extraFrutasCount * 0.50

  const extraToppingsCount = isUnlimited ? 0 : Math.max(0, toppingsTradicionaisCount - maxToppings)
  const extraToppingsPrice = extraToppingsCount * 0.50

  return +(basePrice + extraBasesPrice + extraFrutasPrice + extraToppingsPrice + premiumsPrice).toFixed(2)
}

export function computeToppingBreakdown(item: CartDraftItem | CartItem): OrderItemTopping[] {
  const weight = Number(item?.container?.weightGrams) || 500
  const isUnlimited = weight >= 500

  const maxFrutas = item.container?.limiteFrutas || (isUnlimited ? 999 : weight === 250 ? 2 : 3)
  const maxToppings = item.container?.limiteToppings || (isUnlimited ? 999 : 3)

  let frutasVistas = 0
  let toppingsVistos = 0

  return (item?.toppings || []).map((t) => {
    const isSpecial = t.isSpecialAddon || t.category === 'Adicionais' || t.isPremium || (t.precoExtra && t.precoExtra > 0)
    const isFruta = t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f))

    if (isSpecial) {
      const price = getPremiumToppingPrice(t.name, weight, t.precoExtra)
      return { ...t, isPaid: true, precoCobrado: price }
    }

    if (isFruta) {
      frutasVistas++
      const isExtra = !isUnlimited && frutasVistas > maxFrutas
      return { ...t, isPaid: isExtra, precoCobrado: isExtra ? 0.50 : 0 }
    }

    toppingsVistos++
    const isExtra = !isUnlimited && toppingsVistos > maxToppings
    return { ...t, isPaid: isExtra, precoCobrado: isExtra ? 0.50 : 0 }
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
            // Permite adicionar mais de 1 creme, somando como creme adicional (+€ 2,00)
            bases = [...s.draft.bases, base]
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
