import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  subscribeToTVCalls,
  getLastTVCall,
  TVCallEvent,
  subscribeToTVMarqueeConfig,
  getStoredTVMarqueeConfig,
  TVMarqueeConfig,
  DEFAULT_MARQUEE_CONFIG,
  subscribeToTVVideos,
  getStoreTVVideos,
  TVVideoItem,
  subscribeToTVSoundConfig,
  getStoredTVSoundConfig,
  TVSoundConfig,
  subscribeToTVDisplayConfig,
  getStoredTVDisplayConfig,
  TVDisplayConfig,
} from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order } from '@/types'
import { Maximize, Minimize, Clock } from 'lucide-react'
import { CrownGoldIcon } from '@/components/ui/CrownGoldIcon'

interface TVOrdersPanelViewProps {
  tenantId?: string
}

export default function TVOrdersPanelView({ tenantId }: TVOrdersPanelViewProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [soundConfig, setSoundConfig] = useState<TVSoundConfig>({ enabled: true, gender: 'female' })
  const [displayConfig, setDisplayConfig] = useState<TVDisplayConfig>({ showCompletedOrders: true })
  const [lastCalled, setLastCalled] = useState<{ ticket: string; customerName?: string | null; isQRCode?: boolean; tableNumber?: string | number | null } | null>(null)
  const [calledHistory, setCalledHistory] = useState<Array<{ ticket: string; customerName?: string | null; isQRCode?: boolean; tableNumber?: string | number | null }>>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [marqueeConfig, setMarqueeConfig] = useState<TVMarqueeConfig>(DEFAULT_MARQUEE_CONFIG)
  const [storeVideos, setStoreVideos] = useState<TVVideoItem[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const storeName = tenantId === '22222222-2222-2222-2222-222222222222' ? 'Loja 2 - Torres Novas' : 'Loja 1 - Aveiro'

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

  const lastProcessedCallTimestampRef = useRef<number>(0)
  const isInitialMountRef = useRef<boolean>(true)

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
          
          // Na inicialização, define o estado visual sem tocar áudio de chamadas antigas
          if (isInitialMountRef.current) {
            isInitialMountRef.current = false
            lastProcessedCallTimestampRef.current = remoteCall.timestamp
            const isQR = Boolean(remoteCall.customerName?.includes('Mesa') || remoteCall.ticket.startsWith('#0'))
            setLastCalled({
              ticket: remoteCall.ticket,
              customerName: remoteCall.customerName,
              isQRCode: isQR,
            })
            return
          }

          // Se for uma chamada nova transmitida pelo operador
          if (remoteCall.timestamp > lastProcessedCallTimestampRef.current) {
            lastProcessedCallTimestampRef.current = remoteCall.timestamp
            
            const isQR = Boolean(remoteCall.customerName?.includes('Mesa') || remoteCall.ticket.startsWith('#0') || remoteCall.isQRCode)
            const newCall = {
              ticket: remoteCall.ticket,
              customerName: remoteCall.customerName,
              tableNumber: remoteCall.tableNumber,
              isQRCode: isQR,
            }

            setLastCalled(newCall)
            setCalledHistory((prev) => {
              const filtered = prev.filter((item) => item.ticket !== remoteCall.ticket)
              return [newCall, ...filtered].slice(0, 10)
            })

            // Toca o áudio TTS exclusivamente na Smart TV
            if (soundConfig.enabled !== false && audioEnabled) {
              announceTVCall(remoteCall.ticket, remoteCall.customerName, soundConfig.gender)
            }
          }
        }
      }
    } catch {
      // fallback silencioso
    }

    // Consulta de configurações do Marquee em tempo real via Backend API
    try {
      const marqueeUrl = tenantId ? `/api/tv/marquee?tenantId=${encodeURIComponent(tenantId)}` : '/api/tv/marquee'
      const marqueeRes = await fetch(marqueeUrl)
      if (marqueeRes.ok) {
        const marqueeData = await marqueeRes.json()
        if (marqueeData?.success && marqueeData.config) {
          setMarqueeConfig((prev) => ({
            ...prev,
            ...marqueeData.config,
          }))
        }
      }
    } catch {}
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
        tableNumber: initialCall.tableNumber,
      })
    }

    const unsubscribe = subscribeToTVCalls(
      (event: TVCallEvent) => {
        // Evita tocar duplicado se já foi processado via API
        if (event.timestamp <= lastProcessedCallTimestampRef.current) return
        lastProcessedCallTimestampRef.current = event.timestamp

        const isQR = Boolean(event.customerName?.includes('Mesa') || event.ticket.startsWith('#0') || event.isQRCode)
        
        const newCall = {
          ticket: event.ticket,
          customerName: event.customerName,
          tableNumber: event.tableNumber,
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

  // Ouvinte de configuração rica do Marquee em tempo real
  useEffect(() => {
    setMarqueeConfig(getStoredTVMarqueeConfig(tenantId))
    const unsubscribeMarquee = subscribeToTVMarqueeConfig((cfg) => {
      setMarqueeConfig(cfg)
    }, tenantId)
    return () => unsubscribeMarquee()
  }, [tenantId])

  // Ouvinte de configuração de exibição da TV (exibir/ocultar últimos finalizados)
  useEffect(() => {
    setDisplayConfig(getStoredTVDisplayConfig())
    const unsubscribeDisplay = subscribeToTVDisplayConfig((cfg) => {
      setDisplayConfig(cfg)
    })
    return () => unsubscribeDisplay()
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

  // Determina se o pedido deve exibir a Coroa Dourada
  const isCrownOrder = (order: any) => {
    if (!order) return true
    return true // Sempre exibe a coroa dourada real para dar destaque VIP a todos os pedidos de clientes e mesas
  }

  // Determina se o último chamado é um pedido REALMENTE PRONTO no banco (READY)
  const activeOrderForLastCall = lastCalled
    ? orders.find((o) => {
        const tNum = `#${String(o.orderNumber || 1).padStart(3, '0')}`
        const matches =
          tNum === lastCalled.ticket ||
          String(o.orderNumber) === lastCalled.ticket.replace('#', '') ||
          (lastCalled.customerName && o.customerName && o.customerName.trim().toUpperCase() === lastCalled.customerName.trim().toUpperCase())
        
        return matches && o.status === 'READY'
      })
    : null

  // Determina o pedido principal em destaque na CAIXA GIGANTE (Hero de Pedidos Prontos):
  const heroOrder: {
    ticket: string
    customerName?: string | null
    tableNumber?: string | number | null
    orderNumber?: number
    isQRCode?: boolean
  } | null = activeOrderForLastCall
    ? {
        ticket: `#${String(activeOrderForLastCall.orderNumber || 1).padStart(3, '0')}`,
        customerName: activeOrderForLastCall.customerName,
        tableNumber: activeOrderForLastCall.tableNumber,
        orderNumber: activeOrderForLastCall.orderNumber,
        isQRCode: true,
      }
    : readyOrders.length > 0
    ? {
        ticket: `#${String(readyOrders[0].orderNumber || 1).padStart(3, '0')}`,
        customerName: readyOrders[0].customerName,
        tableNumber: readyOrders[0].tableNumber,
        orderNumber: readyOrders[0].orderNumber,
        isQRCode: true,
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
      isQRCode: true,
    }))

  // Histórico de chamadas para preenchimento
  const otherHistoryCalls = calledHistory
    .filter((h) => !heroOrder || h.ticket !== heroOrder.ticket)
    .map((h) => ({
      ticket: h.ticket,
      customerName: h.customerName,
      tableNumber: h.tableNumber,
      isQRCode: true,
    }))

  // Itens em preparação para a esteira horizontal (apenas pedidos com status ativo de preparação)
  const preparingItems = preparingOrders

  const handleUnlockAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }

  // Helper para renderizar a Coroa Oficial PNG inclinada coroando diretamente a 1ª letra do nome
  const renderCrownName = (displayName: string) => {
    if (!displayName) return 'BALCÃO'

    const firstChar = displayName.charAt(0)
    const rest = displayName.slice(1)

    return (
      <span className="inline-flex items-baseline justify-center">
        <span className="relative inline-flex items-center justify-center mr-1">
          {/* Imagem Oficial da Coroa Dourada Inclinada de Alto Contraste */}
          <img
            src="/coroa.png"
            alt="Coroa"
            className="absolute -top-8 sm:-top-10 lg:-top-12 -left-4 sm:-left-6 lg:-left-7 h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain -rotate-[18deg] shrink-0 z-30 pointer-events-none drop-shadow-[0_4px_12px_rgba(180,83,9,0.6)] [filter:contrast(1.5)_brightness(0.85)_saturate(2)] animate-pulse"
          />
          <span>{firstChar}</span>
        </span>
        <span>{rest}</span>
      </span>
    )
  }

  const renderSmallCrownName = (displayName: string) => {
    if (!displayName) return 'BALCÃO'

    const firstChar = displayName.charAt(0)
    const rest = displayName.slice(1)

    return (
      <span className="inline-flex items-baseline justify-center">
        <span className="relative inline-flex items-center justify-center mr-0.5">
          <img
            src="/coroa.png"
            alt="Coroa"
            className="absolute -top-4 sm:-top-5 -left-2 h-5 w-5 sm:h-6 sm:w-6 object-contain -rotate-[18deg] shrink-0 z-20 pointer-events-none drop-shadow-xs [filter:contrast(1.5)_brightness(0.85)_saturate(2)]"
          />
          <span>{firstChar}</span>
        </span>
        <span>{rest}</span>
      </span>
    )
  }

  // Helpers específicos para o Hero de Pedidos Prontos (Nome em cima, Mesa abaixo, Ticket embaixo)
  const getHeroCustomerName = (customerName?: string | null, tableNumber?: string | number | null) => {
    if (customerName && customerName.trim()) {
      return customerName.trim().toUpperCase()
    }
    const rawTable = tableNumber !== undefined && tableNumber !== null ? String(tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
    if (rawTable && rawTable.toLowerCase() !== 'balcão' && rawTable.toLowerCase() !== 'balcao') {
      return `MESA ${rawTable.padStart(2, '0')}`
    }
    return 'BALCÃO'
  }

  const getHeroTableSubtitle = (customerName?: string | null, tableNumber?: string | number | null) => {
    const rawTable = tableNumber !== undefined && tableNumber !== null ? String(tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
    if (rawTable && rawTable.toLowerCase() !== 'balcão' && rawTable.toLowerCase() !== 'balcao') {
      return `MESA ${rawTable.padStart(2, '0')}`
    }
    return 'BALCÃO'
  }

  return (
    <div
      ref={panelRef}
      onClick={handleUnlockAudio}
      className="min-h-screen w-full bg-[#180424] text-white p-3 sm:p-5 flex flex-col justify-between select-none overflow-hidden font-sans cursor-pointer"
    >
      {/* 1. TOPO: TÍTULO "PEDIDOS PRONTOS" À ESQUERDA + RELÓGIO DE LISBOA & ECRÃ INTEIRO À DIREITA */}
      <header className="relative w-full pb-3 border-b border-white/15">
        <div className="w-full flex items-center justify-between">
          {/* Título Principal PEDIDOS PRONTOS */}
          <div className="flex items-center justify-start">
            <h2 className="font-cursive text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-wide drop-shadow-md leading-none">
              Pedidos Prontos
            </h2>
          </div>

          {/* Widgets no Canto Superior Direito: Relógio Oficial de Lisboa & Botão Ecrã Inteiro */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Relógio Travado em Portugal (Europe/Lisbon) */}
            <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-black/80 border-2 border-white/20 text-sm sm:text-base font-mono font-black text-white shadow-xl">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400 shrink-0" />
              <span>{currentTime || '00:00:00'}</span>
              <span className="text-[11px] text-purple-300 font-sans uppercase font-extrabold">Lisboa</span>
            </div>

            {/* Ecrã Inteiro */}
            <Button
              type="button"
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="h-11 w-11 sm:h-12 sm:w-12 p-0 rounded-2xl border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer shadow-xl"
              title="Ecrã Inteiro"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. GRID PRINCIPAL (Corpo da TV em 7x5 colunas) */}
      <main className="grid grid-cols-12 gap-4 my-2 flex-1 items-stretch">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (7 COLUNAS): "PEDIDOS PRONTOS" COM LOGO E LOJA DENTRO */}
        {/* ========================================================================= */}
        <section className="lg:col-span-7 flex flex-col justify-between h-full">
          
          {/* Caixa Rosa Pastel Principal em Altura Total (Hero de Pedidos Prontos com Logo, Nome Gigante, Mesa e Ticket) */}
          <div className="w-full h-full min-h-[460px] sm:min-h-[520px] rounded-3xl bg-[#FFF2F6] border-2 border-[#FFE4EC] text-slate-900 py-6 px-6 sm:px-8 flex flex-col items-center justify-center text-center shadow-2xl relative">
            {heroOrder ? (
              <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 animate-in fade-in zoom-in-95 duration-200 w-full my-auto">
                
                {/* Identificação Superior da Loja Dentro do Quadro */}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <img src="/logo.png" alt="Açaí da Rose" className="h-8 w-auto object-contain drop-shadow-xs" />
                  <span className="font-cursive text-2xl sm:text-3xl text-purple-950 font-bold leading-none">
                    Açaí da Rose
                  </span>
                  <span className="text-pink-600 font-black text-xs sm:text-sm uppercase tracking-wider ml-1">
                    · {storeName}
                  </span>
                </div>

                {/* 1º: Nome do Cliente com a Imagem da Coroa Oficial na 1ª Letra (Tamanho Gigante Sem Corte) */}
                <div className="font-sans font-black text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-[#180424] flex items-center justify-center uppercase tracking-tight leading-tight max-w-full px-2 pt-2">
                  <span className="max-w-full inline-block">
                    {renderCrownName(getHeroCustomerName(heroOrder.customerName, heroOrder.tableNumber))}
                  </span>
                </div>

                {/* 2º: Identificação da Mesa Abaixo do Nome */}
                {getHeroTableSubtitle(heroOrder.customerName, heroOrder.tableNumber) && (
                  <div className="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-pink-600 uppercase tracking-wider">
                    {getHeroTableSubtitle(heroOrder.customerName, heroOrder.tableNumber)}
                  </div>
                )}

                {/* 3º: Número do Ticket / Senha Gigante Monospace */}
                <div className="font-mono font-black text-8xl sm:text-9xl lg:text-[10rem] text-[#180424] tracking-tight leading-none my-1 drop-shadow-sm">
                  {heroOrder.ticket || `#${String(heroOrder.orderNumber || 1).padStart(3, '0')}`}
                </div>

                {/* 4º: Instrução Oficial em Glossário PT-PT Mandatório */}
                <div className="text-xs sm:text-sm lg:text-base font-black tracking-widest text-pink-600 uppercase pt-2">
                  POR FAVOR, DIRIJA-SE AO BALCÃO DE LEVANTAMENTO
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 my-auto">
                <img src="/logo.png" alt="Açaí da Rose" className="h-24 sm:h-28 lg:h-32 w-auto object-contain drop-shadow-md mb-2" />
                <div className="font-cursive text-5xl sm:text-6xl lg:text-7xl text-purple-950 font-bold leading-none">
                  Açaí da Rose
                </div>
                <div className="text-pink-600 font-black text-xl sm:text-2xl lg:text-3xl uppercase tracking-widest mt-1">
                  {storeName}
                </div>
              </div>
            )}
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
                <div
                  className={`absolute z-10 px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-white font-bold text-xs shadow-lg transition-all ${
                    currentVideo?.tagPosition === 'TOP'
                      ? 'top-4 left-4'
                      : 'bottom-4 left-4'
                  }`}
                >
                  {currentVideo?.title || 'Açaí Puro Artesanal'}
                </div>

                <div
                  className={`absolute z-10 px-3.5 py-1.5 rounded-xl bg-pink-950/80 backdrop-blur-md border border-pink-500/30 text-pink-300 font-bold text-[11px] shadow-lg transition-all ${
                    currentVideo?.tagPosition === 'TOP'
                      ? 'top-4 right-4'
                      : 'bottom-4 right-4'
                  }`}
                >
                  acaidarose.pt
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* 3. RODAPÉ AMPLIADO EM LARGURA TOTAL (100%): MARQUEE DE PEDIDOS E COMUNICADOS */}
      {(() => {
        const hasPromo = Boolean(marqueeConfig.promoText?.trim())
        const hasIdle = Boolean(marqueeConfig.idleText?.trim())
        const isPreparingEnabled = marqueeConfig.showPreparingOrders !== false
        const hasRealPreparingOrders = isPreparingEnabled && preparingOrders.length > 0

        // Se o usuário não digitou texto e não há pedidos reais em preparo no salão
        if (!hasPromo && !hasIdle && !hasRealPreparingOrders) {
          return null
        }

        const idleMessage = marqueeConfig.idleText?.trim() || ''

        const fontClass =
          marqueeConfig.fontFamily === 'cursive'
            ? 'font-cursive'
            : marqueeConfig.fontFamily === 'mono'
            ? 'font-mono'
            : marqueeConfig.fontFamily === 'serif'
            ? 'font-serif'
            : 'font-sans'

        const sizeClass = marqueeConfig.fontSize || 'text-xl sm:text-2xl'
        
        // Determina a badge e cor de acordo com a prioridade e escolha do operador
        const badgeTitle = hasPromo 
          ? 'Comunicado' 
          : isPreparingEnabled 
          ? 'Em Preparação' 
          : 'Institucional'

        const badgeColor = hasPromo
          ? 'bg-purple-500/25 text-purple-200 border-purple-500/40'
          : isPreparingEnabled
          ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
          : 'bg-pink-500/25 text-pink-200 border-pink-500/40'

        const pulseColor = hasPromo ? 'bg-purple-400' : isPreparingEnabled ? 'bg-amber-400' : 'bg-pink-400'

        return (
          <footer className="pt-2.5 border-t border-white/15 w-full">
            <div className="w-full flex items-center gap-4 bg-black/85 rounded-3xl px-6 py-4 sm:py-5 border-2 border-white/15 shadow-2xl overflow-hidden">
              {/* Badge Fixa do Marquee */}
              <div className={`flex items-center gap-2.5 shrink-0 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border ${badgeColor}`}>
                <span className={`h-3 w-3 rounded-full animate-pulse ${pulseColor}`} />
                <span>{badgeTitle}</span>
              </div>

              {/* Área Rolante Contínua (Ticker Dinâmico) */}
              <div className="relative flex-1 overflow-hidden whitespace-nowrap">
                <div
                  className={`animate-tv-marquee font-black uppercase tracking-wider ${fontClass} ${sizeClass}`}
                  style={{
                    color: marqueeConfig.textColor || '#E9D5FF',
                    animationDuration: `${marqueeConfig.speedSeconds || 25}s`,
                  }}
                >
                  {hasPromo ? (
                    <span className="inline-flex items-center gap-6 mx-4">
                      <span>{marqueeConfig.promoText.trim()}</span>
                      <span className="opacity-40">★</span>
                      {hasRealPreparingOrders && (
                        <>
                          {preparingOrders.map((o, idx) => (
                            <React.Fragment key={o.id || idx}>
                              <span className="inline-flex items-center gap-3">
                                <span className="font-mono text-amber-300">
                                  ⏳ #{String(o.orderNumber || 1).padStart(3, '0')}
                                </span>
                                <span className="text-white font-extrabold">
                                  {getDisplayName(o.customerName, o.tableNumber)}
                                </span>
                              </span>
                              <span className="opacity-40">•</span>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                      <span>{marqueeConfig.promoText.trim()}</span>
                      <span className="opacity-40">★</span>
                      <span>{marqueeConfig.promoText.trim()}</span>
                    </span>
                  ) : isPreparingEnabled ? (
                    <span className="inline-flex items-center gap-6 mx-4">
                      {hasRealPreparingOrders ? (
                        <>
                          {preparingOrders.map((o, idx) => (
                            <React.Fragment key={o.id || idx}>
                              <span className="inline-flex items-center gap-3">
                                <span className="font-mono text-amber-300">
                                  ⏳ #{String(o.orderNumber || 1).padStart(3, '0')}
                                </span>
                                <span className="text-white font-extrabold">
                                  {getDisplayName(o.customerName, o.tableNumber)}
                                </span>
                              </span>
                              <span className="opacity-40">•</span>
                            </React.Fragment>
                          ))}
                          {hasIdle && (
                            <>
                              <span>{idleMessage}</span>
                              <span className="opacity-40">•</span>
                            </>
                          )}
                        </>
                      ) : (
                        hasIdle && (
                          <>
                            <span>{idleMessage}</span>
                            <span className="opacity-40">•</span>
                            <span>{idleMessage}</span>
                            <span className="opacity-40">•</span>
                            <span>{idleMessage}</span>
                          </>
                        )
                      )}
                    </span>
                  ) : hasIdle ? (
                    <span className="inline-flex items-center gap-6 mx-4">
                      <span>{idleMessage}</span>
                      <span className="opacity-40">•</span>
                      <span>{idleMessage}</span>
                      <span className="opacity-40">•</span>
                      <span>{idleMessage}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </footer>
        )
      })()}
    </div>
  )
}
