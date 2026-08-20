export interface StaffMember {
  id: string
  tenantId: string
  code: string
  name: string
  nickname: string
  phone?: string
  serviceCommission?: number
  active: boolean
  createdAt: string
  updatedAt?: string
}
