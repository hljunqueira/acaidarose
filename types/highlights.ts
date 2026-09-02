export interface HighlightItem {
  id: string
  tenantId?: string
  title: string
  subtitle?: string
  badgeLabel?: string
  badgeColor?: string
  price?: number
  imageUrl?: string
  videoUrl?: string
  mediaType?: 'VIDEO' | 'IMAGE'
  active: boolean
  displayOrder: number
  availableHours?: any
}
