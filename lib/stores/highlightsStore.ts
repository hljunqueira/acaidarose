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
  videoUrl?: string
  mediaType?: 'VIDEO' | 'IMAGE'
  active: boolean
  displayOrder: number
}

const DEFAULT_HIGHLIGHTS: HighlightItem[] = []

interface HighlightsState {
  highlights: HighlightItem[]
  setHighlights: (items: HighlightItem[]) => void
  addHighlight: (item: HighlightItem) => void
  updateHighlight: (id: string, updated: Partial<HighlightItem>) => void
  deleteHighlight: (id: string) => void
  toggleActive: (id: string) => void
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
      toggleActive: (id) =>
        set((state) => ({
          highlights: state.highlights.map((h) =>
            h.id === id ? { ...h, active: !h.active } : h
          ),
        })),
    }),
    {
      name: 'acaidarose_highlights_store_v4',
    }
  )
)
