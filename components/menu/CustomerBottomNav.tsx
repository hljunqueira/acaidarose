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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 text-slate-700 border-t border-purple-100 shadow-xl dark:bg-[#160228]/95 dark:text-white dark:border-white/15 dark:shadow-2xl backdrop-blur-xl transition-colors duration-200 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      {/* Botão Flutuante do Pedido (se houver itens) */}
      {cartCount > 0 && (
        <div className="max-w-xl mx-auto px-4 pt-2.5">
          <button
            type="button"
            onClick={onOpenCart}
            className="w-full h-12 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-between px-5 transition-all active:scale-[0.99] cursor-pointer animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded-full bg-white text-purple-950 text-xs font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
              <span>Ver Pedido</span>
            </div>
            <span className="font-mono font-bold text-sm sm:text-base">€ {cartTotal.toFixed(2)}</span>
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
              ? 'text-fuchsia-600 dark:text-fuchsia-400 font-bold'
              : 'text-slate-500 hover:text-purple-950 dark:text-purple-300/60 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'menu' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300' : 'group-hover:bg-purple-50 dark:group-hover:bg-white/5'
          }`}>
            <Utensils className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold mt-0.5">Cardápio</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer group ${
            activeTab === 'search'
              ? 'text-fuchsia-600 dark:text-fuchsia-400 font-bold'
              : 'text-slate-500 hover:text-purple-950 dark:text-purple-300/60 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'search' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300' : 'group-hover:bg-purple-50 dark:group-hover:bg-white/5'
          }`}>
            <Search className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold mt-0.5">Buscar</span>
        </button>

        {/* Botão de Chamar Atendente na Barra Inferior para Mesas */}
        {isTable && onCallWaiter && (
          <button
            type="button"
            onClick={onCallWaiter}
            className="flex flex-col items-center justify-center py-1 transition-all cursor-pointer group text-pink-600 dark:text-pink-400 hover:text-pink-700 font-bold active:scale-95"
          >
            <div className="p-1.5 rounded-2xl bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-md shadow-pink-600/20 transition-all group-hover:scale-110">
              <Bell className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold mt-0.5 text-pink-600 dark:text-pink-300">Chamar</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectTab('more')}
          className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer group ${
            activeTab === 'more'
              ? 'text-fuchsia-600 dark:text-fuchsia-400 font-bold'
              : 'text-slate-500 hover:text-purple-950 dark:text-purple-300/60 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-all ${
            activeTab === 'more' ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300' : 'group-hover:bg-purple-50 dark:group-hover:bg-white/5'
          }`}>
            <Info className="h-5 w-5" />
          </div>
          <span className="text-[11px] font-bold mt-0.5">Sobre</span>
        </button>
      </nav>
    </div>
  )
}
