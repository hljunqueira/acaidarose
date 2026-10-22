/**
 * lib/printers/autoPrintService.ts
 * 
 * Serviço central de impressão automática e direta de pedidos via QZ Tray e ESC/POS.
 * Roteia itens por categorias e setores de produção (copa/cozinha/balcão) e evita duplicidades.
 */

import { Order } from '@/types'
import { StorePrinterSetting } from '@/types/printer'
import { connectQZ, printRawData } from './qzClient'
import {
  buildOrderKitchenEscPosReceipt,
  buildFullOrderEscPosReceipt,
  buildTicketOnlyEscPosReceipt,
  ESC_POS_COMMANDS,
  FullOrderReceiptOptions,
} from './escposBuilder'
import { THERMAL_LOGO_BASE64, generateReceiptQrCodeBase64 } from './logoData'
import { generateOrderReceiptUrl } from '@/lib/services/qrCodeService'

export interface PrintOrderResult {
  success: boolean
  printedCount: number
  printersNames: string[]
  errors: string[]
}

export interface AutoPrintOptions {
  storeInfo?: {
    name?: string
    nif?: string
    address?: string
    phone?: string
  }
}

/**
 * Verifica se o pedido possui itens que devem ser impressos nesta impressora específica
 */
export function orderHasItemsForPrinter(order: Order, printer: StorePrinterSetting): boolean {
  if (!printer.isActive) return false

  const hasCatFilter = Array.isArray(printer.categories) && printer.categories.length > 0
  const hasProdFilter = Array.isArray(printer.products) && printer.products.length > 0

  // Se a impressora não tem filtros específicos, imprime tudo (Geral / Copa principal)
  if (!hasCatFilter && !hasProdFilter) return true

  const items = Array.isArray(order.items) ? order.items : []
  return items.some((item: any) => {
    const itemCat = item.categoryId || item.category_id || item.category
    const itemProdId = item.containerId || item.id || item.productId || item.product_id

    const matchCat = hasCatFilter && itemCat ? printer.categories.includes(itemCat) : false
    const matchProd = hasProdFilter && itemProdId ? printer.products.includes(itemProdId) : false

    return matchCat || matchProd
  })
}

/**
 * Envia o pedido para todas as impressoras ativas configuradas para a loja via QZ Tray
 */
