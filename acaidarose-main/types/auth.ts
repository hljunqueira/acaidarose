export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'CASHIER'

export interface User {
  id: string
  tenantId?: string | null
  email: string
  name: string
  role: UserRole
  password?: string
  passwordHash?: string
  active: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  deletedAt?: string | Date | null
}

export interface UserSession {
  token: string
  user: User
}
