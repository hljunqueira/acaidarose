'use client'

import { create } from 'zustand'

export type Language = 'pt' | 'en' | 'es'

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
}

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'pt'
  const saved = localStorage.getItem('acaidarose_lang')
  if (saved === 'en' || saved === 'es' || saved === 'pt') return saved
  return 'pt'
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acaidarose_lang', lang)
    }
    set({ language: lang })
  },
}))
