import { Language } from '@/lib/stores/languageStore'

/**
 * Retorna o valor traduzido de um campo com fallback inteligente em cascata:
 * - Se idioma 'es': tenta fieldEs -> fieldEn -> field (pt)
 * - Se idioma 'en': tenta fieldEn -> field (pt)
 * - Se idioma 'pt': retorna field (pt)
 */
export function getLocalizedField(
  item: any,
  field: 'name' | 'description' | 'title' | 'subtitle' | 'badgeLabel',
  lang: Language = 'pt'
): string {
  if (!item) return ''

  if (lang === 'es') {
    const esKey = `${field}Es`
    if (item[esKey] && typeof item[esKey] === 'string' && item[esKey].trim().length > 0) {
      return item[esKey]
    }
  }

  if (lang === 'en' || lang === 'es') {
    const enKey = `${field}En`
    if (item[enKey] && typeof item[enKey] === 'string' && item[enKey].trim().length > 0) {
      return item[enKey]
    }
  }

  return item[field] || ''
}

export function getLocalizedName(item: any, lang: Language = 'pt'): string {
  return getLocalizedField(item, 'name', lang)
}

export function getLocalizedDescription(item: any, lang: Language = 'pt'): string {
  return getLocalizedField(item, 'description', lang)
}

export function getLocalizedTitle(item: any, lang: Language = 'pt'): string {
  return getLocalizedField(item, 'title', lang)
}

export function getLocalizedSubtitle(item: any, lang: Language = 'pt'): string {
  return getLocalizedField(item, 'subtitle', lang)
}
