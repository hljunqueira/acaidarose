'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HighlightItem {
  id: string
  title: string
  subtitle: string
  badgeLabel: string
  badgeColor: string
  price: number
  imageUrl: string
  active: boolean
  displayOrder: number
}

const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
  {
    id: 'hl-1',
    title: 'Açaí 500g Especial da Rose',
    subtitle: 'Frutas frescas à vontade, base de Ninho e cobertura crocante de granola',
    badgeLabel: 'MAIS PEDIDO',
    badgeColor: 'bg-amber-500',
    price: 12.90,
    imageUrl: '/images/acai_500g.jpg',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'hl-2',
    title: 'Açaí 350g com Morango & Nutella',
    subtitle: 'Camadas generosas de morango fresco cortado na hora com Nutella original',
    badgeLabel: 'O QUERIDINHO',
    badgeColor: 'bg-fuchsia-600',
    price: 10.50,
    imageUrl: '/images/acai_350g.jpg',
    active: true,
    displayOrder: 2,
  },
  {
    id: 'hl-3',
    title: 'Barca Família Açaí 1 Kg',
    subtitle: 'Apresentação farta para partilhar com todas as frutas e toppings livres',
    badgeLabel: 'NOVIDADE',
    badgeColor: 'bg-emerald-600',
    price: 25.90,
    imageUrl: '/images/acai_1kg.jpg',
    active: true,
    displayOrder: 3,
  },
]

interface HighlightsState {
  highlights: HighlightItem[]
  setHighlights: (items: HighlightItem[]) => void
  addHighlight: (item: HighlightItem) => void
  updateHighlight: (id: string, updated: Partial<HighlightItem>) => void
  deleteHighlight: (id: string) => void
}

export const useHighlightsStore = create<HighlightsState>()(
  persist(
    (set) => ({
      highlights: DEFAULT_HIGHLIGHTS,
      setHighlights: (items) => set({ highlights: items }),
      addHighlight: (item) =>
        set((state) => ({ highlights: [...state.highlights, item] })),
      updateHighlight: (id, updated) =>
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, ...updated } : h
          ),
        })),
      deleteHighlight: (id) =>
        set((state) => ({
          highlights: state.highlights.filter((h) => h.id !== id),
        })),
    }),
    {
      name: 'acaidarose_highlights_store_v2',
    }
  )
)
