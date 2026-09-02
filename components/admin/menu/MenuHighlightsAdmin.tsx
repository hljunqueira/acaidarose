'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  GripVertical,
  Plus,
  Filter,
  RefreshCw,
  Edit2,
  Clock,
  Trash2,
  HelpCircle,
  Upload,
  Link2,
  Play,
  Search,
  Check,
} from 'lucide-react'
import SafeDeleteDialog from '@/components/admin/common/SafeDeleteDialog'
import type { HighlightItem } from '@/types/highlights'
import type { ProductContainer } from '@/types'

interface MenuHighlightsAdminProps {
  tenantId: string
}

const DAYS_OF_WEEK = [
  { day: 0, label: 'Dom' },
  { day: 1, label: 'Seg' },
  { day: 2, label: 'Ter' },
  { day: 3, label: 'Qua' },
  { day: 4, label: 'Qui' },
  { day: 5, label: 'Sex' },
  { day: 6, label: 'Sáb' },
]

export default function MenuHighlightsAdmin({ tenantId }: MenuHighlightsAdminProps) {
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [products, setProducts] = useState<ProductContainer[]>([])
  const [loading, setLoading] = useState(true)
  const [replicatingId, setReplicatingId] = useState<string | null>(null)

  // Filtros
  const [showFilter, setShowFilter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Carrega destaques reais do PostgreSQL
  const fetchHighlights = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/highlights?tenantId=${encodeURIComponent(tenantId)}&admin=true`)
      const data = await res.json()
      if (Array.isArray(data.highlights)) {
        setHighlights(data.highlights)
      }
    } catch {
      toast.error('Erro ao carregar destaques')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  // Carrega produtos do catálogo para vincular no dropdown "Item:"
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/products?loja=${encodeURIComponent(tenantId)}`)
      const data = await res.json()
      if (Array.isArray(data.containers)) {
        setProducts(data.containers)
      }
    } catch {
      // Ignora erro se falhar carregamento de produtos
    }
  }, [tenantId])

  useEffect(() => {
    fetchHighlights()
    fetchProducts()
  }, [fetchHighlights, fetchProducts])

  // Modal: Editar / Criar Destaque (Conforme layout da imagem do usuário)
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HighlightItem | null>(null)
  const [mediaMode, setMediaMode] = useState<'URL' | 'UPLOAD'>('URL')
  const [uploadFileName, setUploadFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    linkedProductId: '',
    badgeLabel: 'DESTAQUE',
    badgeColor: 'bg-pink-600',
    price: 0,
    imageUrl: '',
    videoUrl: '',
    active: true,
    isProActive: false,
    displayOrder: 1,
  })

  // Modal: Horários Ativos do Destaque (Conforme layout da imagem 5)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [schedulingItem, setSchedulingItem] = useState<HighlightItem | null>(null)
  const [hasCustomHours, setHasCustomHours] = useState(false)
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [scheduleStartTime, setScheduleStartTime] = useState('00:00')
  const [scheduleEndTime, setScheduleEndTime] = useState('23:59')
  const [savingSchedule, setSavingSchedule] = useState(false)

  // Modal: Exclusão Segura
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<HighlightItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  // Abrir Modal de Novo Destaque
  const handleOpenNew = () => {
    setEditingItem(null)
    setUploadFileName('')
    setFormData({
      title: '',
      subtitle: '',
      linkedProductId: '',
      badgeLabel: 'DESTAQUE',
      badgeColor: 'bg-pink-600',
      price: 0,
      imageUrl: '/images/official/acai_copo_500g.jpg',
      videoUrl: '',
      active: true,
      isProActive: false,
      displayOrder: highlights.length + 1,
    })
    setMediaMode('URL')
    setEditOpen(true)
  }

  // Abrir Modal de Edição (layout "Editar Destaque" da imagem)
  const handleOpenEdit = (item: HighlightItem) => {
    setEditingItem(item)
    setUploadFileName('')
    setFormData({
      title: item.title,
      subtitle: item.subtitle || '',
      linkedProductId: (item as any).linked_product_id || '',
      badgeLabel: item.badgeLabel || 'DESTAQUE',
      badgeColor: item.badgeColor || 'bg-pink-600',
      price: item.price || 0,
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      active: item.active,
      isProActive: false,
      displayOrder: item.displayOrder,
    })
    setMediaMode('URL')
    setEditOpen(true)
  }

  // Ao selecionar um produto no dropdown "Item:"
  const handleProductSelect = (productId: string) => {
    const p = products.find((prod) => prod.id === productId)
    if (p) {
      setFormData((prev) => ({
        ...prev,
        linkedProductId: p.id,
        title: prev.title.trim() ? prev.title : p.name,
        subtitle: prev.subtitle.trim() ? prev.subtitle : (p.description || ''),
        price: prev.price > 0 ? prev.price : (p.price || 0),
        imageUrl: prev.imageUrl ? prev.imageUrl : (p.image || '/images/official/acai_copo_500g.jpg'),
      }))
    } else {
      setFormData((prev) => ({ ...prev, linkedProductId: '' }))
    }
  }

  // Upload de arquivo local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFileName(file.name)
    const isVideo = file.type.startsWith('video/')
    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result as string
      if (isVideo) {
        setFormData((prev) => ({ ...prev, videoUrl: result }))
      } else {
        setFormData((prev) => ({ ...prev, imageUrl: result, videoUrl: '' }))
      }
      toast.success(`Mídia "${file.name}" carregada com sucesso!`)
    }

    reader.readAsDataURL(file)
  }

  // Salvar Destaque (Novo ou Editado)
  const handleSaveHighlight = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Informe o título do destaque')
      return
    }

    try {
      const payload = {
        tenantId,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        linkedProductId: formData.linkedProductId || null,
        badgeLabel: formData.badgeLabel || 'DESTAQUE',
        badgeColor: formData.badgeColor || 'bg-pink-600',
        price: Number(formData.price) || 0,
        imageUrl: formData.imageUrl || '/images/official/acai_copo_500g.jpg',
        videoUrl: formData.videoUrl || null,
        active: formData.active,
        displayOrder: formData.displayOrder,
      }

      if (editingItem) {
        const res = await fetch('/api/highlights', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
        if (!res.ok) throw new Error('Falha ao atualizar destaque')
        toast.success('Destaque atualizado com sucesso!')
      } else {
        const res = await fetch('/api/highlights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Falha ao criar destaque')
        toast.success('Destaque cadastrado com sucesso!')
      }

      setEditOpen(false)
      fetchHighlights()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar destaque')
    }
  }

  // Toggle rápido de Visibilidade (Visível / Oculto)
  const handleToggleActive = async (item: HighlightItem) => {
    const nextActive = !item.active
    setHighlights((prev) => prev.map((h) => (h.id === item.id ? { ...h, active: nextActive } : h)))

    try {
      const res = await fetch('/api/highlights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: nextActive }),
      })
      if (!res.ok) throw new Error('Erro ao alterar status')
      toast.success(nextActive ? 'Destaque agora está Visível!' : 'Destaque ocultado.')
    } catch {
      setHighlights((prev) => prev.map((h) => (h.id === item.id ? { ...h, active: item.active } : h)))
      toast.error('Erro ao atualizar status do destaque')
    }
  }

  // Abrir Modal de Horários Ativos
  const handleOpenSchedule = (item: HighlightItem) => {
    setSchedulingItem(item)
    const ah = item.availableHours
    if (ah && typeof ah === 'object' && Array.isArray(ah.days)) {
      setHasCustomHours(true)
      setScheduleDays(ah.days)
      setScheduleStartTime(ah.startTime || '00:00')
      setScheduleEndTime(ah.endTime || '23:59')
    } else {
      setHasCustomHours(false)
      setScheduleDays([0, 1, 2, 3, 4, 5, 6])
      setScheduleStartTime('00:00')
      setScheduleEndTime('23:59')
    }
    setScheduleModalOpen(true)
  }

  // Salvar Horários Ativos
  const handleSaveSchedule = async () => {
    if (!schedulingItem) return
    setSavingSchedule(true)
    try {
      const availableHoursPayload = hasCustomHours
        ? {
            days: scheduleDays,
            startTime: scheduleStartTime,
            endTime: scheduleEndTime,
          }
        : null

      const res = await fetch('/api/highlights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: schedulingItem.id,
          availableHours: availableHoursPayload,
        }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar horários')
      toast.success('Horários ativos atualizados!')
      setScheduleModalOpen(false)
      fetchHighlights()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar horários')
    } finally {
      setSavingSchedule(false)
    }
  }

  // Replicar Destaque para Filial (Ação ⟳)
  const handleReplicateSingle = async (item: HighlightItem) => {
    setReplicatingId(item.id)
    try {
      const res = await fetch('/api/highlights/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceTenantId: tenantId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na replicação')
      toast.success(`Destaques replicados com sucesso para ${data.totalStores - 1} filial(is)!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao replicar filial')
    } finally {
      setReplicatingId(null)
    }
  }

  // Excluir Destaque
  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setDeletingLoading(true)
    try {
      const res = await fetch(`/api/highlights?id=${encodeURIComponent(deletingItem.id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao excluir')
      toast.success('Destaque excluído com sucesso!')
      setDeleteOpen(false)
      fetchHighlights()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover destaque')
    } finally {
      setDeletingLoading(false)
    }
  }

  // Filtragem dos Destaques na Lista
  const filteredHighlights = highlights
    .filter((item) => {
      if (statusFilter === 'ACTIVE') return item.active
      if (statusFilter === 'INACTIVE') return !item.active
      return true
    })
    .filter((item) => {
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      return item.title.toLowerCase().includes(term) || (item.subtitle || '').toLowerCase().includes(term)
    })
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="space-y-4">
      {/* 1. CABEÇALHO (Conforme Layout Imagem 3 da Referência) */}
      <div className="flex items-center justify-between gap-4 py-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
          Destaques
        </h1>

        <div className="flex items-center gap-2.5">
          {/* Botão Verde: + Adicionar Novo Destaque */}
          <button
            type="button"
            onClick={handleOpenNew}
            className="h-9 px-4 rounded-md bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Novo Destaque</span>
          </button>

          {/* Botão Filtro */}
          <button
            type="button"
            onClick={() => setShowFilter((prev) => !prev)}
            className={`h-9 px-3.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              showFilter
                ? 'bg-slate-100 dark:bg-white/15 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white'
                : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10'
            }`}
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>Filtro</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro Expansível */}
      {showFilter && (
        <div className="bg-slate-50 dark:bg-white/5 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="h-9 pl-9 text-xs bg-white dark:bg-white/5 border-slate-300 dark:border-white/15"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === mode
                    ? 'bg-[#059669] text-white'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                }`}
              >
                {mode === 'ALL' ? 'Todos' : mode === 'ACTIVE' ? 'Visíveis' : 'Ocultos'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. LISTA DE DESTAQUES (Cards em Linha Horizontal Conforme Imagem 3) */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Carregando destaques do banco de dados...</div>
      ) : filteredHighlights.length === 0 ? (
        <div className="bg-white dark:bg-[#18022b]/95 border border-dashed border-slate-300 dark:border-white/15 rounded-2xl p-12 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-white">Nenhum destaque cadastrado</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clique no botão verde <strong>Adicionar Novo Destaque</strong> acima para criar um item no cardápio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHighlights.map((item) => {
            const hasHours = Boolean(item.availableHours && item.availableHours.days)
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#18022b]/95 border border-slate-200/90 dark:border-white/10 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all group"
              >
                {/* Esquerda: Drag Handle + Imagem + Título */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Drag Handle */}
                  <div className="text-slate-400 hover:text-slate-600 cursor-grab shrink-0">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Thumbnail do Banner */}
                  <div className="relative w-28 sm:w-36 h-18 sm:h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/5 shrink-0 border border-slate-200 dark:border-white/10">
                    {item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.imageUrl || '/images/official/acai_copo_500g.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {item.videoUrl && (
                      <div className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-full text-white">
                        <Play className="h-2.5 w-2.5 fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Nome e Descrição */}
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.subtitle}
                      </p>
                    )}
                    {item.price ? (
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        € {Number(item.price).toFixed(2).replace('.', ',')}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Centro: Tag de Horários Ativos */}
                <div className="text-center sm:text-left shrink-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {hasHours
                      ? `${item.availableHours.startTime || '00:00'} - ${item.availableHours.endTime || '23:59'}`
                      : 'Sempre ativo'}
                  </span>
                </div>

                {/* Direita: Status Badge + Grupo de 4 Ações */}
                <div className="flex items-center justify-end gap-3 shrink-0">
                  {/* Status Badge Verde (Visível / Oculto) */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      item.active
                        ? 'bg-[#059669] hover:bg-[#047857] text-white shadow-xs'
                        : 'bg-slate-400 hover:bg-slate-500 text-white'
                    }`}
                    title={item.active ? 'Clique para ocultar' : 'Clique para tornar visível'}
                  >
                    {item.active ? 'Visível' : 'Oculto'}
                  </button>

                  {/* Grupo Segmentado de Botões de Ação (Conforme Imagens 3, 4 e 5) */}
                  <div className="inline-flex rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 shadow-xs overflow-hidden divide-x divide-slate-300 dark:divide-white/15">
                    {/* Botão 1: Replicar Filial (⟳) */}
                    <div className="relative group/tooltip">
                      <button
                        type="button"
                        onClick={() => handleReplicateSingle(item)}
                        disabled={replicatingId === item.id}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition"
                        aria-label="Replicar filial"
                      >
                        <RefreshCw className={`h-4 w-4 ${replicatingId === item.id ? 'animate-spin' : ''}`} />
                      </button>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:flex flex-col items-center z-30">
                        <span className="whitespace-nowrap rounded bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 shadow-md">
                          Replicar filial
                        </span>
                        <span className="border-solid border-t-slate-800 border-t-4 border-x-transparent border-x-4 border-b-0" />
                      </div>
                    </div>

                    {/* Botão 2: Editar (✎) */}
                    <div className="relative group/tooltip">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition"
                        aria-label="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:flex flex-col items-center z-30">
                        <span className="whitespace-nowrap rounded bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 shadow-md">
                          Editar
                        </span>
                        <span className="border-solid border-t-slate-800 border-t-4 border-x-transparent border-x-4 border-b-0" />
                      </div>
                    </div>

                    {/* Botão 3: Horários Ativos do Destaque (🕒) */}
                    <div className="relative group/tooltip">
                      <button
                        type="button"
                        onClick={() => handleOpenSchedule(item)}
                        className={`p-2 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition ${
                          hasHours ? 'text-[#059669]' : 'text-slate-600 dark:text-slate-300'
                        }`}
                        aria-label="Horários ativos do destaque"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:flex flex-col items-center z-30">
                        <span className="whitespace-nowrap rounded bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 shadow-md">
                          Horários ativos do destaque
                        </span>
                        <span className="border-solid border-t-slate-800 border-t-4 border-x-transparent border-x-4 border-b-0" />
                      </div>
                    </div>

                    {/* Botão 4: Excluir (🗑) */}
                    <div className="relative group/tooltip">
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingItem(item)
                          setDeleteOpen(true)
                        }}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:flex flex-col items-center z-30">
                        <span className="whitespace-nowrap rounded bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 shadow-md">
                          Excluir
                        </span>
                        <span className="border-solid border-t-slate-800 border-t-4 border-x-transparent border-x-4 border-b-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 3. DIALOG: EDITAR / NOVO DESTAQUE (Espelhado com exatidão da imagem enviada) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#18022b] text-slate-900 dark:text-white p-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl">
          {/* Cabeçalho Limpo */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {editingItem ? 'Editar Destaque' : 'Novo Destaque'}
            </h2>
          </div>

          <form onSubmit={handleSaveHighlight} className="p-6 space-y-5">
            {/* Campo 1: Foto */}
            <div className="flex items-start gap-4">
              <div className="w-24 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 pt-2 shrink-0">
                <span>Foto:</span>
                <span title="Imagem ou banner que será exibido no carrossel superior">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-4">
                  {/* Thumbnail Preview */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-44 h-24 rounded-lg overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 cursor-pointer hover:opacity-90 transition group shadow-xs shrink-0"
                    title="Clique para trocar imagem ou vídeo"
                  >
                    {formData.videoUrl ? (
                      <video src={formData.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={formData.imageUrl || '/images/official/acai_copo_500g.jpg'} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-semibold transition-opacity">
                      Trocar foto
                    </div>
                  </div>

                  {/* Alternar entre Upload e URL */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMediaMode('URL')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          mediaMode === 'URL' ? 'bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-white' : 'text-slate-500'
                        }`}
                      >
                        URL Web
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaMode('UPLOAD')
                          fileInputRef.current?.click()
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          mediaMode === 'UPLOAD' ? 'bg-slate-200 dark:bg-white/15 text-slate-900 dark:text-white' : 'text-slate-500'
                        }`}
                      >
                        Upload Local
                      </button>
                    </div>

                    {mediaMode === 'URL' ? (
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="URL da imagem (ex: /images/official/...)"
                        className="h-9 text-xs rounded-md border-slate-300 dark:border-white/15 font-mono"
                      />
                    ) : (
                      <p className="text-xs text-slate-500 truncate">
                        {uploadFileName || 'Nenhum arquivo selecionado'}
                      </p>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Campo 2: Título (Label Verde conforme print) */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-xs font-bold text-[#059669] shrink-0">
                Título:
              </div>
              <div className="flex-1">
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do Destaque"
                  className="h-10 text-xs rounded-md border-slate-300 dark:border-white/15 focus:border-[#059669]"
                />
              </div>
            </div>

            {/* Campo 3: Descrição */}
            <div className="flex items-start gap-4">
              <div className="w-24 text-xs font-bold text-slate-700 dark:text-slate-300 pt-2 shrink-0">
                Descrição:
              </div>
              <div className="flex-1">
                <textarea
                  rows={3}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Descrição do Destaque"
                  className="w-full p-2.5 text-xs rounded-md border border-slate-300 dark:border-white/15 bg-transparent focus:outline-none focus:border-slate-400 dark:focus:border-white/30 resize-y"
                />
              </div>
            </div>

            {/* Campo 4: Item (Selecione um produto) */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Item:
              </div>
              <div className="flex-1">
                <select
                  value={formData.linkedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-[#18022b] text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="">Selecione um produto (opcional)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — € {Number(p.price || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes: Mostrar como destaque & Pró-ativo */}
            <div className="pl-28 flex flex-wrap items-center gap-8 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Mostrar como destaque
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isProActive}
                  onChange={(e) => setFormData({ ...formData, isProActive: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Pró-ativo
                </span>
                <span title="Exibição em destaque automático no início da navegação do cliente">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </span>
              </label>
            </div>

            {/* Footer do Modal: FECHAR e SALVAR (Botão Azul conforme imagem) */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-5 py-2 rounded text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 cursor-pointer uppercase transition"
              >
                Fechar
              </button>

              <button
                type="submit"
                className="px-6 py-2 rounded text-xs font-bold text-white bg-[#1d70b8] hover:bg-[#155a96] cursor-pointer uppercase shadow-xs transition"
              >
                Salvar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. DIALOG: HORÁRIOS ATIVOS DO DESTAQUE (Modal do ícone 🕒) */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#18022b] text-slate-900 dark:text-white p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#059669]" />
              <span>Horários Ativos do Destaque</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure quando o destaque <strong>"{schedulingItem?.title}"</strong> estará visível no carrossel de topo do cardápio digital (horário oficial de Portugal).
            </p>

            {/* Toggle Horários Específicos */}
            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCustomHours}
                onChange={(e) => setHasCustomHours(e.target.checked)}
                className="h-4 w-4 rounded text-[#059669] focus:ring-[#059669] border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-white">
                Definir horários específicos de disponibilidade
              </span>
            </label>

            {/* Dias da semana e horários */}
            {hasCustomHours && (
              <div className="space-y-3 p-3.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                <div>
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Dias da Semana Ativos
                  </Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {DAYS_OF_WEEK.map(({ day, label }) => {
                      const isSelected = scheduleDays.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setScheduleDays((prev) =>
                              isSelected ? prev.filter((d) => d !== day) : [...prev, day].sort()
                            )
                          }}
                          className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition ${
                            isSelected
                              ? 'bg-[#059669] text-white'
                              : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Horário Inicial
                    </Label>
                    <Input
                      type="time"
                      value={scheduleStartTime}
                      onChange={(e) => setScheduleStartTime(e.target.value)}
                      className="h-9 text-xs rounded-md border-slate-300 dark:border-white/15 mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Horário Final
                    </Label>
                    <Input
                      type="time"
                      value={scheduleEndTime}
                      onChange={(e) => setScheduleEndTime(e.target.value)}
                      className="h-9 text-xs rounded-md border-slate-300 dark:border-white/15 mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 rounded text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 cursor-pointer uppercase transition"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={savingSchedule}
              onClick={handleSaveSchedule}
              className="px-5 py-2 rounded text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] cursor-pointer uppercase shadow-xs transition disabled:opacity-50"
            >
              {savingSchedule ? 'Salvando...' : 'Salvar Horários'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. DIALOG: EXCLUSÃO SEGURA */}
      <SafeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover Destaque"
        description="Tem a certeza de que deseja remover este destaque do cardápio? Esta ação removerá o item do carrossel."
        itemName={deletingItem?.title}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
      />
    </div>
  )
}
