export const FIGUEIRA_HQ_ID = '11111111-1111-1111-1111-111111111111'
export const AVEIRO_HQ_ID = FIGUEIRA_HQ_ID // retrocompatibilidade temporária

/**
 * Verifica se o usuário tem permissão para gerenciar a estrutura mestre do cardápio:
 * - Franqueadora Master (SUPER_ADMIN ou FRANCHISOR_ADMIN).
 * Demais usuários/lojas possuem permissão apenas para gerenciar disponibilidade/visibilidade local.
 */
export function canManageMasterCatalog(user: any, _tenantId?: string | null): boolean {
  if (!user) return false
  return user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN'
}

/**
 * Verifica se o usuário tem permissão para alterar PREÇOS de venda de produtos e adicionais:
 * - Franqueadora Master (SUPER_ADMIN ou FRANCHISOR_ADMIN): permissão irrestrita em toda a rede.
 * - Em filiais e franquias para operadores locais (TENANT_ADMIN / CASHIER): preços travados para leitura.
 */
export function canEditProductPrices(user: any, _tenantId?: string | null): boolean {
  if (!user) return false
  return user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN'
}
