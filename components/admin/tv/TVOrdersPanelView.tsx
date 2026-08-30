'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { subscribeToTVCalls, getLastTVCall, TVCallEvent, subscribeToTVMarquee, getCustomTVMarquee } from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order } from '@/types'
import { Maximize, Minimize, Crown, Clock } from 'lucide-react'

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
  const [customMarquee, setCustomMarquee] = useState('')

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
          const currentReady = data.orders.filter((o: Order) => o.status === 'READY')
          if (currentReady.length === 0) {
            setLastCalled(null)
          }
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

  // Ouvinte de mensagem customizada do Marquee em tempo real
  useEffect(() => {
    setCustomMarquee(getCustomTVMarquee())
    const unsubscribeMarquee = subscribeToTVMarquee((msg) => {
      setCustomMarquee(msg)
    })
    return () => unsubscribeMarquee()
  }, [])

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
  const preparingOrders = orders.filter(
    (o) =>
      (o.status as string) === 'PREPARING' ||
      (o.status as string) === 'NEW' ||
      (o.status as string) === 'AWAITING_PAYMENT' ||
      (o.status as string) === 'OPEN' ||
      (o.status as string) === 'WAITING_PAYMENT'
  )
  const readyOrders = orders.filter((o) => o.status === 'READY')
  const completedOrders = orders.filter((o) => (o.status as string) === 'COMPLETED' || (o.status as string) === 'PAID')

  // Helper para exibir nome e mesa:
  // - Se tiver nome e mesa: "Henrique (Mesa 07)"
  // - Se tiver só nome: "Henrique"
  // - Se tiver só mesa: "Mesa 07"
  // - Se não tiver nenhum: "Balcão"
  const getDisplayName = (customerName?: string | null, tableNumber?: string | number | null) => {
    const rawName = customerName?.trim() || ''
    const rawTable = tableNumber ? String(tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
    const isTable = rawTable !== '' && rawTable.toLowerCase() !== 'balcão' && rawTable.toLowerCase() !== 'balcao'

    const tableLabel = isTable ? `Mesa ${rawTable.padStart(2, '0')}` : ''

    if (rawName && tableLabel) {
      return `${rawName} (${tableLabel})`
    }
    if (rawName) {
      return rawName
    }
    if (tableLabel) {
      return tableLabel
    }
    return 'Balcão'
  }

  // Determina se o pedido deve exibir a Coroa Dourada (apenas pedidos feitos pelo cliente via autoatendimento QR Code no telemóvel)
  const isCrownOrder = (order: any) => {
    if (!order) return false
    if (order.isQRCode === true) return true
    if (order.channel === 'QR_CODE') return true
    if (order.cashierName === 'Autoatendimento QR Code' || order.cashierName === 'QR Code') return true
    return false
  }

  // Pedido principal pronto em exibição no quadrante grande:
  // - Se readyOrders tiver pedidos: prioriza o último chamado que ainda esteja pronto, ou pega o primeiro pronto.
  // - Se readyOrders estiver VAZIO (pedido finalizado ou excluído): heroOrder é null (tela limpa).
  const heroOrder = readyOrders.length > 0
    ? (readyOrders.find((o) => {
        if (!lastCalled) return false
        const t1 = `#${String(o.orderNumber || 1).padStart(3, '0')}`
        const t2 = lastCalled.ticket
        return t1 === t2 || String(o.orderNumber) === t2.replace('#', '')
      }) || readyOrders[0])
    : null

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

                {/* Nome do Cliente com Coroa se for estritamente QR Code */}
                <div className="text-2xl sm:text-4xl font-black text-slate-900 flex items-center justify-center gap-2 pt-2">
                  {isCrownOrder(heroOrder) && (
                    <Crown className="h-7 w-7 sm:h-9 sm:w-9 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span className="truncate max-w-md sm:max-w-lg">
                    {getDisplayName(heroOrder.customerName, heroOrder.tableNumber)}
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
              const showCrown = isCrownOrder(order)

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
                        {showCrown && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        <span className="truncate">{getDisplayName(order.customerName, order.tableNumber)}</span>
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
        {/* COLUNA DIREITA (4 COLUNAS): "EM PREPARAÇÃO" (TÍTULO AMARELO + CAIXA BRANCA) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-4 flex flex-col justify-between">
          
          {/* Título Oficial Burger King: EM PREPARAÇÃO em Amarelo/Dourado */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400 uppercase tracking-tight font-sans mb-2 drop-shadow-sm">
            EM PREPARAÇÃO
          </h2>

          {/* Coluna Branca Vertical: Fila da Cozinha em Tempo Real */}
          <div className="flex-1 min-h-[260px] sm:min-h-[300px] rounded-2xl bg-white border-2 border-white text-slate-900 p-3 sm:p-4 shadow-2xl flex flex-col justify-between mb-3 overflow-hidden">
            {preparingOrders.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {preparingOrders.slice(0, 6).map((order) => {
                  const showCrown = isCrownOrder(order)
                  const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                  const clientName = getDisplayName(order.customerName, order.tableNumber)

                  return (
                    <div
                      key={order.id}
                      className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between font-sans"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {showCrown && <Crown className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {clientName}
                        </span>
                      </div>
                      <span className="font-mono font-black text-base sm:text-lg text-[#180424]">
                        {ticketNum}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : calledHistory.length > 0 ? (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 pb-1 border-b border-stone-200">
                  Últimos Chamados:
                </div>
                {calledHistory.slice(0, 5).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-700 truncate">{item.customerName || 'Balcão'}</span>
                    <span className="font-mono font-black text-sm text-slate-900">{item.ticket}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold text-xs sm:text-sm text-center">
                Nenhum pedido em preparação
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

      {/* 3. RODAPÉ COM MARQUEE ANIMADO DINÂMICO (EDITÁVEL PELO STAFF OU FINALIZADOS) */}
      <footer className="pt-2 border-t border-white/15 overflow-hidden">
        <div className="flex items-center gap-3 bg-black/40 rounded-xl px-3 py-1.5 border border-white/10 text-xs text-white font-bold">
          {/* Badge Fixa do Marquee */}
          <div
            className={`flex items-center gap-1.5 shrink-0 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider ${
              customMarquee
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full animate-pulse ${
                customMarquee ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{customMarquee ? 'Comunicado da Loja' : 'Últimos Finalizados'}</span>
          </div>

          {/* Área Rolante Contínua (Marquee Ticker) */}
          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-[marquee_25s_linear_infinite] whitespace-nowrap">
              {customMarquee ? (
                <span className="inline-flex items-center gap-3 mx-4 text-amber-100 text-sm font-black">
                  <span>{customMarquee}</span>
                  <span className="text-amber-400/40">★</span>
                  <span>{customMarquee}</span>
                </span>
              ) : completedOrders.length > 0 ? (
                completedOrders.slice(0, 10).map((o, idx) => (
                  <span key={o.id || idx} className="inline-flex items-center gap-2 mx-4 text-purple-200">
                    <span className="font-mono font-black text-amber-300 text-sm">
                      #{String(o.orderNumber || 1).padStart(3, '0')}
                    </span>
                    <span className="text-white font-bold">
                      {getDisplayName(o.customerName, o.tableNumber)}
                    </span>
                    <span className="text-white/30">•</span>
                  </span>
                ))
              ) : calledHistory.length > 0 ? (
                calledHistory.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 mx-4 text-purple-200">
                    <span className="font-mono font-black text-amber-300 text-sm">{item.ticket}</span>
                    <span className="text-white font-bold">{item.customerName || 'Balcão'}</span>
                    <span className="text-white/30">•</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-2 mx-4 text-purple-200">
                  <span>🍇 Açaí da Rose · O Verdadeiro Açaí Artesanal da Amazônia</span>
                  <span className="text-white/30">•</span>
                  <span>Peça pelo QR Code na mesa ou no balcão de atendimento</span>
                  <span className="text-white/30">•</span>
                  <span>acaidarose.pt</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Estilo CSS do Keyframes Marquee embutido para compatibilidade total em Smart TVs */}
        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </footer>
    </div>
  )
}