export async function printOrderDirectly(
  order: Order,
  printers: StorePrinterSetting[],
  storeNameOrOptions: string | AutoPrintOptions = 'Açaí da Rose'
): Promise<PrintOrderResult> {
  const activePrinters = printers.filter((p) => p.isActive)
  const result: PrintOrderResult = {
    success: false,
    printedCount: 0,
    printersNames: [],
    errors: [],
  }

  const storeInfo =
    typeof storeNameOrOptions === 'string'
      ? { name: storeNameOrOptions }
      : storeNameOrOptions?.storeInfo || { name: 'Açaí da Rose' }

  if (activePrinters.length === 0) {
    result.errors.push('Nenhuma impressora ativa configurada para esta unidade.')
    return result
  }

  // Garante conexão ativa com o QZ Tray
  const conn = await connectQZ()
  if (!conn.connected) {
    result.errors.push(conn.error || 'QZ Tray não está aberto no computador local.')
    return result
  }

  // Prepara o QR Code da comanda se houver ID de pedido
  let qrCodeBase64 = ''
  if (order.id) {
    try {
      const receiptUrl = generateOrderReceiptUrl(order.id)
      qrCodeBase64 = await generateReceiptQrCodeBase64(receiptUrl)
    } catch (err) {
      console.warn('[AutoPrint] Erro ao gerar QR Code da comanda:', err)
    }
  }

  for (const printer of activePrinters) {
    if (printer.connectionType === 'NATIVE_PRINT') {
      // Impressoras nativas usam diálogo do navegador (não recomendado para auto-impressão silenciosa)
      continue
    }

    // Verifica se há itens para esta impressora
    if (!orderHasItemsForPrinter(order, printer)) {
      continue
    }

    try {
      let textPayload = ''
      const layout = printer.printLayout || 'FULL_RECEIPT'
      const shouldPrintLogo = printer.printLogo !== false
      const shouldPrintQrCode = layout !== 'KITCHEN_SLIP' && printer.printQrCode !== false

      if (layout === 'KITCHEN_SLIP') {
        textPayload = buildOrderKitchenEscPosReceipt(order, {
          storeName: storeInfo.name,
          printerTitle: printer.name,
          categoryFilter: printer.categories,
          productFilter: printer.products,
          totalCopies: printer.copies || 1,
          omitInit: true,
          omitCut: true,
        })
      } else if (layout === 'TICKET_ONLY') {
        textPayload = buildTicketOnlyEscPosReceipt(order, {
          storeName: storeInfo.name,
          omitInit: true,
          omitCut: true,
        })
      } else {
        // FULL_RECEIPT (Padrão e recomendado para o Caixa - Foto 2)
        textPayload = buildFullOrderEscPosReceipt(order, {
          storeInfo,
          printerTitle: printer.name,
          highlightCustomer: printer.highlightCustomer !== false,
          categoryFilter: printer.categories,
          productFilter: printer.products,
          totalCopies: printer.copies || 1,
          omitInit: true,
          omitCut: true,
        })
      }

      // Se a saída estiver vazia de itens, ignora
      if (textPayload.includes('(Nenhum item desta secao para impressao)')) {
        continue
      }

      // Monta os blocos de impressão (Logomarca + ESC/POS + QR Code + Corte)
      const qzData: any[] = []
      qzData.push(ESC_POS_COMMANDS.INIT)
      qzData.push(ESC_POS_COMMANDS.CODE_PAGE_WPC1252)

      // 1. Logomarca Monocromática Oficial
      if (shouldPrintLogo && THERMAL_LOGO_BASE64) {
        qzData.push(ESC_POS_COMMANDS.ALIGN_CENTER)
        qzData.push({
          type: 'raw',
          format: 'image',
          flavor: 'base64',
          data: THERMAL_LOGO_BASE64,
          options: { language: 'ESCPOS', dotDensity: 'double' },
        })
        qzData.push('\n')
      }

      // 2. Conteúdo em texto do Talão
      qzData.push(textPayload)

      // 3. QR Code da Comanda no Rodapé
      if (shouldPrintQrCode && qrCodeBase64) {
        qzData.push(ESC_POS_COMMANDS.ALIGN_CENTER)
        const qrHeader = 'Consulte ou avalie o seu pedido:\n'
        qzData.push(qrHeader)
        qzData.push({
          type: 'raw',
          format: 'image',
          flavor: 'base64',
          data: qrCodeBase64,
          options: { language: 'ESCPOS', dotDensity: 'single' },
        })
        qzData.push(ESC_POS_COMMANDS.FEED_3_LINES)
      } else {
        qzData.push(ESC_POS_COMMANDS.FEED_4_LINES)
      }

      // 4. Corte Guilhotina
      qzData.push(ESC_POS_COMMANDS.CUT_FULL)

      const copies = Math.max(1, printer.copies || 1)
      for (let c = 1; c <= copies; c++) {
        await printRawData(printer.driverName, qzData)
      }

      result.printedCount++
      result.printersNames.push(printer.name)

      // Registra evento no Log de Auditoria TI de Henrique
      if (typeof window !== 'undefined') {
        const ticketNum = String(order.orderNumber || (order as any).daily_order_seq || '001').padStart(3, '0')
        fetch('/api/dev/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: order.tenantId,
            action: 'ORDER_AUTO_PRINTED',
            entity: 'IMPRESSORAS_QZ',
            entityId: order.id,
            message: `Comanda #${ticketNum} (${order.customerName || 'Cliente'}) impressa via QZ Tray em "${printer.name}" (${printer.driverName}) · Modelo: ${layout}`,
            level: 'INFO',
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              printerName: printer.name,
              driverName: printer.driverName,
              layout,
              copies,
            },
          }),
        }).catch(() => {})
      }
    } catch (err: any) {
      console.error(`[AutoPrint] Erro ao imprimir na impressora "${printer.name}":`, err)
      result.errors.push(`${printer.name}: ${err?.message || 'Falha de comunicação'}`)

      // Registra erro no Log de Auditoria TI de Henrique
      if (typeof window !== 'undefined') {
        const ticketNum = String(order.orderNumber || (order as any).daily_order_seq || '001').padStart(3, '0')
        fetch('/api/dev/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: order.tenantId,
            action: 'ORDER_PRINT_ERROR',
            entity: 'IMPRESSORAS_QZ',
            entityId: order.id,
            message: `Falha ao imprimir Comanda #${ticketNum} na impressora "${printer.name}": ${err?.message || 'Erro de comunicação'}`,
            level: 'ERROR',
            metadata: {
              orderId: order.id,
              printerName: printer.name,
              error: err?.message,
            },
          }),
        }).catch(() => {})
      }
    }
  }

  result.success = result.printedCount > 0
  return result
}
