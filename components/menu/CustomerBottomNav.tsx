'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Utensils, Search, Info, Bell, ShoppingBag } from 'lucide-react'

export type CustomerTabId = 'menu' | 'search' | 'more'

interface CustomerBottomNavProps {
  activeTab: CustomerTabId
  onSelectTab: (tab: CustomerTabId) => void
  cartCount: number
  cartTotal: number
  onOpenCart: () => void
  isTable?: boolean
  onCallWaiter?: () => void
}

export default function CustomerBottomNav({
  activeTab,
  onSelectTab,
  cartCount,
  cartTotal,
  onOpenCart,
  isTable,
  onCallWaiter,
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

      {/* Barra de Navegação com 3 ou 4 Colunas se for Mesa */}
      <nav className={`max-w-xl mx-auto grid ${isTable ? 'grid-cols-4' : 'grid-cols-3'} py-2 text-center select-none`}>
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
            <Utensils className="h-5.5 w-5.5" />
          </div>
          <span className="text-[11px] font-black mt-0.5">Cardápio</span>
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
            <Search className="h-5.5 w-5.5" />
          </div>
          <span className="text-[11px] font-black mt-0.5">Buscar</span>
        </button>

        {/* Botão de Chamar Atendente na Barra Inferior para Mesas */}
        {isTable && onCallWaiter && (
          <button
            type="button"
            onClick={onCallWaiter}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer group text-pink-400 hover:text-pink-300 font-bold active:scale-95"
          >
            <div className="p-1.5 rounded-2xl bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-md shadow-pink-600/30 transition-all group-hover:scale-110">
              <Bell className="h-5.5 w-5.5 animate-bounce" />
            </div>
            <span className="text-[11px] font-black mt-0.5 text-pink-300">Chamar</span>
          </button>
        )}

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
            <Info className="h-5.5 w-5.5" />
          </div>
          <span className="text-[11px] font-black mt-0.5">Sobre</span>
        </button>
      </nav>
    </div>
  )
}
