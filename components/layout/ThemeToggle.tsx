'use client'

import React from 'react'
import { useAdminTheme } from '@/lib/hooks/useIsolatedTheme'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme, mounted, isDark } = useAdminTheme()

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 ${className}`} />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`h-8 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer select-none ${
        isDark
          ? 'bg-white/10 hover:bg-white/15 border-white/15 text-amber-300 shadow-sm'
          : 'bg-purple-50/80 hover:bg-purple-100 border-purple-200/80 text-purple-900 shadow-xs'
      } ${className}`}
      title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
      aria-label="Alternar tema claro e escuro"
    >
      {isDark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400 animate-in spin-in-180 duration-200" />
          <span className="text-[11px] text-purple-200 font-semibold hidden sm:inline-block">Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-purple-700 animate-in spin-in-180 duration-200" />
          <span className="text-[11px] text-purple-950 font-bold hidden sm:inline-block">Escuro</span>
        </>
      )}
    </button>
  )
}

