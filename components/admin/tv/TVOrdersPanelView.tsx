'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/authStore'
import { subscribeToTVCalls, getLastTVCall, TVCallEvent } from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order } from '@/types'

interface TVOrdersPanelViewProps {
  tenantId?: string
}

const ACAI_VIDEOS = [
  '/videos/hero_cup_rotation.mp4',
  '/videos/hero_gliding_texture.mp4',
  '/videos/hero_orbiting_cup.mp4',
  '/videos/hero_revealing_cup.mp4',
]

export default function TVOrdersPanelView({ tenantId }: TVOrdersPanelViewProps) {
  const { authFetch } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [lastCalled, setLastCalled] = useState<{ ticket: string; customerName?: string } | null>(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const storeSlug = tenantId === '22222222-2222-2222-2222-222222222222' ? 'torres-novas' : 'aveiro'

  // 1. Carregamento de pedidos reais da loja ativa
  const fetchLiveOrders = useCallback(async () => {
    try {
      const url = tenantId ? `/api/orders?tenantId=${tenantId}` : '/api/orders'
      const res = await authFetch(url)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.orders)) {
          setOrders(data.orders)
        }
      }
    } catch {
      // fallback silencioso para não interromper a exibição contínua da TV
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch])

  // Polling de 3 segundos para sincronização contínua com PostgreSQL
  useEffect(() => {
    fetchLiveOrders()
    const interval = setInterval(fetchLiveOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveOrders])

  // 2. Ouvinte de Chamadas em Tempo Real via BroadcastChannel e LocalStorage
  useEffect(() => {
    // Carrega última chamada salva se existir
    const initialCall = getLastTVCall()
    if (initialCall) {
      setLastCalled({
        ticket: initialCall.ticket,
        customerName: initialCall.customerName,
      })
    }

    const unsubscribe = subscribeToTVCalls((event: TVCallEvent) => {
      setLastCalled({
        ticket: event.ticket,
        customerName: event.customerName,
      })

      if (audioEnabled) {
        announceTVCall(event.ticket, event.customerName)
      }

      // Atualiza lista de pedidos imediatamente
      fetchLiveOrders()
    })

    return () => unsubscribe()
  }, [audioEnabled, fetchLiveOrders])

  // 3. Rotação suave de vídeos do Açaí em loop
  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % ACAI_VIDEOS.length)
  }

  // Filtragem dos pedidos reais por status
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING' || o.status === 'NEW')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="min-h-[88vh] bg-[#0c0114] text-white rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col justify-between shadow-2xl border border-purple-900/40 relative overflow-hidden animate-in fade-in duration-300">
      {/* Glow de Fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header do Painel TV */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10 z-10">
        <div className="flex items-center gap-3.5">
          <img src="/logo.png" alt="Açaí da Rose" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Painel de Chamada de Pedidos
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/70 font-semibold">
              Acompanhe o estado da sua taça em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              const next = !audioEnabled
              setAudioEnabled(next)
              if (next) {
                announceTVCall('Áudio Ativado', 'Bem-vindo ao Açaí da Rose')
              }
            }}
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/30'
                : 'bg-white/10 hover:bg-white/15 text-purple-200 border border-white/10'
            }`}
          >
            <span>{audioEnabled ? 'Áudio de Chamada Ativo' : 'Ativar Áudio de Chamada'}</span>
          </Button>

          <div className="hidden sm:flex items-center px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-800/40 text-[11px] font-mono text-purple-300">
            {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Destaque de Última Senha Chamada no Balcão */}
      {lastCalled && (
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-600/25 via-purple-600/25 to-pink-600/25 border-2 border-pink-500/60 shadow-lg shadow-pink-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-10 animate-pulse">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-pink-300">
              Senha Chamada no Balcão
            </div>
            <div className="text-lg sm:text-2xl font-black text-white mt-0.5">
              {lastCalled.customerName || 'Cliente Balcão'}
            </div>
          </div>
          <div className="text-3xl sm:text-5xl font-black text-white tracking-widest bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-2 rounded-xl shadow-md font-mono self-stretch sm:self-auto text-center">
            {lastCalled.ticket}
          </div>
        </div>
      )}

      {/* Layout Principal: Fila de Pedidos + Espaço de Vídeo do Açaí */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 z-10 flex-1">
        {/* Coluna de Pedidos (7 Colunas em telas grandes) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. EM PREPARO */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h2 className="text-base sm:text-lg font-black text-amber-400 uppercase tracking-wider">
                  Em Preparo
                </h2>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40 text-[11px] font-bold">
                  {preparingOrders.length} {preparingOrders.length === 1 ? 'pedido' : 'pedidos'}
                </Badge>
              </div>

              {preparingOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-purple-300/40">
                  Nenhum pedido em preparação no momento
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {preparingOrders.map((order) => {
                    const ticketNum = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-4).toUpperCase()}`
                    const clientName = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')
                    return (
                      <div
                        key={order.id}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between shadow-inner"
                      >
                        <span className="font-mono font-black text-lg sm:text-xl text-amber-300">{ticketNum}</span>
                        <span className="text-xs font-bold text-white/90 truncate max-w-[130px]">{clientName}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="text-[10px] text-amber-300/60 uppercase tracking-wider pt-2 border-t border-white/5 mt-3 text-center font-bold">
              Copa & Montagem em Andamento
            </div>
          </div>

          {/* 2. PRONTO PARA RETIRAR */}
          <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 sm:p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-500/30 mb-3">
                <h2 className="text-base sm:text-lg font-black text-emerald-400 uppercase tracking-wider">
                  Pronto para Retirar
                </h2>
                <Badge className="bg-emerald-500 text-white font-bold text-[11px]">
                  Balcão de Entrega
                </Badge>
              </div>

              {readyOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-purple-300/40">
                  Nenhum pedido aguardando retirada
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {readyOrders.map((order) => {
                    const ticketNum = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-4).toUpperCase()}`
                    const clientName = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')
                    return (
                      <div
                        key={order.id}
                        className="p-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-white flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-pulse"
                      >
                        <span className="font-mono font-black text-xl sm:text-2xl text-emerald-300">{ticketNum}</span>
                        <span className="text-xs font-black text-white truncate max-w-[130px]">{clientName}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="text-[10px] text-emerald-300/70 uppercase tracking-wider pt-2 border-t border-emerald-500/20 mt-3 text-center font-bold">
              Dirija-se ao Balcão
            </div>
          </div>
        </div>

        {/* Coluna Multimídia de Vídeos do Açaí (5 Colunas em telas grandes) */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-[#1c022e] to-[#12011f] border border-purple-800/40 p-4 flex flex-col justify-between overflow-hidden shadow-xl">
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-wider text-pink-300">
              Experiência Açaí da Rose
            </div>
            <span className="text-[10px] text-purple-300/60 font-semibold">100% Artesanal Puro</span>
          </div>

          {/* Video Player Integrado */}
          <div className="relative w-full h-[230px] sm:h-[270px] rounded-2xl overflow-hidden bg-black/40 border border-white/10 my-3 shadow-inner">
            <video
              ref={videoRef}
              key={ACAI_VIDEOS[currentVideoIndex]}
              src={ACAI_VIDEOS[currentVideoIndex]}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="text-xs font-black tracking-wide drop-shadow-md">
                Polpa de Açaí Batida na Hora
              </div>
              <div className="text-[10px] text-purple-200/80 drop-shadow-md">
                Sabor autêntico brasileiro com cremosidade incomparável
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-300/70">
            <span>Frutas frescas & acompanhamentos nobres</span>
            <span className="font-bold text-pink-400">Torres Novas & Aveiro</span>
          </div>
        </div>
      </div>

      {/* Footer da TV */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-purple-300/60 font-bold z-10">
        <span>Açaí da Rose · Experiência Premium</span>
        <span>Aceda ao menu digital: acaidarose.pt/menu?loja={storeSlug}</span>
      </div>
    </div>
  )
}
