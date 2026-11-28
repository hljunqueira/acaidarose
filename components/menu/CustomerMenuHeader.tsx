'use client'

import React, { useEffect } from 'react'
import { MapPin, Utensils, ShoppingBag } from 'lucide-react'

import { useLanguageStore } from '@/lib/stores/languageStore'
import { getDisplayStoreLocation } from '@/lib/stores/franchiseStore'

function FlagIcon({ code }: { code: string }) {
  if (code === 'pt') {
    return (
      <svg className="w-3.5 h-2.5 rounded-xs shadow-xs shrink-0 inline-block" viewBox="0 0 600 400" aria-hidden="true">
        <rect width="240" height="400" fill="#046A38" />
        <rect x="240" width="360" height="400" fill="#DA291C" />
        <circle cx="240" cy="200" r="80" fill="#FFCC29" stroke="#000" strokeWidth="8" />
        <path d="M210,170 h60 v60 h-60 z" fill="#DA291C" />
      </svg>
    )
  }
  if (code === 'en') {
    return (
      <svg className="w-3.5 h-2.5 rounded-xs shadow-xs shrink-0 inline-block" viewBox="0 0 741 390" aria-hidden="true">
        <rect width="741" height="390" fill="#B22234" />
        <path d="M0,30H741M0,90H741M0,150H741M0,210H741M0,270H741M0,330H741" stroke="#FFFFFF" strokeWidth="30" />
        <rect width="296" height="210" fill="#3C3B6E" />
        <circle cx="60" cy="45" r="8" fill="#FFF" />
        <circle cx="150" cy="45" r="8" fill="#FFF" />
        <circle cx="240" cy="45" r="8" fill="#FFF" />
        <circle cx="105" cy="105" r="8" fill="#FFF" />
        <circle cx="195" cy="105" r="8" fill="#FFF" />
        <circle cx="60" cy="165" r="8" fill="#FFF" />
        <circle cx="150" cy="165" r="8" fill="#FFF" />
        <circle cx="240" cy="165" r="8" fill="#FFF" />
      </svg>
    )
  }
  if (code === 'es') {
    return (
      <svg className="w-3.5 h-2.5 rounded-xs shadow-xs shrink-0 inline-block" viewBox="0 0 750 500" aria-hidden="true">
        <rect width="750" height="500" fill="#AA151B" />
        <rect y="125" width="750" height="250" fill="#F1BF00" />
        <circle cx="220" cy="250" r="45" fill="#AA151B" opacity="0.8" />
      </svg>
    )
  }
  return null
}

interface CustomerMenuHeaderProps {
  tenant?: any
  isTable?: boolean
  tableLabel?: string
  cartCount?: number
  onOpenCart?: () => void
  allowTableTransfer?: boolean
  onOpenSwitchTable?: () => void
}

