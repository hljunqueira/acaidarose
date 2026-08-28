'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tv, Bell, Volume2, ChefHat, CheckCircle2, Sparkles } from 'lucide-react'

interface TVOrdersPanelViewProps {
  tenantId?: string
}

export default function TVOrdersPanelView({ tenantId }: TVOrdersPanelViewProps) {
  const [preparingOrders, setPreparingOrders] = useState<string[]>(['#101', '#102', '#103'])
  const [readyOrders, setReadyOrders] = useState<string[]>(['#098', '#099', '#100'])
  const [lastCalled, setLastCalled] = useState<string>('#100')

  return (
    <div className="min-h-[85vh] bg-[#0c0114] text-white rounded-3xl p-4 sm:p-8 flex flex-col justify-between shadow-2xl border border-purple-900/40 relative overflow-hidden animate-in fade-in duration-300">
      {/* Glow de Fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header do Painel TV */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Açaí da Rose" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Painel de Chamada de Pedidos
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 font-semibold">
              Acompanhe o estado da sua taça em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-pink-600/30 text-pink-300 border border-pink-500/40 px-3 py-1.5 text-xs font-bold flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-pink-400 animate-pulse" />
            <span>Áudio de Chamada Ativo</span>
          </Badge>
        </div>
      </div>

      {/* Destaque de Última Senha Chamada */}
      {lastCalled && (
        <div className="my-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-pink-600/30 via-purple-600/30 to-pink-600/30 border-2 border-pink-500/60 shadow-lg shadow-pink-600/20 flex items-center justify-between z-10 animate-pulse">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-pink-400" />
            <span className="text-base sm:text-xl font-black text-pink-200 uppercase tracking-wider">
              Senha Chamada no Balcão:
            </span>
          </div>
          <div className="text-3xl sm:text-5xl font-black text-white tracking-widest bg-pink-600 px-6 py-2 rounded-xl shadow-md">
            {lastCalled}
          </div>
        </div>
      )}

      {/* Grid Principal: PREPARANDO vs PRONTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4 z-10 flex-1">
        {/* Coluna 1: PREPARANDO */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2.5">
              <ChefHat className="h-6 w-6 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-amber-400 uppercase tracking-wider">
                Em Preparo
              </h2>
            </div>
            <Badge variant="outline" className="text-amber-300 border-amber-400/40 text-xs font-bold">
              {preparingOrders.length} taças
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
            {preparingOrders.map((order) => (
              <div
                key={order}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-inner"
              >
                {order}
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: PRONTO PARA RETIRAR */}
        <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/30 p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-emerald-500/30 mb-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-black text-emerald-400 uppercase tracking-wider">
                Pronto para Retirar
              </h2>
            </div>
            <Badge className="bg-emerald-500 text-white font-bold text-xs">
              Balcão de Entrega
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
            {readyOrders.map((order) => (
              <div
                key={order}
                className="p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce"
              >
                {order}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer da TV */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-300/60 font-bold z-10">
        <span>Açaí da Rose · Experiência Premium</span>
        <span>Aponte a câmara do seu telemóvel ao QR Code para ver o menu</span>
      </div>
    </div>
  )
}
