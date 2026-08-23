/**
 * Formatadores de Moeda e Data desacoplados (PT-PT / Euro € padrão)
 * Pronto para expansão futura (moedas adicionais e outros locales)
 */

export function formatCurrency(amount: number | string | null | undefined, currency: string = 'EUR'): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0
  
  if (currency === 'EUR') {
    return `€ ${numeric.toFixed(2).replace('.', ',')}`
  }
  
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: currency,
  }).format(numeric)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateOnly(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatOrderNumber(num: number | string): string {
  return `#${String(num || 0).padStart(3, '0')}`
}
