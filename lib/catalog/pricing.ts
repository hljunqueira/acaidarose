/**
 * Motor puro de cálculo de preços de opções e pedidos
 * 100% configurável com base nos modelos de opções (product_option_models)
 * e parâmetros gravados no PostgreSQL.
 */

export interface PricingOption {
  id: string
  name?: string
  price?: number
  priceOverrideCents?: number | null
  active?: boolean
}

export interface PricingGroup {
  id: string
  name: string
  priceType?: 'Gratis' | 'Individual' | string
  additionalPrice?: number
  additionalPriceCents?: number
  maxQty?: number | null
  minQty?: number
  allowItemQuantity?: boolean
  options?: PricingOption[]
}

export interface GroupSelection {
  [optionId: string]: number
}

/**
 * Calcula o custo adicional de um grupo de opções com base em sua configuração no banco.
 * Suporta cotas gratuitas, cota zero (onde qualquer escolha é cobrada) e cobrança individual.
 */
export function calculateGroupPriceCents(
  group: PricingGroup,
  selections: GroupSelection
): number {
  if (!group || !selections) return 0

  const activeOptions = (group.options || []).filter((o) => o.active !== false)
  const groupAddPrice = Number(group.additionalPrice) || 0
  const groupAddPriceCents = Math.round(groupAddPrice * 100)
  const isIndividual = group.priceType === 'Individual'

  let totalCents = 0

  if (isIndividual) {
    for (const opt of activeOptions) {
      const qty = selections[opt.id] || 0
      if (qty > 0) {
        const optPriceCents =
          opt.price !== undefined && Number(opt.price) > 0
            ? Math.round(Number(opt.price) * 100)
            : groupAddPriceCents
        totalCents += optPriceCents * qty
      }
    }
  } else {
    // Grupo 'Gratis' / Incluso com cota configurada
    // 1. Itens especiais com preço individual avulso (ex: calda especial)
    for (const opt of activeOptions) {
      const qty = selections[opt.id] || 0
      if (qty > 0 && opt.price && Number(opt.price) > 0) {
        totalCents += Math.round(Number(opt.price) * 100) * qty
      }
    }

    // 2. Cálculo do excedente além da cota máxima gratuita (maxQty)
    // Se maxQty for 0, qualquer seleção além de 0 é cobrada pelo additionalPrice configurado
    const maxFree = group.maxQty !== null && group.maxQty !== undefined ? Number(group.maxQty) : null
    const groupTotalCount = Object.entries(selections).reduce((acc, [optId, qty]) => {
      // Itens com preço individual fixo não consomem cota do adicional de grupo se já tiverem preço próprio
      const opt = activeOptions.find((o) => o.id === optId)
      if (opt && opt.price && Number(opt.price) > 0) return acc
      return acc + (Number(qty) || 0)
    }, 0)

    if (maxFree !== null && groupTotalCount > maxFree && groupAddPriceCents > 0) {
      const extraCount = groupTotalCount - maxFree
      totalCents += extraCount * groupAddPriceCents
    }
  }

  return totalCents
}

/**
 * Retorna o valor adicional em Euros com arredondamento seguro de 2 casas decimais.
 */
export function calculateGroupPrice(
  group: PricingGroup,
  selections: GroupSelection
): number {
  return +(calculateGroupPriceCents(group, selections) / 100).toFixed(2)
}
