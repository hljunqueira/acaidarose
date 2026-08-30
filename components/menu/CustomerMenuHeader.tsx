'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Utensils, ShoppingBag } from 'lucide-react'

interface CustomerMenuHeaderProps {
  tenant?: any
  isTable?: boolean
  tableLabel?: string
  cartCount?: number
  onOpenCart?: () => void
}

export default function CustomerMenuHeader({
  tenant,
  isTable,
  tableLabel,
  cartCount = 0,
  onOpenCart,
}: CustomerMenuHeaderProps) {
  const storeName = tenant?.name
    ? tenant.name.replace(/^Açaí da Rose\s*[-—·]\s*/i, '').trim()
    : 'Matriz Aveiro'

  return (
    <header className="sticky top-0 z-40 bg-white/95 text-slate-900 border-b border-purple-100 shadow-xs dark:bg-[#160228]/95 dark:text-white dark:border-white/10 dark:shadow-2xl backdrop-blur-xl transition-colors duration-200 select-none">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-2.5 sm:py-3.5 grid grid-cols-3 items-center">
        
        {/* 1. Esquerda: Logo Oficial Açaí da Rose */}
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="Açaí da Rose"
          >
            <img
              src="/logo.png"
              alt="Açaí da Rose"
              className="h-8 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </button>
        </div>

        {/* 2. Centro: Nome da Loja Centralizado */}
        <div className="flex flex-col items-center justify-center text-center px-1">
          <div className="flex items-center gap-1 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm tracking-tight truncate max-w-full">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-pink-600 dark:text-pink-400 shrink-0" />
            <span className="truncate">{storeName}</span>
          </div>
          <span className="text-[10px] text-purple-700 dark:text-purple-300/70 font-semibold uppercase tracking-wider hidden sm:block">
            Loja Oficial
          </span>
        </div>

        {/* 3. Direita: Mesa & Carrinho */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
          {isTable && tableLabel ? (
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white font-black text-[11px] sm:text-xs shadow-md shadow-pink-600/20 whitespace-nowrap">
              <Utensils className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span>{tableLabel}</span>
            </div>
          ) : null}

          {/* Botão de Carrinho Rápido na Comanda */}
          {onOpenCart && cartCount > 0 && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-1.5 sm:p-2 rounded-xl bg-pink-100 hover:bg-pink-200 border border-pink-200 text-pink-700 dark:bg-pink-600/20 dark:hover:bg-pink-600/30 dark:border-pink-500/40 dark:text-pink-300 transition-all cursor-pointer shrink-0"
              title="Ver pedido"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-pink-600 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            </button>
          )}
        </div>

      </div>
    </header>
  )
}


