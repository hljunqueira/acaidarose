export interface Tenant {
  id: string
  name: string
  slug: string
  companyName?: string | null
  nif?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  phone?: string | null
  mbwayPhone?: string | null
  currency?: string
  wifiNetwork?: string | null
  wifiPassword?: string | null
  openingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null
  aboutText?: string | null
  instagramUrl?: string | null
  googleMapsUrl?: string | null
  ratingAverage?: number
  ratingCount?: number
  reviewsCount?: number
  isHeadquarters?: boolean
  active: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  deletedAt?: string | Date | null
}

export interface TenantSetting {
  id: string
  tenantId: string
  key: string
  value: any
}

export interface TenantMetrics {
  todayRevenue: number
  todayOrdersCount: number
  averageTicket: number
  activeOperatorsCount: number
  maxOperators: number
  mbwaySharePercent: number
}

export interface StoreOverview {
  tenant: Tenant
  metrics: TenantMetrics
  operators: { id: string; name: string; email: string; active: boolean }[]
  manager?: { id: string; name: string; email: string }
}

export interface FranchiseNetworkOverview {
  totalRevenue: number
  totalOrders: number
  networkAverageTicket: number
  totalStores: number
  activeStores: number
  totalOperators: number
  stores: StoreOverview[]
}
