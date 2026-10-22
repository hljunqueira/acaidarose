/**
 * lib/printers/escposBuilder.ts
 * 
 * Gerador de recibos e comandos ESC/POS binários para impressoras térmicas (80mm e 58mm).
 * Suporte a corte de papel (guilhotina), negrito, texto expandido e PT-PT.
 */

// Comandos ESC/POS padrão
const ESC = '\x1b'
const GS = '\x1d'

export const ESC_POS_COMMANDS = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_SIZE: `${ESC}!\x38`,      // Altura e largura duplas
  DOUBLE_HEIGHT: `${ESC}!\x10`,    // Altura dupla
  NORMAL_SIZE: `${ESC}!\x00`,      // Tamanho padrão
  CODE_PAGE_CP850: `${ESC}t\x02`,  // Tabela CP850 Multilíngue
  CODE_PAGE_WPC1252: `${ESC}t\x10`, // Tabela Windows-1252 (suporte nativo a € e PT-PT)
  CODE_PAGE_CP858: `${ESC}t\x13`,  // Tabela CP858 com Euro
  CUT_FULL: `${GS}V\x00`,          // Corte total de papel (guilhotina)
  CUT_PARTIAL: `${GS}V\x01`,       // Corte parcial de papel
  FEED_3_LINES: '\n\n\n',
  FEED_4_LINES: '\n\n\n\n',
}

/**
 * Preenche duas colunas (esquerda e direita) com espaçamento exato para largura fixa (padrão 40 colunas)
 */
export function padRow(left: string, right: string, width: number = 40): string {
  const l = (left || '').trimEnd()
  const r = (right || '').trim()
  const spaceNeeded = width - l.length - r.length
  if (spaceNeeded <= 0) {
    const maxLeft = Math.max(0, width - r.length - 1)
    return `${l.slice(0, maxLeft)} ${r}\n`
  }
  return `${l}${' '.repeat(spaceNeeded)}${r}\n`
}

/**
 * Formata valores monetários no padrão do talão (€ 6,50)
 */
export function formatReceiptCurrency(amount?: number | null): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0
  return `€ ${val.toFixed(2).replace('.', ',')}`
}

/**
 * Remove acentos incompatíveis se necessário, garantindo que saia legível
 */
export function sanitizeEscPosText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '')
}

/**
 * Traduz e formata formas de pagamento para o padrão canônico PT-PT
 */
export function formatPaymentMethodPT(method?: string | null): string {
  if (!method) return 'Balcão'
  const m = String(method).trim().toUpperCase()
  switch (m) {
    case 'CASH':
    case 'DINHEIRO':
      return 'Numerário'
    case 'MBWAY':
    case 'MB_WAY':
      return 'MB Way'
    case 'CARD':
    case 'MULTIBANCO':
    case 'TPA':
      return 'Multibanco (TPA)'
    case 'BALCAO':
    case 'ATENDIMENTO':
      return 'Balcão'
    case 'ONLINE':
    case 'STRIPE':
      return 'Pagamento Online'
    default:
      return method
  }
}

/**
 * Traduz e formata estados de pedido para PT-PT
 */
export function formatOrderStatusPT(status?: string | null): string {
  if (!status) return 'Pendente'
  const s = String(status).trim().toUpperCase()
  switch (s) {
    case 'PAID':
      return 'PAGO'
    case 'PENDING':
      return 'PENDENTE'
    case 'PREPARING':
      return 'EM PREPARO'
    case 'READY':
      return 'PRONTO'
    case 'COMPLETED':
      return 'CONCLUÍDO'
    case 'CANCELLED':
      return 'ANULADO'
    default:
      return status
  }
}

/**
 * Monta o recibo de teste para validação de comunicação e corte de guilhotina
 */
