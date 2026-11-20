import { UserRole } from './auth'

export type ManualMediaType = 'IMAGE' | 'GIF' | 'VIDEO'
export type ManualMediaSource = 'UPLOAD' | 'YOUTUBE'
export type ManualCalloutType = 'INFO' | 'ALERT'

export interface ManualStep {
  step_number: number
  title: string
  description: string
  media_source?: ManualMediaSource
  media_type?: ManualMediaType
  media_url?: string | null
  youtube_id?: string | null
  media_poster?: string | null
  callout_type?: ManualCalloutType | null
  callout_text?: string | null
  action_route?: string | null
}

export interface ManualCategory {
  id: string
  title: string
  slug: string
  description?: string | null
  orderIndex: number
  targetRoles: UserRole[]
  articlesCount?: number
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface ManualArticle {
  id: string
  categoryId: string
  categoryTitle?: string
  categorySlug?: string
  title: string
  slug: string
  summary?: string | null
  readTimeMinutes: number
  targetRoles: UserRole[]
  orderIndex: number
  published: boolean
  steps: ManualStep[]
  helpfulVotes?: number
  unhelpfulVotes?: number
  createdAt?: string | Date
  updatedAt?: string | Date
}
