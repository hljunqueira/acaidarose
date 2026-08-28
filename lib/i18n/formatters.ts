/**
 * Formatadores de Moeda e Data de Portugal (PT-PT / Euro € / Timezone Europe/Lisbon)
 * Garante que em todas as páginas o horário exibido seja o horário oficial de Portugal (Lisboa / GMT+1 ou GMT+0).
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
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDateTimeShort(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-PT', {
    timeZone: 'Europe/Lisbon',
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
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTimeOnly(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatOrderNumber(num: number | string): string {
  return `#${String(num || 0).padStart(3, '0')}`
}
