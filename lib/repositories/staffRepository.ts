import { User } from '@/types'
import { getUsersByTenant, createUser, updateUser, deleteUser } from './usersRepository'

export async function getStaffByTenant(tenantId: string): Promise<User[]> {
  return await getUsersByTenant(tenantId)
}

export async function createStaffMember(payload: any): Promise<User> {
  return await createUser(payload)
}

export async function updateStaffMember(id: string, payload: any): Promise<User | null> {
  return await updateUser(id, payload)
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  return await deleteUser(id)
}
