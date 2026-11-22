/**
 * Utilitário profissional de exportação CSV para o Açaí da Rose.
 * Compatibilidade 100% com Microsoft Excel (Windows/Mac), LibreOffice e Google Sheets.
 *
 * Características essenciais para o mercado português / europeu:
 * 1. Byte Order Mark (BOM \uFEFF): Garante renderização perfeita de acentos e símbolos (€, ç, ã, é).
 * 2. Delimitador ponto e vírgula (;): Padrão regional de Portugal/Europa para que o Excel abra as colunas separadas.
 * 3. Diretiva sep=;: Informa ao motor do Excel qual é o separador antes de carregar as células.
 * 4. Formatação decimal europeia: Números de valor monetário usam vírgula (ex: 6,50) para que o Excel permita somas e fórmulas nativas.
 * 5. Prevenção de CSV Injection (OWASP): Sanitiza células que começam com caracteres de fórmula (=, +, -, @).
 */

export interface CsvExportOptions {
  filename: string
  headers: string[]
  rows: (string | number | boolean | null | undefined)[][]
  separator?: string
  includeSepDirective?: boolean
}

export function formatStatusLabel(status: string | undefined | null): string {
  if (!status) return '—'
  const s = String(status).toUpperCase()
  switch (s) {
    case 'PAID':
    case 'PAGO':
      return 'Pago'
    case 'COMPLETED':
    case 'CONCLUIDO':
    case 'CONCLUÍDO':
    case 'DELIVERED':
    case 'ENTREGUE':
      return 'Concluído'
    case 'PENDING':
    case 'PENDENTE':
      return 'Pendente'
    case 'PREPARING':
    case 'EM_PREPARO':
    case 'EM PREPARAÇÃO':
      return 'Em Preparação'
    case 'READY':
    case 'PRONTO':
      return 'Pronto p/ Entrega'
    case 'CANCELLED':
    case 'CANCELADO':
      return 'Cancelado'
    case 'REJECTED':
    case 'RECUSADO':
      return 'Recusado'
    case 'SHIPPED':
    case 'DESPACHADO':
      return 'Em Transporte'
    default:
      return status
  }
}

export function exportToCsv({
  filename,
  headers,
  rows,
  separator = ';',
  includeSepDirective = true,
}: CsvExportOptions): void {
  const sanitizeCell = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""'

    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        return `"${val}"`
      }
      // Formatação decimal com vírgula para Excel em PT-PT
      return `"${val.toFixed(2).replace('.', ',')}"`
    }

    if (typeof val === 'boolean') {
      return val ? '"Sim"' : '"Não"'
    }

    let str = String(val).trim()

    // Prevenção de CSV Formula Injection (se começar com =, +, -, @ e não for número)
    if (/^[=+\-@\t\r]/.test(str) && !/^[-+]?\d+([.,]\d+)?$/.test(str)) {
      str = `'${str}`
    }

    // Escapa aspas duplas internas duplicando-as
    str = str.replace(/"/g, '""')
    // Substitui quebras de linha internas para não corromper linhas
    str = str.replace(/[\r\n]+/g, ' ')

    return `"${str}"`
  }

  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(separator)
  const bodyLines = rows.map((row) => row.map(sanitizeCell).join(separator))

  let csvContent = '\uFEFF'
  if (includeSepDirective) {
    csvContent += `sep=${separator}\r\n`
  }
  csvContent += [headerLine, ...bodyLines].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)

  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`
  link.setAttribute('download', cleanFilename)

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
