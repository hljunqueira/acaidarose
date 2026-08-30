export interface ProductContainer {
  id: string
  tenantId?: string | null
  name: string
  description?: string | null
  weightGrams: number // 250, 350, 500, 750, 1000
  precoBase: number
  price?: number
  limiteFrutas: number // 250g: 2, 350g: 3, 500g+: 999 (livre)
  limiteToppings: number // 250g: 3, 350g: 4, 500g+: 999 (livre)
  limiteCremes: number // 1 opcional
  limiteBases?: number // retrocompatibilidade
  limiteComplementosGratis?: number // retrocompatibilidade
  emoji: string
  image?: string | null
  videoUrl?: string | null
  videoPoster?: string | null
  availableHours?: any
  displayOrder?: number
  active: boolean
  isAvailableInStore?: boolean
}

export interface ProductBase {
  id: string
  tenantId?: string | null
  name: string
  description?: string
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
  description?: string | null
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
  videoUrl?: string | null
  videoPoster?: string | null
  availableHours?: any
  displayOrder?: number
  active: boolean
  isAvailableInStore?: boolean
}

export interface CatalogData {
  containers: ProductContainer[]
  bases: ProductBase[]
  toppings: ProductTopping[]
}
