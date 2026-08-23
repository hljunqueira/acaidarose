import { StaffMember } from '@/types/staff'
import { mockStore } from '@/lib/supabase/mockStore'

export async function getStaffByTenant(tenantId: string): Promise<StaffMember[]> {
  return (mockStore.staff || []).filter((s) => s.tenantId === tenantId)
}

export async function getStaffById(id: string): Promise<StaffMember | null> {
  return (mockStore.staff || []).find((s) => s.id === id) || null
}

export async function createStaffMember(data: Omit<StaffMember, 'id' | 'createdAt'>): Promise<StaffMember> {
  const newStaff: StaffMember = {
    id: `staff-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  }
  mockStore.staff = [...(mockStore.staff || []), newStaff]
  return newStaff
}

export async function updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> {
  const list = mockStore.staff || []
  const index = list.findIndex((s) => s.id === id)
  if (index === -1) return null

  const updated: StaffMember = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  list[index] = updated
  mockStore.staff = [...list]
  return updated
}

export async function deleteStaffMember(id: string): Promise<boolean> {
  const list = mockStore.staff || []
  const filtered = list.filter((s) => s.id !== id)
  if (filtered.length === list.length) return false
  mockStore.staff = filtered
  return true
}