export default function CustomerMenuHeader({
  tenant,
  isTable,
  tableLabel,
  cartCount = 0,
  onOpenCart,
  allowTableTransfer = true,
  onOpenSwitchTable,
}: CustomerMenuHeaderProps) {
  const { language, setLanguage, activeLanguages, loadActiveLanguages } = useLanguageStore()
  const isEn = language === 'en'

  useEffect(() => {
    loadActiveLanguages(tenant?.id || tenant?.slug)
  }, [tenant?.id, tenant?.slug, loadActiveLanguages])

  const storeName = getDisplayStoreLocation(tenant)
  const hasLanguages = Boolean(activeLanguages && activeLanguages.length > 1)
  const hasTableControls = Boolean(isTable && tableLabel)

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderLanguageSelector = () =>
    hasLanguages ? (
      <div className="flex items-center rounded-xl p-0.5 bg-purple-50 dark:bg-white/10 border border-purple-200/80 dark:border-white/10 shrink-0">
        {activeLanguages.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              language === opt.code
                ? 'bg-white dark:bg-purple-900/80 text-purple-950 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-purple-300/70 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={opt.name}
          >
            <FlagIcon code={opt.code} />
            <span className="text-[10px] font-black uppercase">{opt.code}</span>
          </button>
        ))}
      </div>
    ) : null

  const renderTableControls = () =>
    hasTableControls ? (
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            if (allowTableTransfer && onOpenSwitchTable) {
              onOpenSwitchTable()
            }
          }}
          className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white font-black text-[11px] sm:text-xs shadow-md shadow-pink-600/20 whitespace-nowrap transition-transform ${
            allowTableTransfer && onOpenSwitchTable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
          }`}
          title={allowTableTransfer ? (isEn ? 'Click to change table' : 'Clique para trocar de mesa') : tableLabel}
        >
          <Utensils className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span>{tableLabel}</span>
          {allowTableTransfer && onOpenSwitchTable && <span className="text-[9px] opacity-80 ml-0.5">▾</span>}
        </button>

        {allowTableTransfer && onOpenSwitchTable && (
          <button
            type="button"
            onClick={onOpenSwitchTable}
            className="text-[11px] font-bold text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 underline underline-offset-2 transition cursor-pointer whitespace-nowrap px-1"
          >
            {isEn ? 'Switch' : 'Trocar'}
          </button>
        )}
      </div>
    ) : null

  const renderCartButton = () =>
    onOpenCart && cartCount > 0 ? (
      <button
        type="button"
        onClick={onOpenCart}
        className="relative p-2 rounded-xl bg-pink-100 hover:bg-pink-200 border border-pink-200 text-pink-700 dark:bg-pink-600/20 dark:hover:bg-pink-600/30 dark:border-pink-500/40 dark:text-pink-300 transition-all cursor-pointer shrink-0"
        title={isEn ? 'View order' : 'Ver pedido'}
      >
        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center shadow-md">
          {cartCount}
        </span>
      </button>
    ) : null

  return (
    <header className="sticky top-0 z-40 bg-white/95 text-slate-900 border-b border-purple-100 shadow-xs dark:bg-[#160228]/95 dark:text-white dark:border-white/10 dark:shadow-2xl backdrop-blur-xl transition-colors duration-200 select-none">
      {/* LAYOUT TELEMÓVEL (< md): 2 linhas confortáveis, zero texto cortado */}
      <div className="md:hidden px-3.5 py-2.5 space-y-2">
        {/* Linha 1: Logo + Nome completo da Loja + Botão Pedido */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer focus:outline-none"
            title="Açaí da Rose"
          >
            <img
              src="/logo-oficial-1.png"
              alt="Açaí da Rose"
              className="h-9 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-slate-900 dark:text-white font-black text-sm leading-tight">
                <MapPin className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400 shrink-0" />
                <span className="break-words">{storeName}</span>
              </div>
              <span className="block text-[10px] text-purple-700 dark:text-purple-300/80 font-bold uppercase tracking-wider mt-0.5">
                {isEn ? 'Official Store' : 'Loja Oficial'}
              </span>
            </div>
          </button>

          {renderCartButton()}
        </div>

        {/* Linha 2: Seletor de Idioma + Mesa / Trocar */}
        {(hasLanguages || hasTableControls) && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-100/80 dark:border-white/10 flex-wrap">
            {renderLanguageSelector()}
            <div className="ml-auto">{renderTableControls()}</div>
          </div>
        )}
      </div>

      {/* LAYOUT WEB / DESKTOP (>= md): 1 linha horizontal equilibrada */}
      <div className="hidden md:flex max-w-6xl mx-auto px-6 py-3 items-center justify-between gap-4">
        {/* 1. Esquerda: Logo Oficial */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="Açaí da Rose"
          >
            <img
              src="/logo-oficial-1.png"
              alt="Açaí da Rose"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>
        </div>

        {/* 2. Centro: Nome da Loja */}
        <div className="flex-1 flex flex-col items-center justify-center text-center min-w-0 px-2">
          <div className="flex items-center justify-center gap-1.5 text-slate-900 dark:text-white font-black text-sm tracking-tight">
            <MapPin className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400 shrink-0" />
            <span>{storeName}</span>
          </div>
          <span className="text-[10px] text-purple-700 dark:text-purple-300/80 font-bold uppercase tracking-wider">
            {isEn ? 'Official Store' : 'Loja Oficial'}
          </span>
        </div>

        {/* 3. Direita: Idioma + Mesa + Pedido */}
        <div className="flex items-center justify-end gap-2.5 shrink-0">
          {renderLanguageSelector()}
          {renderTableControls()}
          {renderCartButton()}
        </div>
      </div>
    </header>
  )
}