export function buildTestEscPosReceipt(storeName: string, printerName: string): string {
  const dateStr = new Date().toLocaleString('pt-PT')
  const SEP = '----------------------------------------\n'

  let out = ''
  out += ESC_POS_COMMANDS.INIT
  out += ESC_POS_COMMANDS.CODE_PAGE_WPC1252
  
  // Cabeçalho Centralizado
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `${storeName.toUpperCase()}\n`
  out += ESC_POS_COMMANDS.BOLD_OFF
  out += `TESTE DE IMPRESSORA - QZ TRAY\n`
  out += `${dateStr}\n`
  out += SEP

  // Corpo do Teste
  out += ESC_POS_COMMANDS.ALIGN_LEFT
  out += `Impressora: ${printerName}\n`
  out += `Status: Conectado via QZ Tray (Porta 8182)\n`
  out += `Protocolo: ESC/POS Direto\n`
  out += `Acentuacao: Açaí, Família, Sensação, Taça\n`
  out += `Moeda: € 6,50 (Windows-1252)\n`
  out += SEP

  // Mensagem de Sucesso
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `COMUNICACAO E CORTE OK\n`
  out += ESC_POS_COMMANDS.BOLD_OFF
  out += `Açaí da Rose - Sistema de Gestao\n`

  // Avanço e Corte
  out += ESC_POS_COMMANDS.FEED_4_LINES
  out += ESC_POS_COMMANDS.CUT_FULL

  return out
}

/**
 * Formata um pedido em comando ESC/POS para produção na copa / cozinha
 */
