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
  const [audioEnabled, setAudioEnabled] = useState(false)
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

  // Determina se o pedido deve exibir a Coroa Dourada (pedidos feitos pelo cliente via autoatendimento QR Code no telemóvel)
  const isCrownOrder = (order: any) => {
    if (!order) return false
    // 1. Flag explícita
    if (order.isQRCode === true || order.is_qr_code === true || order.channel === 'QR_CODE') return true
    
    // 2. Operador de autoatendimento ou QR
    const cName = String(order.cashierName || order.cashier_name || '').toLowerCase()
    if (cName.includes('qr') || cName.includes('autoatendimento')) return true
    
    // 3. Pagamento digital MB WAY do cliente
    if (order.paymentMethod === 'MBWAY' || order.payment_method === 'MBWAY') return true

    // 4. Sem operador físico cadastrado e com mesa associada
    if (!order.cashierId && !order.cashier_id && (order.tableNumber || order.table_number || order.isTableOrder)) return true

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
      className="min-h-screen w-full bg-[#180424] text-white p-3 sm:p-5 flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      {/* 1. TOPO ALINHADO MILIMETRICAMENTE: Logo no Centro Absoluto (50%) e Títulos alinhados às colunas */}
      <header className="relative w-full pb-2.5 border-b border-white/15">
        {/* Grid de 12 colunas para casamento perfeito com as caixas */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* 8 Colunas da Esquerda: PEDIDOS PRONTOS */}
          <div className="lg:col-span-8 flex items-center">
            <h2 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white uppercase tracking-tight font-sans drop-shadow-sm leading-none">
              PEDIDOS PRONTOS
            </h2>
          </div>

          {/* 4 Colunas da Direita: EM PREPARAÇÃO (Alinhado exatamente com o início da caixa branca da direita) */}
          <div className="lg:col-span-4 flex items-center justify-start">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-400 uppercase tracking-tight font-sans drop-shadow-sm leading-none text-left">
              EM PREPARAÇÃO
            </h2>
          </div>
        </div>

        {/* Logotipo e Nome da Loja Centralizados no CENTRO GEOMÉTRICO ABSOLUTO (50% da Tela) */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 items-center gap-2.5 z-10 pointer-events-none">
          <img src="/logo.png" alt="Açaí da Rose" className="h-9 w-auto object-contain" />
          <div className="flex flex-col text-left">
            <span className="text-base font-black uppercase tracking-tight text-white leading-tight">
              Açaí da Rose
            </span>
            <span className="text-pink-400 font-bold text-xs leading-none">
              {storeName}
            </span>
          </div>
        </div>
      </header>

      {/* 2. GRID PRINCIPAL (Corpo da TV) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 my-2.5 flex-1">
        
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (8 COLUNAS): "PEDIDOS PRONTOS" (CAIXA GIGANTE + 3 CAIXAS INFERIORES) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-8 flex flex-col justify-between">
          
          {/* Caixa Branca Principal (70% de Destaque) */}
          <div className="flex-1 min-h-[280px] sm:min-h-[340px] rounded-2xl bg-white border-2 border-white text-slate-900 p-6 flex flex-col items-center justify-center text-center shadow-2xl relative mb-3">
            {heroOrder ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                {/* Número da Senha Gigante */}
                <div className="font-mono font-black text-6xl sm:text-8xl lg:text-9xl text-[#180424] tracking-tight leading-none">
                  #{String(heroOrder.orderNumber || 1).padStart(3, '0')}
                </div>

                {/* Nome do Cliente com Coroa se for QR Code */}
                <div className="text-2xl sm:text-4xl font-black text-slate-900 flex items-center justify-center gap-2 pt-2">
                  {isCrownOrder(heroOrder) && (
                    <Crown className="h-7 w-7 sm:h-9 sm:w-9 text-amber-500 fill-amber-500 shrink-0" />
                  )}
                  <span className="truncate max-w-md sm:max-w-xl">
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
        {/* COLUNA DIREITA (4 COLUNAS): "FILA DE PREPARAÇÃO" + "VÍDEO DA TAÇA AMPLIADO" */}
        {/* ========================================================================= */}
        <section className="lg:col-span-4 flex flex-col justify-between">
          
          {/* Coluna Branca Vertical: Fila da Cozinha em Tempo Real */}
          <div className="flex-1 min-h-[220px] rounded-2xl bg-white border-2 border-white text-slate-900 p-3 sm:p-4 shadow-2xl flex flex-col justify-between mb-3 overflow-hidden">
            {preparingOrders.length > 0 ? (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
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
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
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

          {/* Espaço Multimídia AMPLIADO: Apenas Vídeos Ativos da Loja (Sem Fallback) */}
          <div className="h-36 sm:h-48 lg:h-52 rounded-2xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl relative">
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2a0845] to-[#160228] p-4 text-center">
                <img src="/logo.png" alt="Açaí da Rose" className="h-10 w-auto object-contain mb-1.5" />
                <span className="text-xs font-black text-white uppercase tracking-wider">Açaí da Rose</span>
                <span className="text-[10px] text-pink-400 font-bold">O Verdadeiro Açaí Artesanal</span>
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white font-black drop-shadow-lg">
              <span className="bg-black/60 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                {currentVideo?.title || 'Açaí Puro Artesanal'}
              </span>
              <span className="text-pink-300 bg-black/60 px-2 py-0.5 rounded-md">acaidarose.pt</span>
            </div>
          </div>
        </section>

      </main>

      {/* 3. RODAPÉ AMPLIADO: MARQUEE DINÂMICO + HORÁRIO DE LISBOA + BOTÃO TELA CHEIA */}
      <footer className="pt-2 border-t border-white/15 flex flex-col sm:flex-row items-center gap-3">
        {/* Barra do Marquee Ampliada */}
        <div className="flex-1 w-full flex items-center gap-3 bg-black/50 rounded-2xl px-4 py-2.5 border border-white/15 text-sm text-white font-bold shadow-lg overflow-hidden">
          {/* Badge Fixa do Marquee */}
          <div
            className={`flex items-center gap-2 shrink-0 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
              customMarquee
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                customMarquee ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{customMarquee ? 'Comunicado da Loja' : 'Últimos Finalizados'}</span>
          </div>

          {/* Área Rolante Contínua (Marquee Ticker Ampliado) */}
          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <div className="inline-block animate-[marquee_25s_linear_infinite] whitespace-nowrap text-sm sm:text-base font-bold">
              {customMarquee ? (
                <span className="inline-flex items-center gap-4 mx-4 text-amber-100 font-black">
                  <span>{customMarquee}</span>
                  <span className="text-amber-400/50">★</span>
                  <span>{customMarquee}</span>
                </span>
              ) : completedOrders.length > 0 ? (
                completedOrders.slice(0, 10).map((o, idx) => (
                  <span key={o.id || idx} className="inline-flex items-center gap-2.5 mx-5 text-purple-200">
                    <span className="font-mono font-black text-amber-300 text-base">
                      #{String(o.orderNumber || 1).padStart(3, '0')}
                    </span>
                    <span className="text-white font-extrabold">
                      {getDisplayName(o.customerName, o.tableNumber)}
                    </span>
                    <span className="text-white/30">•</span>
                  </span>
                ))
              ) : calledHistory.length > 0 ? (
                calledHistory.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2.5 mx-5 text-purple-200">
                    <span className="font-mono font-black text-amber-300 text-base">{item.ticket}</span>
                    <span className="text-white font-extrabold">{item.customerName || 'Balcão'}</span>
                    <span className="text-white/30">•</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-3 mx-4 text-purple-200 font-medium">
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

        {/* Widgets no Canto Inferior Direito: Relógio Oficial de Lisboa & Botão Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Relógio Travado em Portugal (Europe/Lisbon) */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/20 text-xs sm:text-sm font-mono font-black text-white shadow-lg">
            <Clock className="h-4 w-4 text-pink-400 shrink-0" />
            <span>{currentTime || '00:00:00'}</span>
            <span className="text-[10px] text-purple-300 font-sans uppercase font-extrabold">Lisboa</span>
          </div>

          {/* Fullscreen */}
          <Button
            type="button"
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer shadow-lg"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
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
