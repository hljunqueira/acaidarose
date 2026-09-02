'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomMenuItem {
  id: string
  name: string
  code: string
  description?: string
  displayOrder: number
  active: boolean
  availableHours?: any
}

export interface CustomCategoryItem {
  id: string
  name: string
  slug: string
  description?: string
  emoji?: string
  menuId?: string
  displayOrder: number
  active: boolean
  itemsCount?: number
  defaultPrice?: number
  weightGrams?: number
}

export interface FranchiseChangeRequest {
  id: string
  tenantId: string
  tenantName: string
  requestType: 'NEW_PRODUCT' | 'PRICE_CHANGE' | 'CATEGORY_CHANGE'
  itemName: string
  targetCollection: 'containers' | 'bases' | 'toppings'
  proposedPrice?: number
  currentPrice?: number
  justification: string
  details?: any
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  decidedAt?: string
}

interface MenuConfigState {
  mainMenus: CustomMenuItem[]
  categories: CustomCategoryItem[]
  changeRequests: FranchiseChangeRequest[]
  setMainMenus: (menus: CustomMenuItem[]) => void
  setCategories: (categories: CustomCategoryItem[]) => void
  updateMenu: (id: string, updated: Partial<CustomMenuItem>) => void
  addMenu: (menu: CustomMenuItem) => void
  deleteMenu: (id: string) => void
  updateCategory: (id: string, updated: Partial<CustomCategoryItem>) => void
  addCategory: (category: CustomCategoryItem) => void
  deleteCategory: (id: string) => void
  addChangeRequest: (req: Omit<FranchiseChangeRequest, 'id' | 'status' | 'createdAt'>) => void
  approveChangeRequest: (id: string) => void
  rejectChangeRequest: (id: string) => void
  resetToDefaults: () => void
}

export const useMenuConfigStore = create<MenuConfigState>()(
  persist(
    (set) => ({
      mainMenus: [],
      categories: [],
      changeRequests: [],

      setMainMenus: (menus) => set({ mainMenus: menus }),
      setCategories: (categories) => set({ categories }),

      updateMenu: (id, updated) =>
        set((state) => ({
          mainMenus: state.mainMenus.map((m) => (m.id === id ? { ...m, ...updated } : m)),
        })),

      addMenu: (menu) =>
        set((state) => ({
          mainMenus: [...state.mainMenus, menu],
        })),

      deleteMenu: (id) =>
        set((state) => ({
          mainMenus: state.mainMenus.filter((m) => m.id !== id),
        })),

      updateCategory: (id, updated) =>
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        })),

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),

      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        })),

      addChangeRequest: (reqData) =>
        set((state) => ({
          changeRequests: [
            {
              ...reqData,
              id: `req-${Date.now()}`,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
            ...state.changeRequests,
          ],
        })),

      approveChangeRequest: (id) =>
        set((state) => ({
          changeRequests: state.changeRequests.map((r) =>
            r.id === id ? { ...r, status: 'APPROVED', decidedAt: new Date().toISOString() } : r
          ),
        })),

      rejectChangeRequest: (id) =>
        set((state) => ({
          changeRequests: state.changeRequests.map((r) =>
            r.id === id ? { ...r, status: 'REJECTED', decidedAt: new Date().toISOString() } : r
          ),
        })),

      resetToDefaults: () =>
        set({
          mainMenus: [],
          categories: [],
          changeRequests: [],
        }),
    }),
    { name: 'acai-rose-menu-config-v4' }
  )
)
