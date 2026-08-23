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
  return (
    <header className="sticky top-0 z-40 bg-[#160228]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all select-none">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
        
        {/* Logo Oficial Açaí da Rose */}
        <Link href="/menu" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Açaí da Rose"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Informações da Loja & Comanda/Mesa */}
        {isTable ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Badge da Loja Selecionada */}
            {tenant?.name && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-400/30 text-purple-200 text-xs font-bold shadow-md">
                <MapPin className="h-3.5 w-3.5 text-pink-400" />
                <span>{tenant.name.replace('Açaí da Rose - ', '').replace('Açaí da Rose ', '') || 'Torres Novas'}</span>
              </div>
            )}

            {/* Badge da Mesa */}
            {tableLabel && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white font-black text-xs shadow-lg shadow-pink-600/30">
                <Utensils className="h-3.5 w-3.5" />
                <span>{tableLabel}</span>
              </div>
            )}

            {/* Botão de Carrinho Rápido na Comanda */}
            {onOpenCart && cartCount > 0 && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 transition-all cursor-pointer"
                title="Ver comanda"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </header>
  )
}