export function buildOrderKitchenEscPosReceipt(
  order: any,
  options?: {
    storeName?: string
    printerTitle?: string
    copyIndex?: number
    totalCopies?: number
    categoryFilter?: string[]
    productFilter?: string[]
    omitInit?: boolean
    omitCut?: boolean
  }
): string {
  const storeName = options?.storeName || 'AÇAÍ DA ROSE'
  const printerTitle = options?.printerTitle || 'COPA / PRODUÇÃO'
  const copyIndex = options?.copyIndex || 1
  const totalCopies = options?.totalCopies || 1
  const categoryFilter = options?.categoryFilter || []
  const productFilter = options?.productFilter || []

  const hasCategoryFilter = categoryFilter.length > 0
  const hasProductFilter = productFilter.length > 0
  const hasAnyFilter = hasCategoryFilter || hasProductFilter

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString('pt-PT')
  const ticketNumber = String(order.orderNumber || order.daily_order_seq || order.id?.slice(-3) || '001').padStart(3, '0')
  const isTable = Boolean(order.tableNumber)
  const tableName = order.tableNumber ? `MESA ${order.tableNumber}` : 'BALCÃO / TAKEAWAY'
  const customerName = order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'
  const SEP = '------------------------------------------\n'

  let out = ''
  if (!options?.omitInit) {
    out += ESC_POS_COMMANDS.INIT
  }
  out += ESC_POS_COMMANDS.CODE_PAGE_WPC1252

  // 1. Cabeçalho da Unidade e Rota
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `${storeName.toUpperCase()}\n`
  out += ESC_POS_COMMANDS.BOLD_OFF
  out += `VIA DE ${printerTitle.toUpperCase()}${totalCopies > 1 ? ` (${copyIndex}/${totalCopies})` : ''}\n`
  out += `${dateStr}\n`
  out += SEP

  // 2. Ticket / Senha em Destaque Gigante
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += ESC_POS_COMMANDS.DOUBLE_SIZE
  out += `#${ticketNumber}\n`
  out += ESC_POS_COMMANDS.NORMAL_SIZE
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `${tableName} - ${customerName}\n`
  out += ESC_POS_COMMANDS.BOLD_OFF

  if (order.consumptionType === 'TAKEAWAY') {
    out += `[ PARA LEVAR / TAKEAWAY ]\n`
  } else {
    out += `[ CONSUMO NO LOCAL ]\n`
  }
  if (order.bagQuantity && order.bagQuantity > 0) {
    out += `SACO DE TRANSPORTE: ${order.bagQuantity}X [DISPENSAR]\n`
  }
  out += SEP

  // 3. Itens do Pedido (Filtrados por categoria ou produto se a impressora for especializada)
  out += ESC_POS_COMMANDS.ALIGN_LEFT
  const items = Array.isArray(order.items) ? order.items : []

  const filteredItems = items.filter((item: any) => {
    if (!hasAnyFilter) return true
    const itemCat = item.categoryId || item.category_id || item.category
    const itemProdId = item.containerId || item.id || item.productId || item.product_id

    const matchCategory = hasCategoryFilter && itemCat ? categoryFilter.includes(itemCat) : false
    const matchProduct = hasProductFilter && itemProdId ? productFilter.includes(itemProdId) : false

    return matchCategory || matchProduct
  })

  if (filteredItems.length === 0) {
    out += `(Nenhum item desta secao para impressao)\n`
  } else {
    filteredItems.forEach((item: any, idx: number) => {
      const qty = item.quantity || 1
      const name = item.name || item.containerName || item.productName || 'Item'
      const format = item.containerFormat || item.packagingType || ''
      const formatLabel = format ? ` [${format}]` : ''

      out += ESC_POS_COMMANDS.BOLD_ON
      out += `${qty}x ${name.toUpperCase()}${formatLabel}\n`
      out += ESC_POS_COMMANDS.BOLD_OFF

      // Detalhes de Bases
      if (Array.isArray(item.bases) && item.bases.length > 0) {
        const basesText = item.bases.map((b: any) => typeof b === 'string' ? b : (b.name || b.title)).join(' + ')
        out += `  Bases: ${basesText}\n`
      }

      // Detalhes de Acompanhamentos / Frutas / Toppings em formato Checklist de Cozinha
      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        out += `  Acompanhamentos:\n`
        item.toppings.forEach((t: any) => {
          const tName = typeof t === 'string' ? t : (t.name || t.title || 'Item')
          const tQty = typeof t === 'object' && t.quantity && t.quantity > 1 ? ` (${t.quantity}x)` : ''
          out += `   [ ] ${tName}${tQty}\n`
        })
      }

      // Modificadores / Opções do item
      const optionsList = item.selectedOptions || item.options
      if (Array.isArray(optionsList) && optionsList.length > 0) {
        out += `  Opcoes:\n`
        optionsList.forEach((opt: any) => {
          const optLabel = typeof opt === 'string' ? opt : opt.groupName ? `${opt.groupName}: ${opt.name}` : opt.name
          out += `   [ ] ${optLabel}\n`
        })
      }

      // Observações do item
      if (item.notes) {
        out += `  Obs: ${item.notes}\n`
      }

      if (idx < filteredItems.length - 1) {
        out += '\n'
      }
    })
  }

  out += SEP

  // 4. Observações Gerais do Pedido
  if (order.notes) {
    out += ESC_POS_COMMANDS.ALIGN_LEFT
    out += `OBSERVACOES GERAIS:\n${order.notes}\n`
    out += SEP
  }

  // 5. Rodapé
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += `Total do Pedido: ${formatReceiptCurrency(order.total)}\n`
  out += `Pagamento: ${formatPaymentMethodPT(order.paymentMethod)} · Estado: ${formatOrderStatusPT(order.paymentStatus || order.status)}\n`

  // 6. Avanço e Guilhotina
  if (!options?.omitCut) {
    out += ESC_POS_COMMANDS.FEED_4_LINES
    out += ESC_POS_COMMANDS.CUT_FULL
  }

  return out
}

export interface FullOrderReceiptOptions {
  storeInfo?: {
    name?: string
    nif?: string
    address?: string
    phone?: string
  }
  printerTitle?: string
  highlightCustomer?: boolean
  copyIndex?: number
  totalCopies?: number
  categoryFilter?: string[]
  productFilter?: string[]
  omitInit?: boolean
  omitCut?: boolean
}

/**
 * Monta o Talão Completo de Caixa / Conferência (1:1 com o modelo oficial da foto do talão).
 * Cabeçalho fiscal (NIF, Morada, Tel), Comanda, Consumo, Cliente, Itens com bases e acompanhamentos (Grátis/Preço),
 * Subtotal por item, Total e Forma de Pagamento.
 */
