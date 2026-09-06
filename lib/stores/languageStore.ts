'use client'

import { create } from 'zustand'

export type Language = 'pt' | 'en'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: typeof window !== 'undefined' && localStorage.getItem('acaidarose_lang') === 'en' ? 'en' : 'pt',
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acaidarose_lang', lang)
    }
    set({ language: lang })
  },
}))
