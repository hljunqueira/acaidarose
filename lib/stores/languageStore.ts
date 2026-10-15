'use client'

import { create } from 'zustand'

export type Language = 'pt' | 'en' | 'es'

export interface ActiveLanguageOption {
  code: Language
  name: string
  flagEmoji: string
  isDefault: boolean
}

interface LanguageState {
  language: Language
  activeLanguages: ActiveLanguageOption[]
  isLoadingLanguages: boolean
  setLanguage: (lang: Language) => void
  loadActiveLanguages: (tenantIdOrSlug?: string) => Promise<void>
}

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'pt'
  const saved = localStorage.getItem('acaidarose_lang')
  if (saved === 'en' || saved === 'es' || saved === 'pt') return saved
  return 'pt'
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),
  activeLanguages: [
    { code: 'pt', name: 'Português', flagEmoji: '🇵🇹', isDefault: true },
    { code: 'en', name: 'English', flagEmoji: '🇺🇸', isDefault: false },
  ],
  isLoadingLanguages: false,
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acaidarose_lang', lang)
    }
    set({ language: lang })
  },
  loadActiveLanguages: async (tenantIdOrSlug) => {
    try {
      set({ isLoadingLanguages: true })
      const queryParam = tenantIdOrSlug ? `?loja=${encodeURIComponent(tenantIdOrSlug)}` : ''
      const res = await fetch(`/api/translations/languages${queryParam}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (data?.success && Array.isArray(data.languages)) {
        // Filtrar apenas idiomas marcados como is_active com deduplicação por código
        const seenCodes = new Set<string>()
        const actives: ActiveLanguageOption[] = []
        for (const l of data.languages) {
          if (Boolean(l.is_active) && !seenCodes.has(l.language_code)) {
            seenCodes.add(l.language_code)
            actives.push({
              code: l.language_code as Language,
              name: l.name,
              flagEmoji: l.flag_emoji || (l.language_code === 'en' ? '🇺🇸' : l.language_code === 'es' ? '🇪🇸' : '🇵🇹'),
              isDefault: Boolean(l.is_default),
            })
          }
        }

        if (actives.length > 0) {
          set({ activeLanguages: actives })

          // Se o idioma atualmente selecionado (ex: salvo no localStorage) foi desativado, faz fallback para o padrão
          const currentLang = get().language
          const isCurrentActive = actives.some((a) => a.code === currentLang)
          if (!isCurrentActive) {
            const fallbackLang = actives.find((a) => a.isDefault)?.code || actives[0]?.code || 'pt'
            get().setLanguage(fallbackLang)
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar idiomas ativos:', err)
    } finally {
      set({ isLoadingLanguages: false })
    }
  },
}))

