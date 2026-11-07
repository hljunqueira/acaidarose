/**
 * lib/printers/serverPrintQueueService.ts
 * 
 * Serviço server-side para enfileirar impressões diretamente no PostgreSQL (store_print_jobs).
 * Executa independente de navegador ou abas abertas:
 * - Disparado automaticamente na criação de pedidos pagos no PDV / Balcão
 * - Disparado na confirmação de pagamento via MB WAY ou Webhooks
 * - Disparado na atualização de status para PAID ou PREPARING
 * 
 * O Servidor Windows (acaidarose-print-agent.exe) lê esta fila via HTTPS a cada 2s e imprime.
 */

import { query } from '@/lib/db/postgres'
import {
  buildOrderKitchenEscPosReceipt,
  buildFullOrderEscPosReceipt,
  buildTicketOnlyEscPosReceipt,
  ESC_POS_COMMANDS,
} from './escposBuilder'
import { orderHasItemsForPrinter } from './autoPrintService'
import { StorePrinterSetting } from '@/types/printer'
import { Order } from '@/types'

export async function enqueueOrderPrintJobs(orderId: string, customTenantId?: string): Promise<{ success: boolean; enqueuedCount: number; errors: string[] }> {
  const result = { success: false, enqueuedCount: 0, errors: [] as string[] }

  try {
    // 1. Busca pedido no banco de dados
    const orderRes = await query(
      `SELECT o.*, t.name as tenant_name, t.nif as tenant_nif, t.address as tenant_address, t.phone as tenant_phone
       FROM orders o
       LEFT JOIN tenants t ON t.id = o.tenant_id
       WHERE o.id::text = $1 LIMIT 1`,
      [orderId]
    )

    if (!orderRes.rows || orderRes.rows.length === 0) {
      result.errors.push(`Pedido ${orderId} não encontrado.`)
      return result
    }

    const row = orderRes.rows[0]
    const tenantId = customTenantId || row.tenant_id

    // Só enfileira se o pedido estiver com pagamento confirmado ou em preparo
    const isPaid = Boolean(
      row.payment_status === 'PAID' ||
      row.status === 'PAID' ||
      row.status === 'PREPARING' ||
      row.status === 'READY' ||
      row.status === 'COMPLETED'
    )

    if (!isPaid) {
      result.errors.push(`Pedido #${row.order_number} ainda não está pago (Status: ${row.status}, Pagamento: ${row.payment_status}). Impressão ignorada.`)
      return result
    }

    // 2. Busca impressoras ativas da loja
    const printersRes = await query(
      `SELECT * FROM store_printer_settings WHERE tenant_id::text = $1 AND is_active = true`,
      [tenantId]
    )

    const activePrinters: StorePrinterSetting[] = (printersRes.rows || []).map((p: any) => ({
      id: p.id,
      tenantId: p.tenant_id,
      name: p.name,
      driverName: p.driver_name,
      printerType: p.printer_type || 'EPSON_ESC_POS',
      connectionType: p.connection_type || 'WINDOWS_AGENT',
      printLayout: p.print_layout || 'FULL_RECEIPT',
      highlightCustomer: p.highlight_customer !== false,
      printLogo: p.print_logo !== false,
      printQrCode: p.print_qr_code !== false,
      categories: Array.isArray(p.categories) ? p.categories : (typeof p.categories === 'string' ? JSON.parse(p.categories || '[]') : []),
      products: Array.isArray(p.products) ? p.products : (typeof p.products === 'string' ? JSON.parse(p.products || '[]') : []),
      copies: Math.max(1, p.copies || 1),
      isActive: p.is_active !== false,
      isBackup: Boolean(p.is_backup),
    }))

    if (activePrinters.length === 0) {
      result.errors.push(`Nenhuma impressora ativa configurada para a loja ${tenantId}.`)
      return result
    }

    // Normaliza objeto Order para os builders de ESC/POS
    let items = []
    try {
      items = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : (row.items_json || [])
    } catch {}

    const orderObj: Order = {
      id: row.id,
      tenantId: row.tenant_id,
      orderNumber: Number(row.order_number || 1),
      customerName: row.customer_name || 'Cliente',
      customerPhone: row.customer_phone || '',
      tableNumber: row.table_number ? String(row.table_number) : '',
      isTableOrder: Boolean(row.is_table_order),
      isTakeaway: Boolean(row.is_takeaway),
      consumptionType: row.is_takeaway ? 'TAKEAWAY' : (row.is_table_order ? 'DINE_IN' : 'DINE_IN'),
      total: Number(row.total || 0),
      subtotal: Number(row.subtotal || row.total || 0),
      paymentMethod: (row.payment_method as any) || 'CASH',
      paymentStatus: row.payment_status || 'PAID',
      status: row.status || 'PAID',
      items,
      notes: row.cancel_reason || '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }

    const storeInfo = {
      name: row.tenant_name || 'Açaí da Rose',
      nif: row.tenant_nif || '',
      address: row.tenant_address || '',
      phone: row.tenant_phone || '',
    }

    const ticketNum = String(orderObj.orderNumber || '001').padStart(3, '0')

    // 3. Itera sobre cada impressora e enfileira na tabela store_print_jobs
    for (const printer of activePrinters) {
      if (!orderHasItemsForPrinter(orderObj, printer)) {
        continue
      }

      const layout = printer.printLayout || 'FULL_RECEIPT'
      let textPayload = ''

      if (layout === 'KITCHEN_SLIP') {
        textPayload = buildOrderKitchenEscPosReceipt(orderObj, {
          storeName: storeInfo.name,
          printerTitle: printer.name,
          categoryFilter: printer.categories,
          productFilter: printer.products,
          totalCopies: printer.copies || 1,
          omitInit: true,
          omitCut: true,
        })
      } else if (layout === 'TICKET_ONLY') {
        textPayload = buildTicketOnlyEscPosReceipt(orderObj, {
          storeName: storeInfo.name,
          omitInit: true,
          omitCut: true,
        })
      } else {
        textPayload = buildFullOrderEscPosReceipt(orderObj, {
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

      let fullPayload = ESC_POS_COMMANDS.INIT + ESC_POS_COMMANDS.CODE_PAGE_WPC1252 + textPayload + ESC_POS_COMMANDS.FEED_4_LINES + ESC_POS_COMMANDS.CUT_FULL
      const copies = Math.max(1, printer.copies || 1)
      const docName = `Pedido #${ticketNum} (${orderObj.customerName || 'Cliente'})`
      const payloadBase64 = Buffer.from(fullPayload, 'binary').toString('base64')

      await query(
        `INSERT INTO store_print_jobs (
          tenant_id, order_id, order_number, printer_name, doc_name,
          payload_base64, payload_text, copies, status
        ) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, 'PENDING')`,
        [tenantId, orderObj.id, ticketNum, printer.driverName, docName, payloadBase64, copies]
      )

      result.enqueuedCount++
    }

    result.success = result.enqueuedCount > 0
    return result
  } catch (err: any) {
    console.error('[ServerPrintQueueService Error]:', err)
    result.errors.push(err.message || 'Erro inesperado ao enfileirar impressão.')
    return result
  }
}
