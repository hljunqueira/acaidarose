export interface ProductContainer {
  id: string
  tenantId?: string | null
  name: string
  nameEn?: string | null
  description?: string | null
  descriptionEn?: string | null
  weightGrams?: number | null // 250, 350, 500, 750, 1000, ou null para lanches
  precoBase: number
  price?: number
  limiteFrutas: number // 250g: 2, 350g: 3, 500g+: 999 (livre)
  limiteToppings: number // 250g: 3, 350g: 4, 500g+: 999 (livre)
  limiteCremes: number // 1 opcional
  limiteBases?: number // retrocompatibilidade
  limiteComplementosGratis?: number // retrocompatibilidade
  emoji?: string
  image?: string | null
  videoUrl?: string | null
  videoPoster?: string | null
  availableHours?: any
  displayOrder?: number
  active: boolean
  isAvailableInStore?: boolean
  isCategoryPaused?: boolean
  categoryName?: string
  categoryId?: string | null
  productType?: 'CONTAINER' | 'ITEM'
  menuId?: string | null
  optionGroups?: any[]
}

export interface ProductBase {
  id: string
  tenantId?: string | null
  name: string
  nameEn?: string | null
  description?: string
  descriptionEn?: string | null
  emoji?: string
  videoUrl?: string | null
  videoPoster?: string | null
  availableHours?: any
  displayOrder?: number
  active: boolean
  isAvailableInStore?: boolean
}

export type ToppingCategory = 'Frutas' | 'Toppings' | 'Cremes' | 'Adicionais' | 'Cereais' | 'Doces' | 'Premium'

export interface ProductTopping {
  id: string
  tenantId?: string | null
  name: string
  nameEn?: string | null
  description?: string | null
  descriptionEn?: string | null
  category: ToppingCategory | string
  isPremium?: boolean
  precoExtra?: number
  precoCobrado?: number
  price?: number
  isPaid?: boolean
  isSpecialAddon?: boolean
  priceTierLow?: number // até 500g (ex: +1€ ou +2€)
  priceTierHigh?: number // acima de 500g (ex: +2€ ou +4€)
  emoji?: string
  image?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  videoPoster?: string | null
  availableHours?: any
  displayOrder?: number
  active: boolean
  isAvailableInStore?: boolean
}

export interface Menu {
  id: string
  name: string
  nameEn?: string | null
  code?: string
  description?: string | null
  descriptionEn?: string | null
  displayOrder?: number
  active: boolean
}

export interface Category {
  id: string
  name: string
  nameEn?: string | null
  slug: string
  menuId?: string | null
  description?: string | null
  descriptionEn?: string | null
  displayOrder?: number
  active: boolean
  defaultPrice?: number
  weightGrams?: number | null
}

export interface CatalogData {
  containers: ProductContainer[]
  bases: ProductBase[]
  toppings: ProductTopping[]
  menus?: Menu[]
  categories?: Category[]
}