export function buildFullOrderEscPosReceipt(
  order: any,
  options?: FullOrderReceiptOptions
): string {
  const storeInfo = options?.storeInfo
  const storeName = storeInfo?.name || 'Açaí da Rose'
  const nif = storeInfo?.nif ? `NIF: ${storeInfo.nif}` : ''
  const address = storeInfo?.address || ''
  const phone = storeInfo?.phone ? `Tel: ${storeInfo.phone}` : ''

  const ticketNumber = String(order.orderNumber || order.daily_order_seq || order.id?.slice(-3) || '001').padStart(3, '0')
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT')
  const isTakeaway = Boolean(order.isTakeaway || order.consumptionType === 'TAKEAWAY')
  const consumptionLabel = isTakeaway ? 'LEVAR PARA CASA (TAKEAWAY)' : 'CONSUMO NO LOCAL'
  const cashierName = order.cashierName || 'Autoatendimento QR Code'
  const customerName = order.customerName ? String(order.customerName).trim() : ''
  const customerPhone = order.customerPhone ? String(order.customerPhone).trim() : ''
  const tableNumber = order.tableNumber ? String(order.tableNumber).trim() : ''
  const isTable = Boolean(tableNumber)

  const SEP = '----------------------------------------\n'

  let out = ''
  if (!options?.omitInit) {
    out += ESC_POS_COMMANDS.INIT
  }
  out += ESC_POS_COMMANDS.CODE_PAGE_WPC1252

  // 0. Destaque Especial de Senha e Cliente para o Caixa / Atendimento
  if (options?.highlightCustomer !== false) {
    out += ESC_POS_COMMANDS.ALIGN_CENTER
    out += ESC_POS_COMMANDS.DOUBLE_SIZE
    out += `#${ticketNumber}\n`
    out += ESC_POS_COMMANDS.NORMAL_SIZE
    out += ESC_POS_COMMANDS.BOLD_ON
    const destination = isTable ? `MESA ${tableNumber}` : (isTakeaway ? 'TAKEAWAY' : 'BALCÃO')
    const clientUpper = customerName ? customerName.toUpperCase() : 'CLIENTE'
    out += `${destination} - ${clientUpper}\n`
    out += ESC_POS_COMMANDS.BOLD_OFF
    out += SEP
  }

  // 1. Cabeçalho Fiscal da Loja / Franquia
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `${storeName}\n`
  out += ESC_POS_COMMANDS.BOLD_OFF
  if (nif) out += `${nif}\n`
  if (address) out += `${address}\n`
  if (phone) out += `${phone}\n`
  out += SEP

  // 2. Metadados do Pedido
  out += ESC_POS_COMMANDS.ALIGN_LEFT
  out += padRow('Comanda', `#${ticketNumber}`, 40)
  out += padRow('Data', dateStr, 40)
  out += padRow('Consumo', consumptionLabel, 40)
  if (order.bagQuantity && order.bagQuantity > 0) {
    out += padRow('Saco de Transporte', `${order.bagQuantity}x (+${(order.bagQuantity * 0.10).toFixed(2).replace('.', ',')} €)`, 40)
  }
  if (cashierName) {
    out += padRow('Operador', cashierName, 40)
  }

  // 3. Dados do Cliente
  if (customerName || customerPhone) {
    out += SEP
    out += ESC_POS_COMMANDS.BOLD_ON
    out += `Cliente\n`
    out += ESC_POS_COMMANDS.BOLD_OFF
    if (customerName) out += `${customerName}\n`
    if (customerPhone) out += `Tel: ${customerPhone}\n`
  }
  out += SEP

  // 4. Itens do Pedido (Filtrados por setor se houver configuração de categorias/produtos)
  const items = Array.isArray(order.items) ? order.items : []
  const categoryFilter = options?.categoryFilter || []
  const productFilter = options?.productFilter || []
  const hasAnyFilter = categoryFilter.length > 0 || productFilter.length > 0

  const filteredItems = items.filter((item: any) => {
    if (!hasAnyFilter) return true
    const itemCat = item.categoryId || item.category_id || item.category
    const itemProdId = item.containerId || item.id || item.productId || item.product_id
    const matchCategory = categoryFilter.length > 0 && itemCat ? categoryFilter.includes(itemCat) : false
    const matchProduct = productFilter.length > 0 && itemProdId ? productFilter.includes(itemProdId) : false
    return matchCategory || matchProduct
  })

  if (filteredItems.length === 0) {
    out += `(Nenhum item desta secao para impressao)\n`
  } else {
    filteredItems.forEach((it: any, idx: number) => {
      const isBag = it.isBagItem || it.id === 'bag-item' || it.containerId === 'saco-transporte'
      if (isBag) {
        const bagQty = it.quantity || 1
        const bagTotal = it.lineTotal || 0.10
        out += ESC_POS_COMMANDS.BOLD_ON
        out += padRow(`${idx + 1}. Saco de Transporte (${bagQty}x)`, formatReceiptCurrency(bagTotal), 40)
        out += ESC_POS_COMMANDS.BOLD_OFF
        return
      }

      const isCaixa = ((it.packagingType === 'CAIXA' || it.containerFormat === 'CAIXA') || (it.containerName || '').toLowerCase().includes('caixa'))
      const itemName = `${idx + 1}. ${it.containerName || it.name || 'Item'}${isCaixa ? ' [Caixa]' : ''}`
      const itemPrice = formatReceiptCurrency(it.containerPrice ?? it.unitPrice ?? it.lineTotal ?? 0)

      out += ESC_POS_COMMANDS.BOLD_ON
      out += padRow(itemName, itemPrice, 40)
      out += ESC_POS_COMMANDS.BOLD_OFF

      // Bases
      if (Array.isArray(it.bases) && it.bases.length > 0) {
        const basesNames = it.bases.map((b: any) => typeof b === 'string' ? b : (b.name || b.title)).filter(Boolean)
        if (basesNames.length > 0) {
          out += ` Bases: ${basesNames.join(', ')}\n`
        }
      }

      // Acompanhamentos / Frutas / Toppings
      if (Array.isArray(it.toppings) && it.toppings.length > 0) {
        const grouped: { name: string; count: number; isPaid: boolean; precoCobrado: number; isPremium: boolean }[] = []
        for (const t of it.toppings) {
          const tName = typeof t === 'string' ? t : (t.name || t.title || 'Acompanhamento')
          const tQty = typeof t === 'object' && t.quantity ? Number(t.quantity) : 1
          const tPaid = typeof t === 'object' ? Boolean(t.isPaid) : false
          const tPrice = typeof t === 'object' ? (Number(t.precoCobrado) || 0) : 0
          const tPrem = typeof t === 'object' ? Boolean(t.isPremium) : false

          const existing = grouped.find((g) => g.name.toLowerCase() === tName.toLowerCase() && g.isPaid === tPaid)
          if (existing) {
            existing.count += tQty
            existing.precoCobrado += tPrice
          } else {
            grouped.push({
              name: tName,
              count: tQty,
              isPaid: tPaid,
              precoCobrado: tPrice,
              isPremium: tPrem,
            })
          }
        }

        grouped.forEach((t) => {
          const topLabel = ` + ${t.name}${t.count > 1 ? ` (${t.count}x)` : ''}${t.isPremium ? ' (Prem)' : ''}`
          const topRight = t.isPaid && t.precoCobrado > 0 ? formatReceiptCurrency(t.precoCobrado) : 'Grátis'
          out += padRow(topLabel, topRight, 40)
        })
      }

      // Opções adicionais (Lanches / Cafetaria)
      const optionsList = it.selectedOptions || it.options
      if (Array.isArray(optionsList) && optionsList.length > 0) {
        optionsList.forEach((opt: any) => {
          const optLabel = ` • ${opt.groupName ? `${opt.groupName}: ` : ''}${opt.name}`
          const optRight = opt.price > 0 ? formatReceiptCurrency(opt.price) : ''
          out += padRow(optLabel, optRight, 40)
        })
      }

      // Observações do item
      if (it.observations || it.notes) {
        out += ` Obs: ${it.observations || it.notes}\n`
      }

      // Subtotal do item
      const subtotalVal = typeof it.lineTotal === 'number' ? it.lineTotal : (it.containerPrice || it.unitPrice || 0)
      out += padRow('Subtotal item', formatReceiptCurrency(subtotalVal), 40)

      if (idx < filteredItems.length - 1) {
        out += '\n'
      }
    })
  }

  out += SEP

  // 5. Total Geral e Pagamento
  out += ESC_POS_COMMANDS.BOLD_ON
  out += ESC_POS_COMMANDS.DOUBLE_HEIGHT
  out += padRow('TOTAL', formatReceiptCurrency(order.total), 40)
  out += ESC_POS_COMMANDS.NORMAL_SIZE
  out += ESC_POS_COMMANDS.BOLD_OFF

  out += padRow('Pagamento', formatPaymentMethodPT(order.paymentMethod), 40)
  out += padRow('Estado do Pedido', formatOrderStatusPT(order.paymentStatus || order.status), 40)
  out += SEP

  // 6. Rodapé
  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += `Conferência Balcão / Caixa\n`
  out += `Documento não fiscal -- apenas\ncomprovativo interno.\n`
  out += `Obrigado pela sua visita!\n`

  // 7. Avanço e Corte Guilhotina
  if (!options?.omitCut) {
    out += ESC_POS_COMMANDS.FEED_4_LINES
    out += ESC_POS_COMMANDS.CUT_FULL
  }

  return out
}

