'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartDraftItem, CartItem, ProductBase, ProductContainer, ProductTopping, OrderItemTopping } from '@/types'

export function getPremiumToppingPrice(_toppingName: string, _weightGrams: number, explicitPrice?: number): number {
  if (explicitPrice !== undefined && explicitPrice !== null && Number(explicitPrice) > 0) {
    return Number(explicitPrice)
  }
  return 0
}

export function computeItemLineTotal(item: CartDraftItem | CartItem | null | undefined): number {
  if (!item?.container) return 0
  const weight = Number(item.container.weightGrams) || 500
  const basePrice = Number(item.container.precoBase) || 0
  const isUnlimited = weight >= 500

  const basesModel = (item.container.optionGroups || []).find((g: any) => g.id === 'model-bases' || g.name?.toLowerCase().includes('base') || g.name?.toLowerCase().includes('creme'))
  const toppingsModel = (item.container.optionGroups || []).find((g: any) => g.id === 'model-toppings' || g.name?.toLowerCase().includes('acompanhamento') || g.name?.toLowerCase().includes('topping'))
  const frutasModel = (item.container.optionGroups || []).find((g: any) => g.id === 'model-frutas' || g.name?.toLowerCase().includes('fruta'))

  const additionalBasePrice = basesModel?.additionalPrice !== undefined ? Number(basesModel.additionalPrice) : 2.00
  const additionalToppingPrice = toppingsModel?.additionalPrice !== undefined ? Number(toppingsModel.additionalPrice) : 0.50
  const additionalFrutaPrice = frutasModel?.additionalPrice !== undefined ? Number(frutasModel.additionalPrice) : 0.50

  // 1. Cremes / Bases Extras (padrão € 2,00 ou configurado no modelo)
  const maxBases = item.container.limiteCremes || item.container.limiteBases || 1
  const extraBasesCount = Math.max(0, (item.bases?.length || 0) - maxBases)
  const extraBasesPrice = extraBasesCount * additionalBasePrice

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
  const extraFrutasPrice = extraFrutasCount * additionalFrutaPrice

  const extraToppingsCount = isUnlimited ? 0 : Math.max(0, toppingsTradicionaisCount - maxToppings)
  const extraToppingsPrice = extraToppingsCount * additionalToppingPrice

  return +(basePrice + extraBasesPrice + extraFrutasPrice + extraToppingsPrice + premiumsPrice).toFixed(2)
}

export function computeToppingBreakdown(item: CartDraftItem | CartItem): OrderItemTopping[] {
  const weight = Number(item?.container?.weightGrams) || 500
  const isUnlimited = weight >= 500

  const toppingsModel = (item.container?.optionGroups || []).find((g: any) => g.id === 'model-toppings' || g.name?.toLowerCase().includes('acompanhamento') || g.name?.toLowerCase().includes('topping'))
  const frutasModel = (item.container?.optionGroups || []).find((g: any) => g.id === 'model-frutas' || g.name?.toLowerCase().includes('fruta'))
  const additionalToppingPrice = toppingsModel?.additionalPrice !== undefined ? Number(toppingsModel.additionalPrice) : 0.50
  const additionalFrutaPrice = frutasModel?.additionalPrice !== undefined ? Number(frutasModel.additionalPrice) : 0.50

  const maxFrutas = item.container?.limiteFrutas || (isUnlimited ? 999 : weight === 250 ? 2 : 3)
  const maxToppings = item.container?.limiteToppings || (isUnlimited ? 999 : 3)

  let frutasVistas = 0
  let toppingsVistos = 0

  return (item?.toppings || []).map((t) => {
    const isSpecial = t.isSpecialAddon || t.category === 'Adicionais' || t.isPremium || (t.precoExtra && t.precoExtra > 0)
    const isFruta = t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva', 'abacaxi'].some((f) => t.name.toLowerCase().includes(f))

    if (isSpecial) {
      return {
        ...t,
        precoCobrado: getPremiumToppingPrice(t.name, weight, t.precoExtra),
        isPaid: true,
        active: t.active !== false,
      }
    }

    if (isFruta) {
      frutasVistas++
      const isExtra = !isUnlimited && frutasVistas > maxFrutas
      return {
        ...t,
        precoCobrado: isExtra ? additionalFrutaPrice : 0,
        isPaid: isExtra,
        active: t.active !== false,
      }
    }

    toppingsVistos++
    const isExtra = !isUnlimited && toppingsVistos > maxToppings
    return {
      ...t,
      precoCobrado: isExtra ? additionalToppingPrice : 0,
      isPaid: isExtra,
      active: t.active !== false,
    }
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
  addSimpleItem: (container: ProductContainer, quantity?: number, options?: any[], notes?: string, customUnitPrice?: number) => void
  updateItemQuantity: (id: string, delta: number) => void
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
            quantity: 1,
          }
          return { items: [...s.items, item], draft: null }
        }),

      addSimpleItem: (container: ProductContainer, quantity = 1, options?: any[], notes?: string, customUnitPrice?: number) =>
        set((s) => {
          const unitPrice = customUnitPrice !== undefined ? customUnitPrice : (Number(container.precoBase) || Number(container.price) || 0)
          const hasModifiers = (options && options.length > 0) || Boolean(notes)

          const existingIndex = !hasModifiers
            ? s.items.findIndex(
                (i) =>
                  i.container?.id === container.id &&
                  (!i.bases || i.bases.length === 0) &&
                  (!i.toppings || i.toppings.length === 0) &&
                  (!i.selectedOptions || i.selectedOptions.length === 0)
              )
            : -1

          if (existingIndex >= 0) {
            const existing = s.items[existingIndex]
            const currentQty = existing.quantity || 1
            const newQty = currentQty + quantity
            const updatedItem: CartItem = {
              ...existing,
              quantity: newQty,
              lineTotal: +(unitPrice * newQty).toFixed(2),
            }
            const newItems = [...s.items]
            newItems[existingIndex] = updatedItem
            return { items: newItems }
          } else {
            const newItem: CartItem = {
              id: genId(),
              container,
              bases: [],
              toppings: [],
              quantity,
              unitPrice,
              selectedOptions: options || [],
              options: options || [],
              notes: notes || undefined,
              lineTotal: +(unitPrice * quantity).toFixed(2),
            }
            return { items: [...s.items, newItem] }
          }
        }),

      updateItemQuantity: (id: string, delta: number) =>
        set((s) => {
          const existingIndex = s.items.findIndex((i) => i.id === id)
          if (existingIndex < 0) return s
          const existing = s.items[existingIndex]
          const currentQty = existing.quantity || 1
          const newQty = currentQty + delta
          if (newQty <= 0) {
            return { items: s.items.filter((i) => i.id !== id) }
          }
          const isSimple = (!existing.bases || existing.bases.length === 0) && (!existing.toppings || existing.toppings.length === 0)
          const unitPrice = isSimple
            ? (Number(existing.container.precoBase) || Number(existing.container.price) || 0)
            : (Number(existing.lineTotal) / currentQty)
          const updated: CartItem = {
            ...existing,
            quantity: newQty,
            lineTotal: +(unitPrice * newQty).toFixed(2),
          }
          const newItems = [...s.items]
          newItems[existingIndex] = updated
          return { items: newItems }
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
