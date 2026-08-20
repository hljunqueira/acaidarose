'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Utensils, Search, Info, ShoppingBag } from 'lucide-react'

export type CustomerTabId = 'menu' | 'search' | 'more'

interface CustomerBottomNavProps {
  activeTab: CustomerTabId
  onSelectTab: (tab: CustomerTabId) => void
  cartCount: number
  cartTotal: number
  onOpenCart: () => void
}

export default function CustomerBottomNav({
  activeTab,
  onSelectTab,
  cartCount,
  cartTotal,
  onOpenCart,
}: CustomerBottomNavProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#160228]/95 backdrop-blur-xl border-t border-white/15 shadow-2xl">
      {/* Botão Flutuante da Comanda / Carrinho (se houver itens) */}
      {cartCount > 0 && (
        <div className="max-w-xl mx-auto px-4 pt-2.5">
          <button
            type="button"
            onClick={onOpenCart}
            className="w-full h-13 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-between px-5 transition-all active:scale-[0.99] cursor-pointer animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-full bg-white text-purple-950 text-xs font-black flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
              <span>Ver Comanda / Enviar Pedido</span>
            </div>
            <span className="font-mono font-black text-base">€ {cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Barra de 3 Abas com Ícones Grandes e Visíveis */}
      <nav className="max-w-xl mx-auto grid grid-cols-3 py-2.5 text-center select-none">
        <button
          type="button"
          onClick={() => onSelectTab('menu')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer group ${
            activeTab === 'menu'
              ? 'text-fuchsia-400 font-black'
              : 'text-purple-300/60 font-bold hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'menu' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'group-hover:bg-white/5'
          }`}>
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-xs font-black mt-1">Cardápio</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer group ${
            activeTab === 'search'
              ? 'text-fuchsia-400 font-black'
              : 'text-purple-300/60 font-bold hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'search' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'group-hover:bg-white/5'
          }`}>
            <Search className="h-6 w-6" />
          </div>
          <span className="text-xs font-black mt-1">Buscar</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer group ${
            activeTab === 'more'
              ? 'text-fuchsia-400 font-black'
              : 'text-purple-300/60 font-bold hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'more' ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'group-hover:bg-white/5'
          }`}>
            <Info className="h-6 w-6" />
          </div>
          <span className="text-xs font-black mt-1">Sobre a Loja</span>
        </button>
      </nav>
    </div>
  )
}
