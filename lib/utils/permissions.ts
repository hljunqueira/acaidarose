export const AVEIRO_HQ_ID = '11111111-1111-1111-1111-111111111111'
/**
 * Verifica se o usuário tem permissão para editar dados mestres do cardápio:
 * - Franqueadora Master (SUPER_ADMIN ou FRANCHISOR_ADMIN)
 * - Loja Matriz Aveiro (tenantId AVEIRO_HQ_ID ou slug 'aveiro')
 * Demais lojas possuem permissão apenas para gerenciar disponibilidade/visibilidade local.
 */
export function canManageMasterCatalog(user: any, tenantId?: string | null): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN') return true
  
  const currentTenant = user.tenantId || tenantId
  if (
    currentTenant === AVEIRO_HQ_ID ||
    currentTenant === '11111111-1111-1111-1111-111111111111' ||
    currentTenant === 'aveiro' ||
    currentTenant === '1'
  ) {
    return true
  }
  
  return false
}
