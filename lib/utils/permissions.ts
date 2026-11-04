export const FIGUEIRA_HQ_ID = '11111111-1111-1111-1111-111111111111'
export const AVEIRO_HQ_ID = FIGUEIRA_HQ_ID // retrocompatibilidade temporária

/**
 * Verifica se o usuário tem permissão para gerenciar a estrutura mestre do cardápio:
 * - Franqueadora Master (SUPER_ADMIN ou FRANCHISOR_ADMIN) no contexto da Matriz
 * Demais lojas possuem permissão apenas para gerenciar disponibilidade/visibilidade local.
 */
export function canManageMasterCatalog(user: any, tenantId?: string | null): boolean {
  if (!user) return false
  // Franqueadora Master (SUPER_ADMIN ou FRANCHISOR_ADMIN) possui gestão total em todas as lojas
  if (user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN') {
    return true
  }

  const currentTenant = tenantId || user.tenantId
  if (
    currentTenant === FIGUEIRA_HQ_ID ||
    currentTenant === 'figueira-da-foz' ||
    currentTenant === '1'
  ) {
    return true
  }

  return false
}

/**
 * Verifica se o usuário tem permissão para alterar PREÇOS de venda de produtos e adicionais:
 * - Franqueadora Master (SUPER_ADMIN ou FRANCHISOR_ADMIN): permissão irrestrita em toda a rede.
 * - Em filiais e franquias para operadores locais (TENANT_ADMIN / CASHIER): preços travados para leitura.
 */
export function canEditProductPrices(user: any, tenantId?: string | null): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' || user.role === 'FRANCHISOR_ADMIN') {
    return true
  }

  const current = tenantId || user.tenantId
  return (
    !current ||
    current === FIGUEIRA_HQ_ID ||
    current === 'figueira-da-foz' ||
    current === '1'
  )
}
