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
  CUT_FULL: `${GS}V\x00`,          // Corte total de papel (guilhotina)
  CUT_PARTIAL: `${GS}V\x01`,       // Corte parcial de papel
  FEED_3_LINES: '\n\n\n',
  FEED_4_LINES: '\n\n\n\n',
}

/**
 * Remove acentos incompatíveis com CP850 se necessário, garantindo que saia legível
 */
export function sanitizeEscPosText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, '')
}

/**
 * Monta o recibo de teste para validação de comunicação e corte de guilhotina
 */
export function buildTestEscPosReceipt(storeName: string, printerName: string): string {
  const dateStr = new Date().toLocaleString('pt-PT')
  const SEP = '------------------------------------------\n'

  let out = ''
  out += ESC_POS_COMMANDS.INIT
  out += ESC_POS_COMMANDS.CODE_PAGE_CP850
  
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
  out += ESC_POS_COMMANDS.INIT
  out += ESC_POS_COMMANDS.CODE_PAGE_CP850

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

      // Detalhes de Acompanhamentos / Frutas / Toppings
      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        const topsText = item.toppings.map((t: any) => {
          if (typeof t === 'string') return t
          const q = t.quantity && t.quantity > 1 ? `${t.quantity}x ` : ''
          return `${q}${t.name || t.title}`
        }).join(', ')
        out += `  Acompanhamentos: ${topsText}\n`
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
  out += `Total do Pedido: ${typeof order.total === 'number' ? order.total.toFixed(2) + ' €' : ''}\n`
  out += `Forma: ${order.paymentMethod || 'BALCAO'} - Status: ${order.paymentStatus || 'PENDING'}\n`

  // 6. Avanço e Guilhotina
  out += ESC_POS_COMMANDS.FEED_4_LINES
  out += ESC_POS_COMMANDS.CUT_FULL

  return out
}
