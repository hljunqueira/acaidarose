/**
 * lib/printers/autoPrintService.ts
 * 
 * Serviço central de impressão automática e direta de pedidos.
 * Opera exclusivamente com o Servidor de Impressão Windows Local (.EXE)
 * e fila de impressão autônoma por Token da Loja.
 */

import { Order } from '@/types'
import { StorePrinterSetting } from '@/types/printer'
import { checkAgentStatus, printViaAgent } from './windowsPrintAgentClient'
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
  usedEngine?: 'WINDOWS_AGENT' | 'CLOUD_QUEUE'
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
 * Envia o pedido para todas as impressoras ativas configuradas para a loja.
 * Comunica diretamente com o Servidor de Impressão Windows (Porta 4040 - Zero Popups).
 * Se o executável estiver fechado, enfileira automaticamente na nuvem para o token da loja.
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

  // 1. Verifica se o Servidor de Impressão Windows Local está rodando
  const agentStatus = await checkAgentStatus()
  const useAgent = agentStatus.online

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
      continue
    }

    if (!orderHasItemsForPrinter(order, printer)) {
      continue
    }

    try {
      let textPayload = ''
      const layout = printer.printLayout || 'FULL_RECEIPT'
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

      if (textPayload.includes('(Nenhum item desta secao para impressao)')) {
        continue
      }

      const copies = Math.max(1, printer.copies || 1)
      const ticketNum = String(order.orderNumber || (order as any).daily_order_seq || '001').padStart(3, '0')

      // Monta o payload ESC/POS completo
      let fullPayload = ESC_POS_COMMANDS.INIT + ESC_POS_COMMANDS.CODE_PAGE_WPC1252 + textPayload
      if (shouldPrintQrCode && qrCodeBase64) {
        fullPayload += ESC_POS_COMMANDS.ALIGN_CENTER + '\nConsulte ou avalie o seu pedido:\n' + ESC_POS_COMMANDS.FEED_3_LINES
      } else {
        fullPayload += ESC_POS_COMMANDS.FEED_4_LINES
      }
      fullPayload += ESC_POS_COMMANDS.CUT_FULL

      // ESTRATÉGIA A: IMPRESSÃO DIRETA VIA SERVIDOR LOCAL (ZERO POPUPS)
      if (useAgent) {
        const printRes = await printViaAgent({
          printerName: printer.driverName,
          rawText: fullPayload,
          copies,
          docName: `Pedido #${ticketNum} (${order.customerName || 'Cliente'})`,
        })

        if (printRes.success) {
          result.printedCount++
          result.printersNames.push(printer.name)
          result.usedEngine = 'WINDOWS_AGENT'

          recordPrintAudit(order, ticketNum, printer, layout, copies, 'WINDOWS_PRINT_AGENT')
          continue
        } else {
          console.warn(`[AutoPrint] Servidor Local falhou para "${printer.name}":`, printRes.error)
        }
      }

      // ESTRATÉGIA B: ENFILEIRA NA FILA EM NUVEM PARA O SERVIDOR WINDOWS DA LOJA
      try {
        await fetch('/api/printers/agent/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: order.tenantId,
            orderId: order.id,
            orderNumber: ticketNum,
            printerName: printer.driverName,
            docName: `Pedido #${ticketNum} (${order.customerName || 'Cliente'})`,
            payloadText: fullPayload,
            copies,
          }),
        })

        result.printedCount++
        result.printersNames.push(printer.name)
        result.usedEngine = 'CLOUD_QUEUE'
      } catch (err: any) {
        result.errors.push(`${printer.name}: Falha de comunicação com o servidor de impressão.`)
      }
    } catch (err: any) {
      console.error(`[AutoPrint] Erro ao imprimir na impressora "${printer.name}":`, err)
      result.errors.push(`${printer.name}: ${err?.message || 'Falha de comunicação'}`)
    }
  }

  result.success = result.printedCount > 0
  return result
}

function recordPrintAudit(order: Order, ticketNum: string, printer: StorePrinterSetting, layout: string, copies: number, engine: string) {
  if (typeof window === 'undefined') return
  fetch('/api/dev/audit-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId: order.tenantId,
      action: 'ORDER_AUTO_PRINTED',
      entity: engine,
      entityId: order.id,
      message: `Comanda #${ticketNum} (${order.customerName || 'Cliente'}) impressa via ${engine} em "${printer.name}" (${printer.driverName}) · Modelo: ${layout}`,
      level: 'INFO',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        printerName: printer.name,
        driverName: printer.driverName,
        layout,
        copies,
        engine,
      },
    }),
  }).catch(() => {})
}
