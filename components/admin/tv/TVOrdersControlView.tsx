import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/authStore'
import {
  broadcastTVCall,
  broadcastTVMarquee,
  getCustomTVMarquee,
  getStoreTVVideos,
  broadcastTVVideos,
  TVVideoItem,
  DEFAULT_OFFICIAL_VIDEOS,
} from '@/lib/utils/tvBroadcast'
import { announceTVCall } from '@/lib/utils/soundNotification'
import { Order, OrderStatus } from '@/types'
import { Megaphone, Save, RotateCcw, Film, Upload, Trash2, Link, Check, Plus, AlertCircle, Play } from 'lucide-react'
import { toast } from 'sonner'

interface TVOrdersControlViewProps {
  tenantId?: string
}

export default function TVOrdersControlView({ tenantId }: TVOrdersControlViewProps) {
  const { authFetch } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [marqueeText, setMarqueeText] = useState('')
  const [showMarqueeEditor, setShowMarqueeEditor] = useState(false)

  // Estados do Gestor de Vídeos da TV
  const [showVideosManager, setShowVideosManager] = useState(false)
  const [storeVideos, setStoreVideos] = useState<TVVideoItem[]>([])
  const [videoInputMode, setVideoInputMode] = useState<'FILE' | 'URL'>('FILE')
  const [videoUrlInput, setVideoUrlInput] = useState('')
  const [videoTitleInput, setVideoTitleInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storeSlug = tenantId === '22222222-2222-2222-2222-222222222222' 
    ? 'torres-novas' 
    : 'aveiro'

  const storeTitle = tenantId === '22222222-2222-2222-2222-222222222222' 
    ? 'Filial Torres Novas' 
    : 'Matriz Aveiro'

  useEffect(() => {
    setMarqueeText(getCustomTVMarquee())
    setStoreVideos(getStoreTVVideos(tenantId))
  }, [tenantId])

  const handleSaveMarquee = () => {
    broadcastTVMarquee(marqueeText.trim())
    toast.success('Mensagem do rodapé da TV atualizada com sucesso!')
  }

  const handleResetMarquee = () => {
    setMarqueeText('')
    broadcastTVMarquee('')
    toast.success('Rodapé restaurado para o modo automático (Últimos Pedidos Finalizados)!')
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
      const res = await authFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar pedido')
      
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
    
    broadcastTVCall({
      ticket,
      customerName: order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'),
      status: 'READY',
    })

    if (audioEnabled) {
      announceTVCall(ticket, order.customerName || '')
    }

    updateStatus(order.id, 'READY')
    toast.success(`Senha ${ticket} chamada na TV!`)
  }

  const handleReCall = (order: Order) => {
    const ticket = `#${String(order.orderNumber || 1).padStart(3, '0')}`
    broadcastTVCall({
      ticket,
      customerName: order.customerName || (order.tableNumber ? `Mesa ${order.tableNumber}` : 'Balcão'),
      status: 'READY',
    })

    if (audioEnabled) {
      announceTVCall(ticket, order.customerName || '')
    }

    toast.info(`Senha ${ticket} re-chamada na TV!`)
  }

  const handleDeliver = (order: Order) => {
    updateStatus(order.id, 'COMPLETED')
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

  // Estado para chamada manual de senha
  const [showCallModal, setShowCallModal] = useState(false)
  const [manualTicket, setManualTicket] = useState('')
  const [manualClient, setManualClient] = useState('')

  const handleManualCall = () => {
    if (!manualTicket.trim()) {
      toast.error('Informe o número da senha (ex: 005 ou 5)')
      return
    }

    const ticketFormatted = `#${manualTicket.trim().replace('#', '').padStart(3, '0')}`
    const clientFormatted = manualClient.trim() || 'Balcão'

    broadcastTVCall({
      ticket: ticketFormatted,
      customerName: clientFormatted,
      status: 'READY',
    })

    if (audioEnabled) {
      announceTVCall(ticketFormatted, clientFormatted)
    }

    toast.success(`Senha ${ticketFormatted} (${clientFormatted}) chamada na Smart TV!`)
    setManualTicket('')
    setManualClient('')
    setShowCallModal(false)
  }

  return (
    <div className="space-y-4">
      {/* Header Minimalista Padrão das Outras Páginas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-base sm:text-lg font-black text-purple-950 dark:text-white tracking-tight">
            Configuração Painel de Senha
          </h1>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
            Configure os vídeos gastronômicos, comunicados e chamada da TV de senhas ({storeTitle})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão de Destaque Primário: Chamar Senha */}
          <Button
            type="button"
            onClick={() => {
              setShowCallModal(!showCallModal)
              if (showVideosManager) setShowVideosManager(false)
              if (showMarqueeEditor) setShowMarqueeEditor(false)
            }}
            className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black bg-pink-600 hover:bg-pink-700 text-white cursor-pointer shadow-sm gap-1.5 transition-all"
          >
            <Megaphone className="h-3.5 w-3.5" />
            <span>Chamar Senha</span>
          </Button>

          {/* Vídeos TV */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowVideosManager(!showVideosManager)
              if (showMarqueeEditor) setShowMarqueeEditor(false)
              if (showCallModal) setShowCallModal(false)
            }}
            className={`h-8 sm:h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-purple-200 dark:border-white/15 ${
              showVideosManager ? 'bg-purple-100 dark:bg-white/15 text-purple-950 dark:text-white font-black' : ''
            }`}
          >
            <Film className="h-3.5 w-3.5 mr-1" />
            <span>Vídeos TV 🎥</span>
          </Button>

          {/* Marquee */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowMarqueeEditor(!showMarqueeEditor)
              if (showVideosManager) setShowVideosManager(false)
              if (showCallModal) setShowCallModal(false)
            }}
            className={`h-8 sm:h-9 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-purple-200 dark:border-white/15 ${
              showMarqueeEditor ? 'bg-purple-100 dark:bg-white/15 text-purple-950 dark:text-white font-black' : ''
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 mr-1" />
            <span>Editar Marquee</span>
          </Button>

          {/* Áudio Local */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const next = !audioEnabled
              setAudioEnabled(next)
              if (next) announceTVCall('Teste', 'Açaí da Rose')
            }}
            className={`h-8 sm:h-9 px-3 rounded-xl text-xs font-bold border-purple-200 dark:border-white/15 transition-all cursor-pointer ${
              audioEnabled ? 'bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 border-pink-300' : ''
            }`}
          >
            <span>{audioEnabled ? 'Áudio Ativo' : 'Ativar Áudio'}</span>
          </Button>

          {/* Abrir Tela Cheia TV */}
          <Button
            type="button"
            onClick={() => {
              const origin = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://acaidarose.vercel.app'
              window.open(`${origin}/tv/${storeSlug}`, '_blank')
            }}
            className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm cursor-pointer transition-all"
          >
            <span>Abrir Tela de TV (Tela Cheia)</span>
          </Button>
        </div>
      </div>

      {/* PAINEL DE CHAMADA MANUAL DE SENHA */}
      {showCallModal && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-pink-200 dark:border-pink-900/40 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-purple-100 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
              <Megaphone className="h-4 w-4 text-pink-600" />
              <span>Chamar Senha Avulsa na Smart TV</span>
            </div>
            <span className="text-xs text-pink-600 dark:text-pink-400 font-bold">
              Chamada Instantânea com Voz e Destaque
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-1/4">
              <Input
                value={manualTicket}
                onChange={(e) => setManualTicket(e.target.value)}
                placeholder="Nº Senha (ex: 005)"
                className="h-10 text-xs font-mono font-black bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
              />
            </div>
            <div className="w-full sm:flex-1">
              <Input
                value={manualClient}
                onChange={(e) => setManualClient(e.target.value)}
                placeholder="Nome do Cliente ou Mesa (ex: Henrique ou Mesa 04)"
                className="h-10 text-xs bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
              />
            </div>
            <Button
              type="button"
              onClick={handleManualCall}
              className="w-full sm:w-auto h-10 px-6 bg-pink-600 hover:bg-pink-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm shrink-0 gap-1.5"
            >
              <Megaphone className="h-4 w-4" />
              <span>Tocar & Chamar na TV 🔔</span>
            </Button>
          </div>
        </div>
      )}

      {/* PAINEL DE GESTÃO DE VÍDEOS DA SMART TV */}
      {showVideosManager && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-purple-950 dark:text-white uppercase tracking-wider">
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
          <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
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
          <div className="p-4 rounded-2xl bg-purple-50/30 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3">
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
              /* Dropzone de Upload */
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
              /* Formulário por URL */
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

                  <div className="flex items-center justify-between pt-1 border-t border-purple-100 dark:border-white/10">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleToggleVideoActive(video.id)}
                      className={`h-7 px-2.5 text-[10px] font-black uppercase rounded-lg cursor-pointer transition ${
                        video.active
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {video.active ? 'Pausar' : 'Ativar na TV'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteVideo(video.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
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

      {/* Caixa de Edição do Marquee */}
      {showMarqueeEditor && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider">
              <Megaphone className="h-4 w-4 text-pink-600" />
              <span>Configurar Mensagem do Rodapé (Marquee)</span>
            </div>
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
      )}

      {/* Colunas dos Pedidos (Em Preparação & Pronto para Retirar) */}
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

          <div className="space-y-3 min-h-[220px]">
            {preparingOrders.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-bold">
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

          <div className="space-y-3 min-h-[220px]">
            {readyOrders.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-bold">
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
  )
}
