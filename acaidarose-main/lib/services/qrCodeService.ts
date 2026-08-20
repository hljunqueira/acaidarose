/**
 * Serviço gerador de payloads para QR Code (MB Way Portugal e Comandas)
 */

export function generateMBWayPayload(phone: string, amount: number, orderNumber: number | string): string {
  const cleanPhone = (phone || '').replace(/\D/g, '')
  // Padrão de payload interoperável MB Way / SIBS ou deep link
  return `mbway://pay?phone=${encodeURIComponent(cleanPhone)}&amount=${amount.toFixed(2)}&ref=ACAI_ROSE_${orderNumber}`
}

export function generateOrderReceiptUrl(orderId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/receipt/${orderId}`
  }
  return `/receipt/${orderId}`
}
