import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  broadcastTVCall,
  broadcastTVClearCall,
  getLastTVCall,
  broadcastTVMarquee,
  getCustomTVMarquee,
  getStoreTVVideos,
  broadcastTVVideos,
  TVVideoItem,
  DEFAULT_OFFICIAL_VIDEOS,
  TVCallEvent,
  broadcastTVSoundConfig,
  getStoredTVSoundConfig,
  TVSoundConfig,
  broadcastTVDisplayConfig,
  getStoredTVDisplayConfig,
  TVDisplayConfig,
} from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order, OrderStatus } from '@/types'
import { Megaphone, Save, RotateCcw, Film, Upload, Trash2, Check, Plus, AlertCircle, Tv, XCircle, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface TVOrdersControlViewProps {
  tenantId?: string
}

type TVControlTab = 'CALL' | 'VIDEOS' | 'MARQUEE' | 'AUDIO' | 'NONE'

export default function TVOrdersControlView({ tenantId }: TVOrdersControlViewProps) {
  const { authFetch } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  
  // Sistema de Abas Exclusivas (Abre uma de cada vez)
  const [activeTab, setActiveTab] = useState<TVControlTab>('CALL')

  // Controle de Áudio e Voz (Feminina / Masculina)
  const [soundConfig, setSoundConfig] = useState<TVSoundConfig>({ enabled: true, gender: 'female' })

  // Controle de Exibição na TV (Últimos Pedidos Finalizados)
  const [displayConfig, setDisplayConfig] = useState<TVDisplayConfig>({ showCompletedOrders: true })

  const [marqueeText, setMarqueeText] = useState('')

  // Controle de Senha em Exibição na Smart TV
  const [currentTVCall, setCurrentTVCall] = useState<TVCallEvent | null>(null)

  // Estados do Gestor de Vídeos da TV
  const [storeVideos, setStoreVideos] = useState<TVVideoItem[]>([])
  const [videoInputMode, setVideoInputMode] = useState<'FILE' | 'URL'>('FILE')
  const [videoUrlInput, setVideoUrlInput] = useState('')
  const [videoTitleInput, setVideoTitleInput] = useState('')
  const [editingVideo, setEditingVideo] = useState<TVVideoItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para chamada manual
  const [manualTicket, setManualTicket] = useState('')
  const [manualClient, setManualClient] = useState('')

  const storeSlug = tenantId === '22222222-2222-2222-2222-222222222222' 
    ? 'torres-novas' 
    : 'aveiro'

  const storeTitle = tenantId === '22222222-2222-2222-2222-222222222222' 
    ? 'Filial Torres Novas' 
    : 'Matriz Aveiro'

  useEffect(() => {
    setMarqueeText(getCustomTVMarquee())
    setStoreVideos(getStoreTVVideos(tenantId))
    setCurrentTVCall(getLastTVCall(tenantId))
    setSoundConfig(getStoredTVSoundConfig())
    setDisplayConfig(getStoredTVDisplayConfig())
  }, [tenantId])

  const handleToggleShowCompleted = (showCompletedOrders: boolean) => {
    const updated = { ...displayConfig, showCompletedOrders }
    setDisplayConfig(updated)
    broadcastTVDisplayConfig(updated)
    toast.success(
      showCompletedOrders
        ? 'Barra de últimos pedidos ativada na Smart TV!'
        : 'Barra de últimos pedidos ocultada na Smart TV!'
    )
  }

  const handleSaveMarquee = () => {
    broadcastTVMarquee(marqueeText.trim())
    toast.success('Mensagem do rodapé da TV atualizada com sucesso!')
  }

  const handleResetMarquee = () => {
    setMarqueeText('')
    broadcastTVMarquee('')
    toast.success('Rodapé restaurado para o modo automático (Últimos Pedidos Finalizados)!')
  }

  // --- Handlers de Áudio e Voz ---
  const handleToggleSoundEnabled = (enabled: boolean) => {
    const updated = { ...soundConfig, enabled }
    setSoundConfig(updated)
    broadcastTVSoundConfig(updated)
    toast.success(`Áudio da Smart TV ${enabled ? 'ativado' : 'desativado'}!`)
  }

  const handleSelectVoiceGender = (gender: 'female' | 'male') => {
    const updated = { ...soundConfig, gender }
    setSoundConfig(updated)
    broadcastTVSoundConfig(updated)
    toast.success(`Voz da TV configurada para: ${gender === 'female' ? 'Feminina' : 'Masculina'}`)
  }

  const handleTestAudio = () => {
    announceTVCall('001', 'Teste Açaí da Rose', soundConfig.gender)
    toast.info(`Reproduzindo teste com Voz ${soundConfig.gender === 'female' ? 'Feminina' : 'Masculina'}...`)
  }

  // --- Handlers de Gestão de Vídeos da Smart TV ---
  const handleToggleVideoActive = (videoId: string) => {
    const updated = storeVideos.map((v) =>
      v.id === videoId ? { ...v, active: !v.active } : v
    )
    setStoreVideos(updated)
    broadcastTVVideos(updated, tenantId)
    toast.success('Status do vídeo atualizado!')
  }

  const handleDeleteVideo = (videoId: string) => {
    const updated = storeVideos.filter((v) => v.id !== videoId)
    setStoreVideos(updated)
    broadcastTVVideos(updated, tenantId)
    toast.success('Vídeo removido da playlist!')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('O arquivo excede o limite recomendado de 50MB. Escolha um clipe mais leve para a Smart TV.')
      return
    }

    const fileUrl = URL.createObjectURL(file)
    const newVideo: TVVideoItem = {
      id: `vid_${Date.now()}`,
      title: videoTitleInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
      url: fileUrl,
      active: true,
      isOfficial: false,
      tagPosition: 'BOTTOM',
      showTags: true,
    }

    const updated = [newVideo, ...storeVideos]
    setStoreVideos(updated)
    broadcastTVVideos(updated, tenantId)
    setVideoTitleInput('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    toast.success('Novo vídeo gastronômico carregado e ativado na Smart TV!')
  }

  const handleAddVideoByUrl = () => {
    if (!videoUrlInput.trim()) {
      toast.error('Informe a URL do vídeo')
      return
    }

    const newVideo: TVVideoItem = {
      id: `vid_${Date.now()}`,
      title: videoTitleInput.trim() || 'Vídeo Promocional',
      url: videoUrlInput.trim(),
      active: true,
      isOfficial: false,
      tagPosition: 'BOTTOM',
      showTags: true,
    }

    const updated = [newVideo, ...storeVideos]
    setStoreVideos(updated)
    broadcastTVVideos(updated, tenantId)
    setVideoUrlInput('')
    setVideoTitleInput('')
    toast.success('Vídeo adicionado por link e ativado na Smart TV!')
  }

  const handleRestoreOfficialVideos = () => {
    setStoreVideos(DEFAULT_OFFICIAL_VIDEOS)
    broadcastTVVideos(DEFAULT_OFFICIAL_VIDEOS, tenantId)
    toast.success('Playlist restaurada com os 4 vídeos oficiais da Franqueadora!')
  }

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
      // fallback silencioso
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch])

  useEffect(() => {
    fetchLiveOrders()
    const interval = setInterval(fetchLiveOrders, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveOrders])

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await authFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      )
      const statusLabel = status === 'READY' ? 'Pronto para Retirar' : status === 'COMPLETED' || status === 'PAID' ? 'Entregue & Finalizado' : 'Em Preparação'
      toast.success(`Pedido movido para: ${statusLabel}`)
    } catch {
      toast.error('Erro ao atualizar status do pedido')
    }
  }

  const handleMarkAsReadyAndCall = (order: Order) => {
    const ticket = `#${String(order.orderNumber || 1).padStart(3, '0')}`
    const client = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')
    
    broadcastTVCall(
      {
        ticket,
        customerName: order.customerName || client,
        tableNumber: order.tableNumber,
        status: 'READY',
        isQRCode: true,
      },
      tenantId
    )

    setCurrentTVCall({
      ticket,
      customerName: client,
      timestamp: Date.now(),
    })

    updateStatus(order.id, 'READY')
    toast.success(`Senha ${ticket} chamada na TV!`)
  }

  const handleReCall = (order: Order) => {
    const ticket = `#${String(order.orderNumber || 1).padStart(3, '0')}`
    const client = order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')

    broadcastTVCall(
      {
        ticket,
        customerName: order.customerName || client,
        tableNumber: order.tableNumber,
        status: 'READY',
        isQRCode: true,
      },
      tenantId
    )

    setCurrentTVCall({
      ticket,
      customerName: client,
      timestamp: Date.now(),
    })

    toast.info(`Senha ${ticket} re-chamada na TV!`)
  }

  const handleDeliver = (order: Order) => {
    updateStatus(order.id, 'COMPLETED')
  }

  const handleManualCall = () => {
    if (!manualTicket.trim()) {
      toast.error('Informe o número da senha (ex: 005 ou 5)')
      return
    }

    const ticketFormatted = `#${manualTicket.trim().replace('#', '').padStart(3, '0')}`
    const clientFormatted = manualClient.trim() || 'Balcão'

    broadcastTVCall(
      {
        ticket: ticketFormatted,
        customerName: clientFormatted,
        status: 'READY',
      },
      tenantId
    )

    setCurrentTVCall({
      ticket: ticketFormatted,
      customerName: clientFormatted,
      timestamp: Date.now(),
    })

    toast.success(`Senha ${ticketFormatted} (${clientFormatted}) chamada na Smart TV!`)
    setManualTicket('')
    setManualClient('')
  }

  const handleClearTVDisplay = () => {
    broadcastTVClearCall(tenantId)
    setCurrentTVCall(null)
    toast.success('Grade da Smart TV liberada com sucesso!')
  }

  const preparingOrders = orders.filter(
    (o) =>
      (o.status as string) === 'PREPARING' ||
      (o.status as string) === 'NEW' ||
      (o.status as string) === 'OPEN' ||
      (o.status as string) === 'WAITING_PAYMENT' ||
      (o.status as string) === 'AWAITING_PAYMENT'
  )
  const readyOrders = orders.filter((o) => o.status === 'READY')

  return (
    <div className="space-y-4">
      {/* Header Minimalista: Botões em Linha Única sem Ícones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Configuração Painel de Senha
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Configure os vídeos gastronômicos, comunicados e chamada da TV de senhas ({storeTitle})
          </p>
        </div>

        {/* Barra de Abas Exclusivas (Abre uma de cada vez) */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto shrink-0 pb-0.5">
          {/* Aba 1: Chamar Senha */}
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'CALL' ? 'NONE' : 'CALL')}
            className={`h-8 px-3 rounded-xl text-xs font-black cursor-pointer shadow-xs transition-all shrink-0 ${
              activeTab === 'CALL'
                ? 'bg-pink-700 text-white ring-2 ring-pink-400'
                : 'bg-pink-600 hover:bg-pink-700 text-white'
            }`}
          >
            Chamar Senha
          </Button>

          {/* Aba 2: Vídeos TV */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'VIDEOS' ? 'NONE' : 'VIDEOS')}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-purple-200 dark:border-white/15 shrink-0 ${
              activeTab === 'VIDEOS' ? 'bg-purple-100 dark:bg-white/15 text-purple-950 dark:text-white font-black ring-2 ring-purple-300' : 'text-purple-950 dark:text-white'
            }`}
          >
            Vídeos TV
          </Button>

          {/* Aba 3: Editar Marquee */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'MARQUEE' ? 'NONE' : 'MARQUEE')}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-purple-200 dark:border-white/15 shrink-0 ${
              activeTab === 'MARQUEE' ? 'bg-purple-100 dark:bg-white/15 text-purple-950 dark:text-white font-black ring-2 ring-purple-300' : 'text-purple-950 dark:text-white'
            }`}
          >
            Editar Marquee
          </Button>

          {/* Aba 4: Áudio */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveTab(activeTab === 'AUDIO' ? 'NONE' : 'AUDIO')}
            className={`h-8 px-3 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 transition-all cursor-pointer shrink-0 ${
              activeTab === 'AUDIO'
                ? 'bg-purple-100 dark:bg-white/15 text-purple-950 dark:text-white font-black ring-2 ring-purple-300'
                : soundConfig.enabled
                ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-300'
                : 'text-purple-950 dark:text-white'
            }`}
          >
            {soundConfig.enabled ? `Áudio (${soundConfig.gender === 'female' ? 'Voz Fem.' : 'Voz Masc.'})` : 'Áudio Desligado'}
          </Button>

          {/* Ação 5: Abrir Tela TV (Nova Aba) */}
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const origin = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://acaidarose.vercel.app'
              window.open(`${origin}/tv/${storeSlug}`, '_blank')
            }}
            className="h-8 px-3 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs cursor-pointer transition-all shrink-0"
          >
            Abrir Tela TV
          </Button>
        </div>
      </div>

      {/* ABA 1: CENTRAL DE CHAMADA DE SENHA & FILA DE PEDIDOS */}
      {activeTab === 'CALL' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Card 1: Controle de Exibição & Chamador Rápido */}
          <div className="p-5 rounded-3xl bg-pink-50/70 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-pink-200/60 dark:border-pink-900/30">
              <div className="flex items-center gap-2 text-sm font-black text-pink-950 dark:text-white uppercase tracking-wider">
                <Megaphone className="h-4 w-4 text-pink-600" />
                <span>Chamada Instantânea na Smart TV</span>
              </div>

              {/* Status Atual da TV & Botão de Limpar Grade */}
              <div className="flex items-center gap-2">
                {currentTVCall ? (
                  <div className="flex items-center gap-2 bg-white dark:bg-[#160228] px-3 py-1 rounded-xl border border-pink-200 dark:border-white/10 text-xs shadow-xs">
                    <Tv className="h-3.5 w-3.5 text-emerald-600 animate-pulse shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      Na TV:{' '}
                      <strong className="font-mono text-purple-950 dark:text-white">
                        {currentTVCall.ticket}
                      </strong>{' '}
                      ({currentTVCall.customerName || 'Balcão'})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleClearTVDisplay}
                      className="h-6 px-2 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer ml-1"
                      title="Limpar a grade grande da Smart TV"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Limpar Tela
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    TV aguardando chamadas
                  </span>
                )}
              </div>
            </div>

            {/* Formulário de Chamada Rápida */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-1/4">
                <Input
                  value={manualTicket}
                  onChange={(e) => setManualTicket(e.target.value)}
                  placeholder="Nº Senha (ex: 005)"
                  className="h-10 text-xs font-mono font-black bg-white dark:bg-[#160228] border-pink-200 dark:border-white/20 text-pink-950 dark:text-white"
                />
              </div>
              <div className="w-full sm:flex-1">
                <Input
                  value={manualClient}
                  onChange={(e) => setManualClient(e.target.value)}
                  placeholder="Nome do Cliente ou Mesa (ex: Henrique ou Mesa 04)"
                  className="h-10 text-xs bg-white dark:bg-[#160228] border-pink-200 dark:border-white/20 text-purple-950 dark:text-white"
                />
              </div>
              <Button
                type="button"
                onClick={handleManualCall}
                className="w-full sm:w-auto h-10 px-6 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-pink-600/30 shrink-0 gap-1.5"
              >
                <Megaphone className="h-4 w-4" />
                <span>Chamar na TV 🔔</span>
              </Button>
            </div>
          </div>

          {/* Card 2: Colunas dos Pedidos (Em Preparação & Pronto para Retirar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Coluna 1: Em Preparação */}
            <div className="rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Em Preparação
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
                  {preparingOrders.length} pedidos
                </Badge>
              </div>

              <div className="space-y-3 min-h-[160px]">
                {preparingOrders.length === 0 ? (
                  <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                    Nenhum pedido em preparação no momento.
                  </div>
                ) : (
                  preparingOrders.map((order) => {
                    const ticket = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                    return (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between gap-3 transition-all hover:border-purple-200"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-purple-950 dark:text-white">
                              {ticket}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'itens'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleMarkAsReadyAndCall(order)}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm gap-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Pronto & Chamar</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Coluna 2: Pronto para Retirar */}
            <div className="rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Pronto para Retirar
                  </h2>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10">
                  {readyOrders.length} pedidos
                </Badge>
              </div>

              <div className="space-y-3 min-h-[160px]">
                {readyOrders.length === 0 ? (
                  <div className="h-[140px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-bold">
                    Nenhum pedido aguardando retirada.
                  </div>
                ) : (
                  readyOrders.map((order) => {
                    const ticket = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                    return (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-emerald-950 dark:text-emerald-200">
                              {ticket}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão')}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                            Aguardando Cliente no Balcão
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReCall(order)}
                            className="h-8 px-2.5 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-900 dark:text-purple-200 cursor-pointer"
                            title="Chamar novamente na TV"
                          >
                            <Megaphone className="h-3 w-3 mr-1" />
                            <span>Re-chamar</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleDeliver(order)}
                            className="h-8 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm gap-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Entregue</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: PAINEL DE GESTÃO DE VÍDEOS DA SMART TV */}
      {activeTab === 'VIDEOS' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
                <Film className="h-4 w-4 text-fuchsia-600" />
                <span>Gerenciar Vídeos Promocionais da Smart TV</span>
              </div>
              <p className="text-xs text-purple-700/80 dark:text-purple-300/80 font-medium mt-0.5">
                Somente os vídeos marcados como <strong className="text-emerald-600 dark:text-emerald-400">ATIVOS</strong> serão reproduzidos no player da Smart TV da loja.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRestoreOfficialVideos}
                className="h-8 px-3 text-[11px] font-bold rounded-xl border-purple-200 dark:border-white/15 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer gap-1"
                title="Restaurar os vídeos oficiais da franqueadora"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Restaurar Oficiais</span>
              </Button>
            </div>
          </div>

          {/* Orientações Técnicas com Badges Claras */}
          <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-purple-950 dark:text-white font-bold">
              <AlertCircle className="h-4 w-4 text-pink-600 shrink-0" />
              <span>Orientações de Resolução & Tamanho:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/60 dark:border-white/10">
                📐 16:9 Widescreen (1920x1080 Full HD)
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/60 dark:border-white/10">
                📦 Máx: 50 MB por vídeo
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/60 dark:border-white/10">
                🎬 Formatos: MP4, WebM, MOV
              </span>
            </div>
          </div>

          {/* Área de Inserção: Dropzone Principal com Alternador de URL */}
          <div className="p-4 rounded-2xl bg-purple-50/30 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-950 dark:text-white tracking-wider">
                Adicionar Novo Vídeo
              </span>
              <button
                type="button"
                onClick={() => setVideoInputMode(videoInputMode === 'FILE' ? 'URL' : 'FILE')}
                className="text-xs text-pink-600 hover:text-pink-700 dark:text-pink-400 font-bold underline cursor-pointer"
              >
                {videoInputMode === 'FILE' ? '🔗 Ou inserir por link/URL externa' : '📤 Ou carregar arquivo local (Upload)'}
              </button>
            </div>

            {videoInputMode === 'FILE' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-200 dark:border-white/20 hover:border-pink-500 dark:hover:border-pink-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-white/5 hover:bg-purple-50/60 group"
              >
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-white/10 text-purple-700 dark:text-pink-400 group-hover:scale-110 transition-transform mb-2">
                  <Upload className="h-6 w-6" />
                </div>
                <span className="text-sm font-black text-purple-950 dark:text-white">
                  Clique aqui para carregar o arquivo de vídeo
                </span>
                <span className="text-xs text-purple-700/70 dark:text-purple-300/70 mt-1">
                  Selecione um clipe MP4 ou WebM do seu computador/telemóvel (Até 50MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                  value={videoTitleInput}
                  onChange={(e) => setVideoTitleInput(e.target.value)}
                  placeholder="Título (ex: Promoção Taça Especial 500ml)"
                  className="h-10 text-xs w-full sm:w-1/3 bg-white dark:bg-white/5 border-purple-200 dark:border-white/15"
                />
                <Input
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/video-promocional.mp4"
                  className="h-10 text-xs flex-1 bg-white dark:bg-white/5 border-purple-200 dark:border-white/15"
                />
                <Button
                  type="button"
                  onClick={handleAddVideoByUrl}
                  className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer shrink-0 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            )}
          </div>

          {/* Galeria de Vídeos da Playlist da Loja */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-purple-950 dark:text-white">
              <span>Playlist da Smart TV ({storeVideos.filter((v) => v.active).length} ativos de {storeVideos.length})</span>
              <span className="text-[11px] text-purple-600 dark:text-purple-300 font-normal">
                Transmissão sincronizada em tempo real com a TV
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {storeVideos.map((video) => (
                <div
                  key={video.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                    video.active
                      ? 'bg-purple-50/40 dark:bg-[#1f0338] border-purple-200 dark:border-white/20 shadow-xs'
                      : 'bg-stone-50 dark:bg-white/5 border-stone-200 dark:border-white/10 opacity-60'
                  }`}
                >
                  {/* Player de Pré-visualização em Miniatura */}
                  <div className="h-28 rounded-xl overflow-hidden bg-black relative border border-black/20">
                    <video
                      src={video.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 right-1.5">
                      <Badge
                        className={`text-[9px] font-black uppercase ${
                          video.active ? 'bg-emerald-600 text-white' : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {video.active ? 'Ativo na TV' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>

                  {/* Detalhes e Ações */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-purple-950 dark:text-white truncate" title={video.title}>
                      {video.title}
                    </h4>
                    {video.isOfficial && (
                      <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider block">
                        Oficial Franqueadora
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-purple-100 dark:border-white/10 gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleToggleVideoActive(video.id)}
                      className={`h-7 px-2 text-[10px] font-black uppercase rounded-lg cursor-pointer transition ${
                        video.active
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {video.active ? 'Pausar' : 'Ativar'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingVideo(video)}
                      className="h-7 px-2 text-[10px] font-bold rounded-lg border-purple-200 dark:border-white/15 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer"
                      title="Personalizar tags e posição nas extremidades"
                    >
                      <span>🏷️ Tags</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteVideo(video.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer ml-auto"
                      title="Excluir vídeo da lista"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE TAGS COM LIVE PREVIEW EM TEMPO REAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-purple-950 dark:text-white uppercase tracking-tight">
                  🏷️ Personalizar Tags do Vídeo
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingVideo(null)}
                className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-slate-600"
              >
                ✕
              </Button>
            </div>

            {/* LIVE PREVIEW DO VÍDEO COM AS TAGS NAS EXTREMIDADES */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase text-purple-900 dark:text-purple-300 tracking-wider">
                Live Preview na Smart TV:
              </span>
              <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-black relative border-2 border-purple-300 dark:border-white/20 shadow-lg">
                <video
                  src={editingVideo.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Renderização das Tags no Live Preview conforme a Posição das Extremidades */}
                {(editingVideo.showTags ?? true) && (
                  <>
                    {/* Tag Esquerda (Principal) */}
                    <div
                      className={`absolute px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-xs font-black text-white shadow-md transition-all ${
                        editingVideo.tagPosition === 'TOP' || editingVideo.tagPosition === 'SPLIT'
                          ? 'top-2.5 left-3'
                          : 'bottom-2.5 left-3'
                      }`}
                    >
                      <span>{editingVideo.tagLeft || editingVideo.title || 'Açaí Puro Artesanal'}</span>
                    </div>

                    {/* Tag Direita (Secundária) */}
                    <div
                      className={`absolute px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-xs font-black text-pink-300 shadow-md transition-all ${
                        editingVideo.tagPosition === 'TOP'
                          ? 'top-2.5 right-3'
                          : 'bottom-2.5 right-3'
                      }`}
                    >
                      <span>{editingVideo.tagRight || 'acaidarose.pt'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* FORMULÁRIO DE CONFIGURAÇÃO */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-950 dark:text-white">
                  Tag Principal (Canto Esquerdo):
                </label>
                <Input
                  value={editingVideo.tagLeft || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, tagLeft: e.target.value })}
                  placeholder="Ex: Açaí Puro Artesanal ou Promoção 500ml"
                  className="h-10 text-xs bg-purple-50/30 dark:bg-white/5 border-purple-200 dark:border-white/15"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-950 dark:text-white">
                  Tag Secundária (Canto Direito):
                </label>
                <Input
                  value={editingVideo.tagRight || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, tagRight: e.target.value })}
                  placeholder="Ex: acaidarose.pt ou Peça na Mesa"
                  className="h-10 text-xs bg-purple-50/30 dark:bg-white/5 border-purple-200 dark:border-white/15"
                />
              </div>

              {/* Seletor de Posição nas Extremidades (Nunca no meio) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-950 dark:text-white">
                  Posição das Tags nas Extremidades:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, tagPosition: 'BOTTOM' })}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                      (editingVideo.tagPosition || 'BOTTOM') === 'BOTTOM'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-purple-50/40 dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10 hover:bg-purple-100'
                    }`}
                  >
                    ⬇️ Inferior (Base)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, tagPosition: 'TOP' })}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                      editingVideo.tagPosition === 'TOP'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-purple-50/40 dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10 hover:bg-purple-100'
                    }`}
                  >
                    ⬆️ Superior (Topo)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingVideo({ ...editingVideo, tagPosition: 'SPLIT' })}
                    className={`p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                      editingVideo.tagPosition === 'SPLIT'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-purple-50/40 dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10 hover:bg-purple-100'
                    }`}
                  >
                    ↗️ Misto (Diagonal)
                  </button>
                </div>
              </div>

              {/* Toggle de Ativar/Desativar Tags Sobrepostas */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10">
                <span className="text-xs font-bold text-purple-950 dark:text-white">
                  Exibir tags sobrepostas neste vídeo
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setEditingVideo({
                      ...editingVideo,
                      showTags: editingVideo.showTags === false ? true : false,
                    })
                  }
                  className={`h-7 px-3 text-xs font-bold rounded-xl cursor-pointer ${
                    (editingVideo.showTags ?? true)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {(editingVideo.showTags ?? true) ? 'Ativado' : 'Oculto'}
                </Button>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO MODAL */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingVideo(null)}
                className="h-10 px-4 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const updated = storeVideos.map((v) =>
                    v.id === editingVideo.id ? editingVideo : v
                  )
                  setStoreVideos(updated)
                  broadcastTVVideos(updated, tenantId)
                  setEditingVideo(null)
                  toast.success('Tags e posicionamento do vídeo atualizados com sucesso!')
                }}
                className="h-10 px-6 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Salvar & Aplicar na TV
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: EDIÇÃO DO MARQUEE (RODAPÉ & AVISOS) */}
      {activeTab === 'MARQUEE' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 1. Mensagem Personalizada Rolante */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
                <Megaphone className="h-4 w-4 text-pink-600" />
                <span>Mensagem Personalizada do Rodapé (Marquee)</span>
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-300 font-bold">
                Texto em destaque rolante na Smart TV
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                value={marqueeText}
                onChange={(e) => setMarqueeText(e.target.value)}
                placeholder="Ex: PROMOÇÃO: Açaí 500ml com 3 acompanhamentos..."
                className="h-10 text-xs bg-purple-50/30 dark:bg-white/5 border-purple-200 dark:border-white/20 text-foreground font-medium"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button onClick={handleSaveMarquee} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer">
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
                <Button variant="outline" onClick={handleResetMarquee} className="h-10 px-3 border-purple-200 dark:border-white/15 text-xs font-bold rounded-xl cursor-pointer">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Limpar
                </Button>
              </div>
            </div>
          </div>

          {/* 2. Opção de Exibição dos Últimos Pedidos Finalizados na TV */}
          <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                {displayConfig.showCompletedOrders ? (
                  <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-red-500 dark:text-red-400" />
                )}
                <span>Exibir Barra de Últimos Pedidos Finalizados</span>
              </div>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 font-medium">
                Quando desativado, o rodapé de histórico de pedidos fica oculto na Smart TV, maximizando a área dos vídeos gastronômicos.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={() => handleToggleShowCompleted(true)}
                className={`h-8 px-3.5 text-xs font-black rounded-xl cursor-pointer transition-all ${
                  displayConfig.showCompletedOrders
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-purple-50'
                }`}
              >
                <span>✓ Exibir na TV</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleToggleShowCompleted(false)}
                className={`h-8 px-3.5 text-xs font-black rounded-xl cursor-pointer transition-all ${
                  !displayConfig.showCompletedOrders
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 border border-purple-200 dark:border-white/15 text-slate-700 dark:text-slate-300 hover:bg-purple-50'
                }`}
              >
                <span>✕ Ocultar na TV</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: CONFIGURAÇÕES DE ÁUDIO & VOZ (FEMININA OU MASCULINA) */}
      {activeTab === 'AUDIO' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
                {soundConfig.enabled ? (
                  <Volume2 className="h-4 w-4 text-pink-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-slate-400" />
                )}
                <span>Configurações de Áudio & Síntese de Voz na Smart TV</span>
              </div>
              <p className="text-xs text-purple-700/80 dark:text-purple-300/80 font-medium mt-0.5">
                Defina se a TV deve emitir sinal sonoro ao chamar senhas e escolha a voz desejada (Feminina ou Masculina).
              </p>
            </div>

            <Button
              type="button"
              onClick={handleTestAudio}
              className="h-8 px-4 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs gap-1"
            >
              <span>🔊 Testar Som da TV</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status do Som na TV */}
            <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-950 dark:text-white tracking-wider">
                  Status do Áudio na TV
                </span>
                <Badge
                  className={`text-[10px] font-black uppercase ${
                    soundConfig.enabled ? 'bg-emerald-600 text-white' : 'bg-zinc-600 text-white'
                  }`}
                >
                  {soundConfig.enabled ? 'Ativado' : 'Desativado'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {soundConfig.enabled
                  ? 'A Smart TV tocará o sino e anunciará a senha e o nome do cliente por voz.'
                  : 'A Smart TV ficará silenciosa, exibindo apenas o destaque visual das senhas.'}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleSoundEnabled(true)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    soundConfig.enabled
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10'
                  }`}
                >
                  ✓ Ativar Áudio
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSoundEnabled(false)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    !soundConfig.enabled
                      ? 'bg-zinc-700 text-white border-zinc-700 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10'
                  }`}
                >
                  ✕ Desativar Áudio
                </button>
              </div>
            </div>

            {/* Seleção de Voz (Feminina / Masculina) */}
            <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-150 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-purple-950 dark:text-white tracking-wider">
                  Gênero da Voz (TTS)
                </span>
                <span className="text-xs font-bold text-pink-600">
                  {soundConfig.gender === 'female' ? 'Voz Feminina' : 'Voz Masculina'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Selecione o tom de voz para a fala automática da senha chamada no salão.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectVoiceGender('female')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    soundConfig.gender === 'female'
                      ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10'
                  }`}
                >
                  👩 Voz Feminina (Padrão)
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectVoiceGender('male')}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer text-center ${
                    soundConfig.gender === 'male'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-purple-950 dark:text-purple-200 border-purple-200 dark:border-white/10'
                  }`}
                >
                  👨 Voz Masculina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
