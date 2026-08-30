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

  return (
    <div className="bg-white dark:bg-[#0c0114] text-purple-950 dark:text-white rounded-3xl p-6 border border-purple-100 dark:border-purple-900/40 shadow-xl space-y-6">
      
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-lg font-black uppercase tracking-tight text-purple-900 dark:text-white">
            Painel de Controle da TV de Senhas
          </h1>
          <p className="text-xs text-purple-600 dark:text-purple-300 font-bold uppercase tracking-widest mt-0.5">
            {storeTitle} Operação
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            type="button"
            onClick={() => {
              setShowVideosManager(!showVideosManager)
              if (showMarqueeEditor) setShowMarqueeEditor(false)
            }}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showVideosManager
                ? 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-md'
                : 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/15 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10'
            }`}
          >
            <Film className="h-3.5 w-3.5 mr-1.5" />
            <span>Vídeos TV 🎥</span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setShowMarqueeEditor(!showMarqueeEditor)
              if (showVideosManager) setShowVideosManager(false)
            }}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showMarqueeEditor
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                : 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/15 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10'
            }`}
          >
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            <span>Editar Marquee TV</span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              const next = !audioEnabled
              setAudioEnabled(next)
              if (next) announceTVCall('Teste', 'Açaí da Rose')
            }}
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              audioEnabled
                ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-600/30'
                : 'bg-purple-100 dark:bg-white/10 hover:bg-purple-200 dark:hover:bg-white/15 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-white/10'
            }`}
          >
            <span>{audioEnabled ? 'Áudio Local Ativo (Computador)' : 'Ativar Áudio Local'}</span>
          </Button>
          <Button
            type="button"
            onClick={() => {
              const origin = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://acaidarose.vercel.app'
              window.open(`${origin}/tv/${storeSlug}`, '_blank')
            }}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md shadow-purple-700/20 cursor-pointer transition-all"
          >
            <span>Abrir Tela de TV (Tela Cheia)</span>
          </Button>
        </div>
      </div>

      {/* PAINEL DE GESTÃO DE VÍDEOS DA SMART TV */}
      {showVideosManager && (
        <div className="p-5 rounded-3xl bg-purple-50/70 dark:bg-white/5 border border-purple-200 dark:border-white/15 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-200/60 dark:border-white/10">
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
          <div className="p-3 rounded-2xl bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-purple-950 dark:text-white font-bold">
              <AlertCircle className="h-4 w-4 text-pink-600 shrink-0" />
              <span>Orientações de Resolução & Tamanho:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/60 dark:border-white/10">
                📐 16:9 Widescreen (1920x1080 Full HD)
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/60 dark:border-white/10">
                📦 Máx: 50 MB por vídeo
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-purple-200 font-bold border border-purple-200/60 dark:border-white/10">
                🎬 Formatos: MP4, WebM, MOV
              </span>
            </div>
          </div>

          {/* Área de Inserção: Dropzone Principal com Alternador de URL */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/10 space-y-3">
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
                className="border-2 border-dashed border-purple-200 dark:border-white/20 hover:border-pink-500 dark:hover:border-pink-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-purple-50/30 dark:bg-white/5 hover:bg-purple-50/60 group"
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
                  className="h-10 text-xs w-full sm:w-1/3 bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15"
                />
                <Input
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/video-promocional.mp4"
                  className="h-10 text-xs flex-1 bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15"
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
                      ? 'bg-white dark:bg-[#160228] border-purple-200 dark:border-white/20 shadow-sm'
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
        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
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
              className="h-10 text-xs bg-white dark:bg-[#160228] border-purple-200 dark:border-white/20 text-foreground font-medium"
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

      {loading ? (
        <div className="py-12 text-center text-xs text-purple-600 dark:text-purple-300 font-bold">
          A carregar pedidos ativos...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Coluna 1: Em Preparação */}
          <div className="rounded-2xl border border-purple-100 dark:border-white/10 p-5 bg-purple-50/20 dark:bg-white/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
              <h2 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Em Preparação
              </h2>
              <Badge variant="outline" className="text-amber-600 dark:text-amber-300 border-amber-500/40 text-[10px] font-black">
                {preparingOrders.length} {preparingOrders.length === 1 ? 'pedido' : 'pedidos'}
              </Badge>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-purple-400/50">
                Nenhum pedido em preparação no momento.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {preparingOrders.map((order) => {
                  const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                  const rawName = order.customerName?.trim() || ''
                  const rawTable = order.tableNumber ? String(order.tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
                  const isTable = rawTable !== '' && rawTable.toLowerCase() !== 'balcão' && rawTable.toLowerCase() !== 'balcao'
                  const tableLabel = isTable ? `Mesa ${rawTable.padStart(2, '0')}` : ''
                  const clientName = rawName && tableLabel ? `${rawName} (${tableLabel})` : rawName || tableLabel || 'Balcão'

                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-purple-950/30 border border-purple-100 dark:border-[#2A1E3D] flex items-center justify-between shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-base text-purple-900 dark:text-amber-300">
                          {ticketNum}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-white/80 mt-0.5">
                          {clientName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => handleMarkAsReadyAndCall(order)}
                        className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        Pronto & Chamar
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Coluna 2: Pronto para Retirar */}
          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-5 bg-emerald-50/10 dark:bg-emerald-950/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-500/20">
              <h2 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Pronto para Retirar
              </h2>
              <Badge className="bg-emerald-600 text-white font-black text-[10px]">
                {readyOrders.length} {readyOrders.length === 1 ? 'pedido' : 'pedidos'}
              </Badge>
            </div>

            {readyOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-purple-400/50">
                Nenhum pedido aguardando retirada.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {readyOrders.map((order) => {
                  const ticketNum = `#${String(order.orderNumber || 1).padStart(3, '0')}`
                  const rawName = order.customerName?.trim() || ''
                  const rawTable = order.tableNumber ? String(order.tableNumber).replace(/^Mesa\s*/i, '').trim() : ''
                  const isTable = rawTable !== '' && rawTable.toLowerCase() !== 'balcão' && rawTable.toLowerCase() !== 'balcao'
                  const tableLabel = isTable ? `Mesa ${rawTable.padStart(2, '0')}` : ''
                  const clientName = rawName && tableLabel ? `${rawName} (${tableLabel})` : rawName || tableLabel || 'Balcão'

                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-300">
                          {ticketNum}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-white/80 mt-0.5">
                          {clientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => handleReCall(order)}
                          className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pink-600 hover:bg-pink-700 text-white cursor-pointer"
                        >
                          Chamar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleDeliver(order)}
                          className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-zinc-800 hover:bg-zinc-900 text-white border border-zinc-700 cursor-pointer"
                        >
                          Entregar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
