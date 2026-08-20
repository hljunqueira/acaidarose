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
  availableHours?: string
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

const DEFAULT_MAIN_MENUS: CustomMenuItem[] = [
  { id: 'menu_acai', name: 'MENU: AÇAÍ DA ROSE', code: 'ACAI_ROSE', description: 'Cardápio oficial do autêntico açaí artesanal brasileiro', displayOrder: 1, active: true, availableHours: 'Sempre disponível' },
]

// AS 5 CATEGORIAS OFICIAIS SÃO OS TAMANHOS DE AÇAÍ
const DEFAULT_CATEGORIES: CustomCategoryItem[] = [
  { id: 'cat_acai_250', name: 'AÇAÍ 250G', slug: '250g', emoji: '🍧', description: '250g com regras de personalização', defaultPrice: 6.50, weightGrams: 250, menuId: 'menu_acai', displayOrder: 1, active: true, itemsCount: 1 },
  { id: 'cat_acai_350', name: 'AÇAÍ 350G', slug: '350g', emoji: '🍧', description: '350g com regras de personalização', defaultPrice: 9.00, weightGrams: 350, menuId: 'menu_acai', displayOrder: 2, active: true, itemsCount: 1 },
  { id: 'cat_acai_500', name: 'AÇAÍ 500G', slug: '500g', emoji: '🍧', description: '500g com regras de personalização', defaultPrice: 12.90, weightGrams: 500, menuId: 'menu_acai', displayOrder: 3, active: true, itemsCount: 1 },
  { id: 'cat_acai_750', name: 'AÇAÍ 750G', slug: '750g', emoji: '🍧', description: '750g com regras de personalização', defaultPrice: 18.90, weightGrams: 750, menuId: 'menu_acai', displayOrder: 4, active: true, itemsCount: 1 },
  { id: 'cat_acai_1000', name: 'AÇAÍ 1 KG', slug: '1kg', emoji: '🍧', description: '1000g com regras de personalização', defaultPrice: 25.90, weightGrams: 1000, menuId: 'menu_acai', displayOrder: 5, active: true, itemsCount: 1 },
]

const INITIAL_REQUESTS: FranchiseChangeRequest[] = [
  {
    id: 'req-01',
    tenantId: 'tenant-aveiro',
    tenantName: 'Açaí da Rose — Filial Aveiro',
    requestType: 'PRICE_CHANGE',
    itemName: 'Açaí 500g',
    targetCollection: 'containers',
    currentPrice: 12.90,
    proposedPrice: 13.50,
    justification: 'Ajuste devido ao custo local de distribuição de frutas frescas em Aveiro.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
]

export const useMenuConfigStore = create<MenuConfigState>()(
  persist(
    (set) => ({
      mainMenus: DEFAULT_MAIN_MENUS,
      categories: DEFAULT_CATEGORIES,
      changeRequests: INITIAL_REQUESTS,

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
          mainMenus: DEFAULT_MAIN_MENUS,
          categories: DEFAULT_CATEGORIES,
          changeRequests: INITIAL_REQUESTS,
        }),
    }),
    { name: 'acai-rose-menu-config-v4' }
  )
)
