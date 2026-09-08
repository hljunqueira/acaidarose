export interface HighlightItem {
  id: string
  tenantId?: string
  title: string
  titleEn?: string | null
  titleEs?: string | null
  subtitle?: string
  subtitleEn?: string | null
  subtitleEs?: string | null
  badgeLabel?: string
  badgeLabelEn?: string | null
  badgeLabelEs?: string | null
  badgeColor?: string
  price?: number
  imageUrl?: string
  videoUrl?: string
  mediaType?: 'VIDEO' | 'IMAGE'
  active: boolean
  displayOrder: number
  availableHours?: any
}
