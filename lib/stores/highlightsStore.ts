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
    title: 'Açaí 500g da Rose',
    subtitle: 'Frutas frescas à vontade, cremosidade artesanal e acompanhamentos livres',
    badgeLabel: 'MAIS PEDIDO',
    badgeColor: 'bg-pink-600',
    price: 9.50,
    imageUrl: '/images/official/acai_copo_500g.jpg',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'hl-2',
    title: 'Tigela Artesanal 750g',
    subtitle: 'Apresentação nobre em tigela com morangos frescos, kiwi, banana e sementes',
    badgeLabel: 'EXPERIÊNCIA SUPREMA',
    badgeColor: 'bg-fuchsia-600',
    price: 13.50,
    imageUrl: '/images/official/acai_tigela_750g.jpg',
    active: true,
    displayOrder: 2,
  },
  {
    id: 'hl-3',
    title: 'Balde Família Açaí 1 Kg',
    subtitle: 'Para partilhar com a família: 1Kg de pura polpa com frutas e toppings à vontade',
    badgeLabel: 'PARA PARTILHAR',
    badgeColor: 'bg-purple-600',
    price: 18.00,
    imageUrl: '/images/official/acai_balde_1kg.jpg',
    active: true,
    displayOrder: 3,
  },
  {
    id: 'hl-4',
    title: 'Milkshake Cremoso de Açaí',
    subtitle: 'Batido geladinho com proteína e cremosidade incomparável',
    badgeLabel: 'REFRESCANTE',
    badgeColor: 'bg-emerald-600',
    price: 4.50,
    imageUrl: '/images/official/milkshake_acai.png',
    active: true,
    displayOrder: 4,
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
      name: 'acaidarose_highlights_store_v3',
    }
  )
)