/**
 * Monta o Ticket Rápido de Senha (ideal para o balcão rápido / retirada)
 */
export function buildTicketOnlyEscPosReceipt(
  order: any,
  options?: {
    storeName?: string
    omitInit?: boolean
    omitCut?: boolean
  }
): string {
  const storeName = options?.storeName || 'Açaí da Rose'
  const ticketNumber = String(order.orderNumber || order.daily_order_seq || order.id?.slice(-3) || '001').padStart(3, '0')
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT')
  const isTable = Boolean(order.tableNumber)
  const isTakeaway = Boolean(order.isTakeaway || order.consumptionType === 'TAKEAWAY')
  const destination = isTable ? `MESA ${order.tableNumber}` : (isTakeaway ? 'TAKEAWAY' : 'BALCÃO')
  const customerName = order.customerName ? order.customerName.toUpperCase() : 'CLIENTE'
  const SEP = '----------------------------------------\n'

  let out = ''
  if (!options?.omitInit) {
    out += ESC_POS_COMMANDS.INIT
  }
  out += ESC_POS_COMMANDS.CODE_PAGE_WPC1252

  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `${storeName.toUpperCase()}\n`
  out += ESC_POS_COMMANDS.BOLD_OFF
  out += `TICKET DE ATENDIMENTO\n`
  out += `${dateStr}\n`
  out += SEP

  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += `SUA SENHA:\n`
  out += ESC_POS_COMMANDS.DOUBLE_SIZE
  out += `#${ticketNumber}\n`
  out += ESC_POS_COMMANDS.NORMAL_SIZE
  out += ESC_POS_COMMANDS.BOLD_ON
  out += `${destination} - ${customerName}\n`
  out += ESC_POS_COMMANDS.BOLD_OFF
  out += SEP

  out += ESC_POS_COMMANDS.ALIGN_CENTER
  out += `Aguarde a chamada da sua senha no painel.\n`
  out += `Obrigado pela sua visita!\n`

  if (!options?.omitCut) {
    out += ESC_POS_COMMANDS.FEED_4_LINES
    out += ESC_POS_COMMANDS.CUT_FULL
  }

  return out
}
