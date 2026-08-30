'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { subscribeToTVCalls, getLastTVCall, TVCallEvent } from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order } from '@/types'
import { Volume2, VolumeX, Maximize, Minimize, Crown, Clock } from 'lucide-react'

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

  // Relógio com Fuso Horário Obrigatório de Portugal (Europe/Lisbon)
  useEffect(() => {
    const updateTime = () => {
      try {
        const lisbonTime = new Date().toLocaleTimeString('pt-PT', {
          timeZone: 'Europe/Lisbon',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        setCurrentTime(lisbonTime)
      } catch {
        setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
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

  // Polling a cada 2.5 segundos para sincronização contínua com PostgreSQL
  useEffect(() => {
    fetchLiveOrders()
    const interval = setInterval(fetchLiveOrders, 2500)
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

      // Adiciona ao histórico de já chamados
      setCalledHistory((prev) => {
        const filtered = prev.filter((item) => item.ticket !== event.ticket)
        return [newCall, ...filtered].slice(0, 10)
      })

      if (audioEnabled) {
        announceTVCall(event.ticket, event.customerName)
      }

      fetchLiveOrders()
    })

    return () => unsubscribe()
  }, [audioEnabled, fetchLiveOrders])

  // 3. Rotação contínua de vídeos em loop
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
  const readyOrders = orders.filter((o) => o.status === 'READY')

  // Pedido principal pronto em exibição no quadrante grande
  const heroOrder = readyOrders[0] || (lastCalled ? {
    id: 'last-called',
    orderNumber: lastCalled.ticket.replace('#', ''),
    customerName: lastCalled.customerName,
    isTableOrder: lastCalled.isQRCode,
    tableNumber: lastCalled.tableNumber,
  } : null)

  // Próximos 3 pedidos prontos para as 3 caixas brancas inferiores
  const nextReadyOrders = readyOrders.slice(1, 4)

  return (
    <div
      ref={panelRef}
      className="min-h-screen w-full bg-[#180424] text-white p-3 sm:p-5 lg:p-6 flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      {/* 1. TOPO: Identificação Limpa & Fuso Horário de Lisboa */}
      <header className="flex items-center justify-between gap-3 pb-3 border-b border-white/15">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Açaí da Rose" className="h-9 sm:h-11 w-auto object-contain" />
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-xl font-black uppercase tracking-tight text-white">
              Açaí da Rose
            </span>
            <span className="text-pink-400 font-bold text-xs sm:text-sm">· {storeName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Relógio Travado em Portugal (Europe/Lisbon) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/40 border border-white/20 text-xs sm:text-sm font-mono font-bold text-white">
            <Clock className="h-3.5 w-3.5 text-pink-400" />
            <span>{currentTime || '00:00:00'}</span>
            <span className="text-[10px] text-purple-300 font-sans uppercase font-semibold">Lisboa</span>
          </div>

          {/* Áudio */}
          <Button
            type="button"
            onClick={() => {
              const next = !audioEnabled
              setAudioEnabled(next)
              if (next) {
                announceTVCall('Áudio Ativado', 'Bem-vindo ao Açaí da Rose')
              }
            }}
            size="sm"
            className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              audioEnabled ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{audioEnabled ? 'Voz Ativa' : 'Ativar Voz'}</span>
          </Button>

          {/* Fullscreen */}
          <Button
            type="button"
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>

      {/* 2. GRID PRINCIPAL ESTILO BURGER KING (Fiel à Foto de Referência) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-3 flex-1">
        
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (8 COLUNAS): "PEDIDOS PRONTOS" (TÍTULO BRANCO + CAIXAS BRANCAS) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-8 flex flex-col justify-between">
          
          {/* Título Oficial Burger King: PEDIDOS PRONTOS em Branco */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight font-sans mb-2 drop-shadow-sm">
            PEDIDOS PRONTOS
          </h2>

          {/* Caixa Branca Principal (70% de Destaque) */}
          <div className="flex-1 min-h-[260px] sm:min-h-[320px] rounded-2xl bg-white border-2 border-white text-slate-900 p-6 flex flex-col items-center justify-center text-center shadow-2xl relative mb-3">
            {heroOrder ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                {/* Número da Senha Gigante */}
                <div className="font-mono font-black text-6xl sm:text-8xl lg:text-9xl text-[#180424] tracking-tight leading-none">
                  #{String(heroOrder.orderNumber || 1).padStart(3, '0')}
                </div>

                {/* Nome do Cliente com Coroa se for QR Code */}
                <div className="text-2xl sm:text-4xl font-black text-slate-900 flex items-center justify-center gap-2 pt-2">
                  {(heroOrder.isTableOrder || heroOrder.tableNumber) && (
                    <Crown className="h-7 w-7 sm:h-9 sm:w-9 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span className="truncate max-w-md sm:max-w-lg">
                    {heroOrder.customerName || (heroOrder.tableNumber ? `Mesa ${heroOrder.tableNumber}` : 'Cliente')}
                  </span>
                </div>

                <div className="text-xs sm:text-sm font-black tracking-widest text-pink-600 uppercase pt-1">
                  POR FAVOR, DIRIJA-SE AO BALCÃO DE RETIRADA
                </div>
              </div>
            ) : (
              <div className="text-slate-400 font-bold text-lg sm:text-xl">
                Aguardando conclusão de pedidos...
              </div>
            )}
          </div>

          {/* 3 Caixas Brancas Menores Inferiores (Fiel à Foto do BK) */}
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              const order = nextReadyOrders[idx]
              const isQR = Boolean(order?.isTableOrder || order?.tableNumber)

              return (
                <div
                  key={idx}
                  className="h-24 sm:h-28 rounded-xl bg-white border border-white text-slate-900 p-2.5 sm:p-3 flex flex-col items-center justify-center text-center shadow-lg"
                >
                  {order ? (
                    <>
                      <div className="font-mono font-black text-2xl sm:text-4xl text-[#180424] leading-none">
                        #{String(order.orderNumber || 1).padStart(3, '0')}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800 truncate w-full flex items-center justify-center gap-1 mt-1">
                        {isQR && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        <span className="truncate">{order.customerName || `Mesa ${order.tableNumber}`}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-300 font-mono font-bold text-xl sm:text-2xl">
                      ---
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA (4 COLUNAS): "PEDIDOS JÁ CHAMADOS" (TÍTULO AMARELO + CAIXA BRANCA) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-4 flex flex-col justify-between">
          
          {/* Título Oficial Burger King: PEDIDOS JÁ CHAMADOS em Amarelo/Dourado */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400 uppercase tracking-tight font-sans mb-2 drop-shadow-sm">
            PEDIDOS JÁ CHAMADOS
          </h2>

          {/* Coluna Branca Vertical (Fiel à Foto do BK) */}
          <div className="flex-1 min-h-[260px] sm:min-h-[300px] rounded-2xl bg-white border-2 border-white text-slate-900 p-3 sm:p-4 shadow-2xl flex flex-col justify-between mb-3 overflow-hidden">
            {calledHistory.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {calledHistory.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-between font-sans"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {item.isQRCode && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.customerName || 'Cliente'}
                      </span>
                    </div>
                    <span className="font-mono font-black text-base sm:text-lg text-[#180424]">
                      {item.ticket}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold text-xs sm:text-sm text-center">
                Histórico limpo
              </div>
            )}
          </div>

          {/* Espaço Multimídia: Vídeo Oficial Integrado sem Textos Poluídos */}
          <div className="h-28 sm:h-32 rounded-xl overflow-hidden bg-black border border-white/20 shadow-lg relative">
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
            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-white/90 font-bold drop-shadow-md">
              <span>Açaí Puro Artesanal</span>
              <span className="text-pink-300">acaidarose.pt</span>
            </div>
          </div>
        </section>

      </main>

      {/* 3. RODAPÉ INSTITUCIONAL */}
      <footer className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-purple-200/80 font-bold">
        <span>Acompanhe o seu pedido pelo número da senha</span>
        <span>Aceda ao menu digital pelo QR Code na mesa</span>
      </footer>
    </div>
  )
}
