import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  subscribeToTVCalls,
  getLastTVCall,
  TVCallEvent,
  subscribeToTVMarquee,
  getCustomTVMarquee,
  subscribeToTVVideos,
  getStoreTVVideos,
  TVVideoItem,
  subscribeToTVSoundConfig,
  getStoredTVSoundConfig,
  TVSoundConfig,
} from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order } from '@/types'
import { Maximize, Minimize, Crown, Clock } from 'lucide-react'

interface TVOrdersPanelViewProps {
  tenantId?: string
}

export default function TVOrdersPanelView({ tenantId }: TVOrdersPanelViewProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [soundConfig, setSoundConfig] = useState<TVSoundConfig>({ enabled: true, gender: 'female' })
  const [lastCalled, setLastCalled] = useState<{ ticket: string; customerName?: string; isQRCode?: boolean; tableNumber?: number | null } | null>(null)
  const [calledHistory, setCalledHistory] = useState<Array<{ ticket: string; customerName?: string; isQRCode?: boolean; tableNumber?: number | null }>>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [customMarquee, setCustomMarquee] = useState('')
  const [storeVideos, setStoreVideos] = useState<TVVideoItem[]>([])

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

  const lastProcessedCallTimestampRef = useRef<number>(Date.now())

  // 1. Carregamento de pedidos reais da loja ativa e sincronização de chamadas via API (para Smart TVs em outros dispositivos/rede)
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

    // Consulta de chamadas em tempo real via Backend API
    try {
      const callUrl = tenantId ? `/api/tv/call?tenantId=${encodeURIComponent(tenantId)}` : '/api/tv/call'
      const callRes = await fetch(callUrl)
      if (callRes.ok) {
        const callData = await callRes.json()
        if (callData?.success && callData.call) {
          const remoteCall = callData.call
          // Se for uma chamada nova que ainda não foi tocada nesta TV
          if (remoteCall.timestamp > lastProcessedCallTimestampRef.current) {
            lastProcessedCallTimestampRef.current = remoteCall.timestamp
            
            const isQR = Boolean(remoteCall.customerName?.includes('Mesa') || remoteCall.ticket.startsWith('#0'))
            const newCall = {
              ticket: remoteCall.ticket,
              customerName: remoteCall.customerName,
              isQRCode: isQR,
            }

            setLastCalled(newCall)
            setCalledHistory((prev) => {
              const filtered = prev.filter((item) => item.ticket !== remoteCall.ticket)
              return [newCall, ...filtered].slice(0, 10)
            })

            // Toca o áudio TTS exclusivamente na Smart TV
            if (soundConfig.enabled && audioEnabled) {
              announceTVCall(remoteCall.ticket, remoteCall.customerName, soundConfig.gender)
            }
          }
        }
      }
    } catch {
      // fallback silencioso
    }
  }, [tenantId, soundConfig, audioEnabled])

  // Polling a cada 2 segundos para sincronização contínua com PostgreSQL e chamadas
  useEffect(() => {
    fetchLiveOrders()
    const interval = setInterval(fetchLiveOrders, 2000)
    return () => clearInterval(interval)
  }, [fetchLiveOrders])

  // 2. Ouvinte de Chamadas em Tempo Real via BroadcastChannel e LocalStorage (mesmo navegador)
  useEffect(() => {
    const initialCall = getLastTVCall(tenantId)
    if (initialCall) {
      setLastCalled({
        ticket: initialCall.ticket,
        customerName: initialCall.customerName,
      })
    }

    const unsubscribe = subscribeToTVCalls(
      (event: TVCallEvent) => {
        // Evita tocar duplicado se já foi processado via API
        if (event.timestamp <= lastProcessedCallTimestampRef.current) return
        lastProcessedCallTimestampRef.current = event.timestamp

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

        if (soundConfig.enabled && audioEnabled) {
          announceTVCall(event.ticket, event.customerName, soundConfig.gender)
        }

        fetchLiveOrders()
      },
      () => {
        // Limpar chamada da TV
        setLastCalled(null)
      },
      tenantId
    )

    return () => unsubscribe()
  }, [audioEnabled, fetchLiveOrders, tenantId, soundConfig])

  // Ouvinte de configurações de Som da TV em tempo real
  useEffect(() => {
    setSoundConfig(getStoredTVSoundConfig())
    const unsubscribeSound = subscribeToTVSoundConfig((config) => {
      setSoundConfig(config)
    })
    return () => unsubscribeSound()
  }, [])

  // Ouvinte de mensagem customizada do Marquee em tempo real
  useEffect(() => {
    setCustomMarquee(getCustomTVMarquee())
    const unsubscribeMarquee = subscribeToTVMarquee((msg) => {
      setCustomMarquee(msg)
    })
    return () => unsubscribeMarquee()
  }, [])

  // Ouvinte e Carregamento de Vídeos da Playlist da Loja em tempo real
  useEffect(() => {
    setStoreVideos(getStoreTVVideos(tenantId))
    const unsubscribeVideos = subscribeToTVVideos((videos) => {
      setStoreVideos(videos)
    }, tenantId)
    return () => unsubscribeVideos()
  }, [tenantId])

  // Filtra estritamente os vídeos ativos na playlist da loja
  const activeVideos = storeVideos.filter((v) => v.active)
  const currentVideo = activeVideos.length > 0 ? activeVideos[currentVideoIndex % activeVideos.length] : null

  // 3. Rotação contínua de vídeos em loop
  const handleVideoEnded = () => {
    if (activeVideos.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % activeVideos.length)
    }
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
  const getDisplayName = (customerName?: string | null, tableNumber?: string | number | null) => {
    const rawName = customerName?.trim() || ''
    const rawTable = tableNumber ? String(tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
    const isTable = rawTable !== '' && rawTable.toLowerCase() !== 'balcão' && rawTable.toLowerCase() !== 'balcao'

    const tableLabel = isTable ? `MESA ${rawTable.padStart(2, '0')}` : ''

    if (rawName && tableLabel) {
      return `${rawName.toUpperCase()} — ${tableLabel}`
    }
    if (rawName) {
      return rawName.toUpperCase()
    }
    if (tableLabel) {
      return tableLabel
    }
    return 'BALCÃO'
  }

  // Determina se o pedido deve exibir a Coroa Dourada (pedidos feitos pelo cliente via autoatendimento QR Code no telemóvel)
  const isCrownOrder = (order: any) => {
    if (!order) return false
    if (order.isQRCode === false || order.is_qr_code === false || order.channel === 'POS') return false
    
    // Flag explícita
    if (order.isQRCode === true || order.is_qr_code === true || order.channel === 'QR_CODE') return true
    
    // Operador de autoatendimento ou QR
    const cName = String(order.cashierName || order.cashier_name || '').toLowerCase()
    if (cName.includes('qr') || cName.includes('autoatendimento')) return true

    return false
  }

  // Determina o pedido principal em destaque na CAIXA GIGANTE:
  const matchedReady = lastCalled
    ? readyOrders.find((o) => {
        const tNum = `#${String(o.orderNumber || 1).padStart(3, '0')}`
        return tNum === lastCalled.ticket || String(o.orderNumber) === lastCalled.ticket.replace('#', '')
      })
    : null

  const heroOrder: {
    ticket: string
    customerName?: string | null
    tableNumber?: string | number | null
    orderNumber?: number
    isQRCode?: boolean
  } | null = lastCalled
    ? {
        ticket: lastCalled.ticket,
        customerName: lastCalled.customerName,
        tableNumber: lastCalled.tableNumber,
        isQRCode: lastCalled.isQRCode,
      }
    : readyOrders.length > 0
    ? {
        ticket: `#${String(readyOrders[0].orderNumber || 1).padStart(3, '0')}`,
        customerName: readyOrders[0].customerName,
        tableNumber: readyOrders[0].tableNumber,
        orderNumber: readyOrders[0].orderNumber,
        isQRCode: isCrownOrder(readyOrders[0]),
      }
    : null

  // Histórico de pedidos prontos para as caixas secundárias (excluindo o principal em destaque)
  const otherReadyOrders = readyOrders
    .filter((o) => {
      if (!heroOrder) return true
      const tNum = `#${String(o.orderNumber || 1).padStart(3, '0')}`
      return tNum !== heroOrder.ticket
    })
    .map((o) => ({
      ticket: `#${String(o.orderNumber || 1).padStart(3, '0')}`,
      customerName: o.customerName,
      tableNumber: o.tableNumber,
      isQRCode: isCrownOrder(o),
    }))

  // Histórico de chamadas para preenchimento
  const otherHistoryCalls = calledHistory
    .filter((h) => !heroOrder || h.ticket !== heroOrder.ticket)
    .map((h) => ({
      ticket: h.ticket,
      customerName: h.customerName,
      tableNumber: h.tableNumber,
      isQRCode: h.isQRCode,
    }))

  // Itens em preparação para a esteira horizontal
  const preparingItems = preparingOrders

  const handleUnlockAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }

  return (
    <div
      ref={panelRef}
      onClick={handleUnlockAudio}
      className="min-h-screen w-full bg-[#180424] text-white p-3 sm:p-5 flex flex-col justify-between select-none overflow-hidden font-sans cursor-pointer"
    >
      {/* 1. TOPO: Título PEDIDOS PRONTOS em Fonte Cursiva e Logotipo Oficial */}
      <header className="relative w-full pb-2 border-b border-white/15">
        <div className="w-full flex items-center justify-between">
          {/* Título Principal em Tipografia Cursiva Artesanal */}
          <div className="flex items-center">
            <h2 className="font-cursive text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-wide drop-shadow-sm leading-none">
              Pedidos Prontos
            </h2>
          </div>

          {/* Logotipo e Nome da Loja */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Açaí da Rose" className="h-9 sm:h-11 w-auto object-contain" />
            <div className="flex flex-col text-left">
              <span className="font-cursive text-xl sm:text-2xl font-bold text-white leading-none">
                Açaí da Rose
              </span>
              <span className="text-pink-400 font-bold text-xs sm:text-sm leading-tight">
                {storeName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. GRID PRINCIPAL (Corpo da TV em 7x5 colunas) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-2 flex-1 items-stretch">
        
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (7 COLUNAS): "PEDIDOS PRONTOS" + "EM PREPARAÇÃO (ESTEIRA)" */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 flex flex-col justify-between h-full space-y-3.5">
          
          {/* Caixa Branca Principal (Hero de Pedidos Prontos com Altura e Fontes Ampliadas) */}
          <div className="flex-1 min-h-[220px] sm:min-h-[260px] lg:min-h-[285px] rounded-3xl bg-white border-2 border-white text-slate-900 py-5 px-6 flex flex-col items-center justify-center text-center shadow-2xl relative">
            {heroOrder ? (
              <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in zoom-in-95 duration-200 w-full">
                
                {/* 1º: Nome do Cliente com Coroa e Fonte Geométrica Nítida em Caixa Alta (Ex: VALDAIR — MESA 12) */}
                <div className="font-sans font-black text-4xl sm:text-5xl lg:text-6xl text-[#180424] flex items-center justify-center gap-3 uppercase tracking-tight leading-tight max-w-full px-2">
                  {heroOrder.isQRCode && (
                    <Crown className="h-8 w-8 sm:h-11 sm:w-11 text-amber-500 fill-amber-500 shrink-0 inline-block" />
                  )}
                  <span className="truncate max-w-lg sm:max-w-xl">
                    {getDisplayName(heroOrder.customerName, heroOrder.tableNumber)}
                  </span>
                </div>

                {/* 2º: Número do Ticket / Senha Gigante Monospace */}
                <div className="font-mono font-black text-7xl sm:text-8xl lg:text-9xl text-[#180424] tracking-tight leading-none my-1">
                  {heroOrder.ticket || `#${String(heroOrder.orderNumber || 1).padStart(3, '0')}`}
                </div>

                {/* 3º: Instrução Oficial em Glossário PT-PT Mandatório */}
                <div className="text-xs sm:text-sm lg:text-base font-black tracking-widest text-pink-600 uppercase pt-1">
                  POR FAVOR, DIRIJA-SE AO BALCÃO DE LEVANTAMENTO
                </div>
              </div>
            ) : (
              <div className="text-slate-400 font-bold text-xl sm:text-2xl">
                Aguardando conclusão de pedidos...
              </div>
            )}
          </div>

          {/* Seção Inferior: Título "EM PREPARAÇÃO" Ampliado e Cards 2x Maiores com Rolagem */}
          <div className="w-full flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-2.5 px-1">
              <span className="h-4 w-4 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <h3 className="font-cursive text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400 leading-none">
                Em Preparação
              </h3>
            </div>

            {/* Esteira Horizontal de Cards 2x Maiores de Preparação */}
            <div className="w-full overflow-hidden">
              {preparingItems.length > 4 ? (
                <div className="flex gap-3.5 animate-[marquee_20s_linear_infinite] whitespace-nowrap py-1">
                  {preparingItems.map((order) => (
                    <div
                      key={order.id}
                      className="min-w-[210px] sm:min-w-[240px] h-32 sm:h-38 lg:h-42 rounded-3xl bg-white border-2 border-white text-slate-900 p-4 flex flex-col items-center justify-center text-center shadow-xl shrink-0"
                    >
                      <div className="flex items-center gap-1.5 font-mono font-black text-3xl sm:text-4xl text-[#180424] leading-none">
                        <span className="text-amber-500 text-lg">⏳</span>
                        <span>#{String(order.orderNumber || 1).padStart(3, '0')}</span>
                      </div>
                      <div className="font-sans font-black text-sm sm:text-base lg:text-lg text-slate-900 uppercase truncate w-full flex items-center justify-center gap-1.5 mt-2 leading-tight">
                        {isCrownOrder(order) && <Crown className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                        <span className="truncate">{getDisplayName(order.customerName, order.tableNumber)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {[0, 1, 2, 3].map((idx) => {
                    const order = preparingItems[idx]
                    const historyFallback = !order ? otherHistoryCalls[idx] : null

                    return (
                      <div
                        key={idx}
                        className="h-32 sm:h-38 lg:h-42 rounded-3xl bg-white border-2 border-white text-slate-900 p-4 flex flex-col items-center justify-center text-center shadow-xl transition-transform"
                      >
                        {order ? (
                          <>
                            <div className="flex items-center gap-1.5 font-mono font-black text-3xl sm:text-4xl lg:text-5xl text-[#180424] leading-none">
                              <span className="text-amber-500 text-base sm:text-lg">⏳</span>
                              <span>#{String(order.orderNumber || 1).padStart(3, '0')}</span>
                            </div>
                            <div className="font-sans font-black text-xs sm:text-sm lg:text-base text-slate-900 uppercase truncate w-full flex items-center justify-center gap-1.5 mt-2 leading-tight">
                              {isCrownOrder(order) && <Crown className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                              <span className="truncate">{getDisplayName(order.customerName, order.tableNumber)}</span>
                            </div>
                          </>
                        ) : historyFallback ? (
                          <>
                            <div className="font-mono font-black text-2xl sm:text-3xl text-slate-700 leading-none">
                              {historyFallback.ticket}
                            </div>
                            <div className="font-sans font-black text-xs sm:text-sm text-slate-600 uppercase truncate w-full mt-1.5 leading-tight">
                              {historyFallback.customerName || 'BALCÃO'}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-300 font-mono font-bold text-3xl">
                            ---
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA (5 COLUNAS): "VÍDEO DA TAÇA AMPLIADO EM ALTURA TOTAL" */}
        {/* ========================================================================= */}
        <section className="lg:col-span-5 flex flex-col justify-between h-full">
          
          {/* Player de Vídeo Expandido na Altura Completa da TV */}
          <div className="h-full min-h-[460px] sm:min-h-[520px] rounded-3xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl relative flex flex-col items-center justify-center">
            {activeVideos.length > 0 && currentVideo ? (
              <video
                ref={videoRef}
                key={currentVideo.url}
                src={currentVideo.url}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnded}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2a0845] to-[#160228] p-6 text-center">
                <img src="/logo.png" alt="Açaí da Rose" className="h-16 w-auto object-contain mb-3" />
                <span className="font-cursive text-3xl font-bold text-white uppercase tracking-wider">Açaí da Rose</span>
                <span className="font-cursive text-2xl text-pink-400 font-bold mt-1">O Verdadeiro Açaí Artesanal</span>
              </div>
            )}

            {/* Renderização Dinâmica das Tags nas Extremidades do Vídeo (Nunca no meio) */}
            {(currentVideo?.showTags ?? true) && (
              <>
                {/* Tag Canto Esquerdo */}
                <div
                  className={`absolute px-3.5 py-2 rounded-xl bg-black/70 backdrop-blur-xs text-xs sm:text-sm text-white font-black drop-shadow-md transition-all pointer-events-none max-w-[240px] truncate ${
                    currentVideo?.tagPosition === 'TOP' || currentVideo?.tagPosition === 'SPLIT'
                      ? 'top-3 left-3.5'
                      : 'bottom-3 left-3.5'
                  }`}
                >
                  <span>{currentVideo?.tagLeft || currentVideo?.title || 'Açaí Puro Artesanal'}</span>
                </div>

                {/* Tag Canto Direito */}
                <div
                  className={`absolute px-3.5 py-2 rounded-xl bg-black/70 backdrop-blur-xs text-xs sm:text-sm text-pink-300 font-black drop-shadow-md transition-all pointer-events-none ${
                    currentVideo?.tagPosition === 'TOP'
                      ? 'top-3 right-3.5'
                      : 'bottom-3 right-3.5'
                  }`}
                >
                  <span>{currentVideo?.tagRight || 'acaidarose.pt'}</span>
                </div>
              </>
            )}
          </div>
        </section>

      </main>

      {/* 3. RODAPÉ AMPLIADO: MARQUEE 2X MAIS ALTO + HORÁRIO DE LISBOA + BOTÃO ECRÃ INTEIRO */}
      <footer className="pt-2.5 border-t border-white/15 flex flex-col sm:flex-row items-center gap-3">
        {/* Barra do Marquee 2x Mais Alta com Altura Generosa */}
        <div className="flex-1 w-full flex items-center gap-4 bg-black/80 rounded-3xl px-7 py-5 sm:py-6 border-2 border-white/15 text-lg sm:text-xl text-white font-bold shadow-2xl overflow-hidden">
          {/* Badge Fixa do Marquee */}
          <div
            className={`flex items-center gap-2.5 shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider ${
              customMarquee
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full animate-pulse ${
                customMarquee ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{customMarquee ? 'Comunicado da Loja' : 'Últimos Finalizados'}</span>
          </div>

          {/* Área Rolante Contínua (Marquee Ticker Ampliado em Caixa Alta) */}
          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-[marquee_25s_linear_infinite] whitespace-nowrap text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-wider">
              {customMarquee ? (
                <span className="inline-flex items-center gap-4 mx-4 text-amber-100 font-black uppercase">
                  <span>{customMarquee}</span>
                  <span className="text-amber-400/50">★</span>
                  <span>{customMarquee}</span>
                </span>
              ) : completedOrders.length > 0 ? (
                completedOrders.slice(0, 10).map((o, idx) => (
                  <span key={o.id || idx} className="inline-flex items-center gap-3 mx-6 text-purple-200 uppercase">
                    <span className="font-mono font-black text-amber-300 text-xl sm:text-2xl">
                      #{String(o.orderNumber || 1).padStart(3, '0')}
                    </span>
                    <span className="text-white font-extrabold uppercase">
                      {getDisplayName(o.customerName, o.tableNumber)}
                    </span>
                    <span className="text-white/30">•</span>
                  </span>
                ))
              ) : otherHistoryCalls.length > 0 ? (
                otherHistoryCalls.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-3 mx-6 text-purple-200 uppercase">
                    <span className="font-mono font-black text-amber-300 text-xl sm:text-2xl">{item.ticket}</span>
                    <span className="text-white font-extrabold uppercase">{item.customerName || 'BALCÃO'}</span>
                    <span className="text-white/30">•</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-4 mx-4 text-purple-200 font-black uppercase tracking-wider">
                  <span>🍇 AÇAÍ DA ROSE · O VERDADEIRO AÇAÍ ARTESANAL DA AMAZÔNIA</span>
                  <span className="text-white/30">•</span>
                  <span>PEÇA PELO QR CODE NA MESA OU NO BALCÃO DE ATENDIMENTO</span>
                  <span className="text-white/30">•</span>
                  <span>ACAIDAROSE.PT</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Widgets no Canto Inferior Direito: Relógio Oficial de Lisboa & Botão Ecrã Inteiro */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Relógio Travado em Portugal (Europe/Lisbon) */}
          <div className="flex items-center gap-2.5 px-5 py-4 sm:py-5 rounded-3xl bg-black/80 border-2 border-white/20 text-base sm:text-lg font-mono font-black text-white shadow-2xl">
            <Clock className="h-5 w-5 text-pink-400 shrink-0" />
            <span>{currentTime || '00:00:00'}</span>
            <span className="text-xs text-purple-300 font-sans uppercase font-extrabold">Lisboa</span>
          </div>

          {/* Ecrã Inteiro */}
          <Button
            type="button"
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="h-14 w-14 sm:h-16 sm:w-16 p-0 rounded-3xl border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer shadow-2xl"
            title="Ecrã Inteiro"
          >
            {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
          </Button>
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
