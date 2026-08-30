'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { subscribeToTVCalls, getLastTVCall, TVCallEvent } from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order } from '@/types'
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Crown,
  Clock,
  Sparkles,
  ChefHat,
} from 'lucide-react'

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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [lastCalled, setLastCalled] = useState<{ ticket: string; customerName?: string; isQRCode?: boolean; tableNumber?: number | null } | null>(null)
  const [calledHistory, setCalledHistory] = useState<Array<{ ticket: string; customerName?: string; isQRCode?: boolean; tableNumber?: number | null }>>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const storeName = tenantId === '22222222-2222-2222-2222-222222222222' ? 'Torres Novas' : 'Matriz Aveiro'
  const storeSlug = tenantId === '22222222-2222-2222-2222-222222222222' ? 'torres-novas' : 'aveiro'

  // Relógio digital em tempo real
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // 1. Carregamento de pedidos reais da loja ativa (público para TV do salão)
  const fetchLiveOrders = useCallback(async () => {
    try {
      const url = tenantId ? `/api/orders?tenantId=${encodeURIComponent(tenantId)}` : '/api/orders'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.orders)) {
          setOrders(data.orders)
        }
      }
    } catch {
      // fallback silencioso para manter exibição contínua
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  // Polling de 3 segundos para sincronização contínua com PostgreSQL
  useEffect(() => {
    fetchLiveOrders()
    const interval = setInterval(fetchLiveOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveOrders])

  // 2. Ouvinte de Chamadas em Tempo Real via BroadcastChannel e LocalStorage
  useEffect(() => {
    const initialCall = getLastTVCall()
    if (initialCall) {
      setLastCalled({
        ticket: initialCall.ticket,
        customerName: initialCall.customerName,
      })
    }

    const unsubscribe = subscribeToTVCalls((event: TVCallEvent) => {
      const isQR = Boolean(event.customerName?.includes('Mesa') || event.ticket.startsWith('#0'))
      
      const newCall = {
        ticket: event.ticket,
        customerName: event.customerName,
        isQRCode: isQR,
      }

      setLastCalled(newCall)

      // Adiciona ao histórico de já chamados sem duplicar no topo
      setCalledHistory((prev) => {
        const filtered = prev.filter((item) => item.ticket !== event.ticket)
        return [newCall, ...filtered].slice(0, 8)
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

  // Alternar tela cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      panelRef.current?.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Filtragem dos pedidos reais por status
  const preparingOrders = orders.filter((o) => (o.status as string) === 'PREPARING' || (o.status as string) === 'NEW' || (o.status as string) === 'AWAITING_PAYMENT' || (o.status as string) === 'OPEN' || (o.status as string) === 'WAITING_PAYMENT')
  const readyOrders = orders.filter((o) => o.status === 'READY')

  // Identifica o pedido de destaque atual
  const activeHeroOrder = readyOrders[0] || (lastCalled ? {
    id: 'last-called',
    orderNumber: lastCalled.ticket.replace('#', ''),
    customerName: lastCalled.customerName,
    isTableOrder: lastCalled.isQRCode,
    tableNumber: lastCalled.tableNumber,
  } : null)

  const otherReadyOrders = readyOrders.slice(1, 7)

  return (
    <div
      ref={panelRef}
      className="min-h-screen w-full bg-[#0e011a] text-white p-3 sm:p-5 lg:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden font-sans select-none"
    >
      {/* Background Decorativo com Iluminação Neon Açaí */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. HEADER DO PAINEL TV */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-purple-800/40 relative z-10">
        <div className="flex items-center gap-3.5">
          <img src="/logo.png" alt="Açaí da Rose" className="h-10 sm:h-12 lg:h-14 w-auto object-contain drop-shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>Açaí da Rose</span>
                <span className="text-pink-400 font-extrabold text-sm sm:text-base">· {storeName}</span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-purple-300/70 font-semibold tracking-wide">
              Painel Oficial de Retirada & Senhas no Salão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Relógio em Tempo Real */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-700/40 text-xs sm:text-sm font-mono font-bold text-pink-300 shadow-inner">
            <Clock className="h-4 w-4 text-pink-400" />
            <span>{currentTime || '00:00:00'}</span>
          </div>

          {/* Botão Ativar Áudio TTS */}
          <Button
            type="button"
            onClick={() => {
              const next = !audioEnabled
              setAudioEnabled(next)
              if (next) {
                announceTVCall('Áudio Ativado', 'Bem-vindo ao Açaí da Rose')
              }
            }}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              audioEnabled
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-white/10 hover:bg-white/15 text-purple-200 border border-white/10'
            }`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{audioEnabled ? 'Voz Ativa' : 'Ativar Voz'}</span>
          </Button>

          {/* Botão Fullscreen */}
          <Button
            type="button"
            onClick={toggleFullscreen}
            variant="outline"
            className="h-9 w-9 p-0 rounded-xl border-purple-700/40 bg-white/10 hover:bg-white/15 text-purple-200 cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* 2. ESTRUTURA PRINCIPAL ESTILO FAST FOOD / BURGER KING */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 my-4 flex-1 relative z-10">
        
        {/* ========================================================================= */}
        {/* BLOCO ESQUERDA (8 COLUNAS): "PEDIDOS PRONTOS" (DESTAQUE FAST FOOD)      */}
        {/* ========================================================================= */}
        <section className="lg:col-span-8 flex flex-col rounded-3xl bg-gradient-to-b from-[#200336]/90 via-[#18022b]/90 to-[#120120]/90 border-2 border-fuchsia-600/40 shadow-2xl p-4 sm:p-6 overflow-hidden">
          
          {/* Header do Bloco: PEDIDOS PRONTOS */}
          <div className="pb-3 border-b-2 border-fuchsia-500/30 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-wider font-sans drop-shadow-md">
                Pedidos Prontos
              </h2>
            </div>
            <Badge className="bg-emerald-500 text-white font-black text-xs sm:text-sm px-3 py-1 uppercase tracking-wider shadow-lg shadow-emerald-500/30">
              Balcão de Retirada
            </Badge>
          </div>

          {/* Slot de Destaque Principal do Pedido Chamado no Momento */}
          {activeHeroOrder ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-600/30 via-purple-600/30 to-pink-600/30 border-2 border-pink-500/70 p-5 sm:p-7 shadow-xl shadow-pink-600/20 mb-4 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-pink-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="h-4 w-4 text-pink-400" />
                  <span>Dirija-se ao Balcão para Retirar</span>
                </div>
                
                {/* Nome do Cliente com Coroa se for QR Code */}
                <div className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  {(activeHeroOrder.isTableOrder || activeHeroOrder.tableNumber) && (
                    <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400 fill-amber-400 shrink-0 drop-shadow-md" />
                  )}
                  <span className="truncate max-w-sm sm:max-w-md">
                    {activeHeroOrder.customerName || (activeHeroOrder.tableNumber ? `Mesa ${activeHeroOrder.tableNumber}` : 'Cliente')}
                  </span>
                </div>

                {activeHeroOrder.tableNumber && (
                  <div className="text-xs font-bold text-purple-200/90">
                    Pedido da Mesa {String(activeHeroOrder.tableNumber).padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Número da Senha em Tamanho Gigante */}
              <div className="bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white font-mono font-black text-4xl sm:text-6xl lg:text-7xl px-7 py-3 rounded-2xl shadow-2xl border-2 border-white/30 tracking-tight text-center">
                #{String(activeHeroOrder.orderNumber || 1).padStart(3, '0')}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-purple-300/50 font-bold mb-4">
              Aguardando conclusão de pedidos pela copa...
            </div>
          )}

          {/* Grid de Slots Inferiores para Múltiplos Pedidos Prontos */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="text-[11px] font-black uppercase tracking-wider text-purple-300/70 mb-2 flex items-center justify-between">
              <span>Também Prontos para Retirada:</span>
              <span>{otherReadyOrders.length} aguardando</span>
            </div>

            {otherReadyOrders.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {otherReadyOrders.map((order) => {
                  const isQR = Boolean(order.isTableOrder || order.tableNumber)
                  const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                  const clientName = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Cliente')

                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 shadow-md shadow-emerald-500/10 flex flex-col justify-between gap-1 hover:border-emerald-400 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-300">
                          {ticketNum}
                        </span>
                        {isQR && (
                          <Crown className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {clientName}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-purple-300/40">
                Nenhum outro pedido pronto na fila
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* BLOCO DIREITA (4 COLUNAS): "PEDIDOS JÁ CHAMADOS" + "EM PREPARO" + VÍDEO  */}
        {/* ========================================================================= */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          
          {/* 1. Pedidos Já Chamados (Estilo BK Amarelo/Âmbar) */}
          <div className="rounded-3xl bg-gradient-to-b from-[#221004]/90 via-[#180a02]/90 to-[#10011a]/90 border-2 border-amber-500/40 shadow-xl p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="pb-2.5 border-b-2 border-amber-500/30 flex items-center justify-between mb-3">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-amber-400 uppercase tracking-wider font-sans">
                  Pedidos Já Chamados
                </h3>
                <Badge variant="outline" className="text-amber-300 border-amber-400/40 text-[10px] font-bold">
                  Últimos Chamados
                </Badge>
              </div>

              {calledHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {calledHistory.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {item.isQRCode && <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                        <span className="text-xs font-bold text-amber-100 truncate max-w-[120px]">
                          {item.customerName || 'Cliente'}
                        </span>
                      </div>
                      <span className="font-mono font-black text-base text-amber-300">{item.ticket}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-amber-300/40 font-semibold">
                  Histórico de chamadas limpo
                </div>
              )}
            </div>

            {/* Sub-bloco: Em Preparação (Copa) */}
            <div className="pt-3 border-t border-amber-500/20 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 mb-1.5">
                <span className="flex items-center gap-1">
                  <ChefHat className="h-3.5 w-3.5 text-pink-400" />
                  <span>A Preparar na Cozinha:</span>
                </span>
                <span className="text-pink-400 font-mono font-bold">{preparingOrders.length}</span>
              </div>

              {preparingOrders.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {preparingOrders.slice(0, 8).map((order) => {
                    const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                    return (
                      <span
                        key={order.id}
                        className="px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-700/40 text-purple-200 text-xs font-mono font-bold"
                      >
                        {ticketNum}
                      </span>
                    )
                  })}
                  {preparingOrders.length > 8 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-purple-400 font-bold">
                      +{preparingOrders.length - 8}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-purple-300/40 italic">Nenhum pedido na fila</span>
              )}
            </div>
          </div>

          {/* 2. Espaço Dedicado Multimídia para Vídeos do Açaí da Rose */}
          <div className="rounded-3xl bg-gradient-to-b from-[#1c022e] to-[#12011f] border border-purple-800/40 p-3.5 flex flex-col justify-between overflow-hidden shadow-xl">
            <div className="pb-2 border-b border-white/10 flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                <span>Experiência Açaí da Rose</span>
              </div>
              <span className="text-[9px] text-purple-300/60 font-semibold">100% Artesanal Puro</span>
            </div>

            {/* Video Player Integrado em Loop */}
            <div className="relative w-full h-[140px] sm:h-[160px] lg:h-[180px] rounded-2xl overflow-hidden bg-black/40 border border-white/10 my-2 shadow-inner">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                <div className="text-[11px] font-black tracking-wide drop-shadow-md">
                  Polpa de Açaí Batida na Hora
                </div>
                <div className="text-[9px] text-purple-200/80 drop-shadow-md">
                  Cremosidade autêntica com frutas frescas
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-300/70 font-semibold">
              <span>Frutas frescas & toppings nobres</span>
              <span className="font-bold text-pink-400">{storeName}</span>
            </div>
          </div>
        </section>

      </main>

      {/* 3. FOOTER INFORMATIVO DA SMART TV */}
      <footer className="pt-3 border-t border-purple-800/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-purple-300/70 font-bold relative z-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
          <span>Por favor, dirija-se ao balcão quando a sua senha for anunciada</span>
        </div>
        <div className="text-[11px] text-purple-300/60 font-medium">
          Aceda ao menu na mesa pelo QR Code · <span className="text-pink-400 font-bold">acaidarose.pt</span>
        </div>
      </footer>
    </div>
  )
}
