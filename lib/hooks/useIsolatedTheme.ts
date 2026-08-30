'use client'

import { useState, useEffect } from 'react'

export type ThemeMode = 'light' | 'dark'

/**
 * Hook para gerenciar o tema da Plataforma Administrativa & PDV de forma isolada
 */
export function useAdminTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_theme') as ThemeMode | null
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
      }
    } catch {}
    setMounted(true)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'admin_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('admin_theme', newTheme)
      window.dispatchEvent(new CustomEvent('admin_theme_change', { detail: newTheme }))
    } catch {}
  }

  useEffect(() => {
    const handleCustom = (e: any) => {
      if (e.detail === 'dark' || e.detail === 'light') {
        setThemeState(e.detail)
      }
    }
    window.addEventListener('admin_theme_change', handleCustom)
    return () => window.removeEventListener('admin_theme_change', handleCustom)
  }, [])

  return { theme, setTheme, mounted, isDark: theme === 'dark' }
}

/**
 * Hook para gerenciar o tema do Cardápio do Cliente (/menu) de forma 100% isolada
 */
export function useCustomerTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('customer_menu_theme') as ThemeMode | null
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
      }
    } catch {}
    setMounted(true)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'customer_menu_theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('customer_menu_theme', newTheme)
      window.dispatchEvent(new CustomEvent('customer_theme_change', { detail: newTheme }))
    } catch {}
  }

  useEffect(() => {
    const handleCustom = (e: any) => {
      if (e.detail === 'dark' || e.detail === 'light') {
        setThemeState(e.detail)
      }
    }
    window.addEventListener('customer_theme_change', handleCustom)
    return () => window.removeEventListener('customer_theme_change', handleCustom)
  }, [])

  return { theme, setTheme, mounted, isDark: theme === 'dark' }
}
