'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Edit2, Trash2, Upload, Link2, Eye, Play, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/formatters'
import SafeDeleteDialog from '@/components/admin/common/SafeDeleteDialog'
import { useHighlightsStore, HighlightItem } from '@/lib/stores/highlightsStore'

interface MenuHighlightsAdminProps {
  tenantId: string
}

const TAG_COLOR_OPTIONS = [
  { id: 'bg-pink-600', name: 'Rosa Vibrante', class: 'bg-pink-600 text-white' },
  { id: 'bg-fuchsia-600', name: 'Fúcsia Imperial', class: 'bg-fuchsia-600 text-white' },
  { id: 'bg-purple-600', name: 'Roxo Açaí', class: 'bg-purple-600 text-white' },
  { id: 'bg-emerald-600', name: 'Verde Esmeralda', class: 'bg-emerald-600 text-white' },
  { id: 'bg-amber-600', name: 'Dourado / Âmbar', class: 'bg-amber-600 text-white' },
]

export default function MenuHighlightsAdmin({ tenantId }: MenuHighlightsAdminProps) {
  const { highlights, addHighlight, updateHighlight, deleteHighlight, toggleActive } = useHighlightsStore()

  // Dialog de Criação / Edição
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HighlightItem | null>(null)
  const [mediaMode, setMediaMode] = useState<'UPLOAD' | 'URL'>('URL')
  const [uploadFileName, setUploadFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badgeLabel: 'MAIS PEDIDO',
    badgeColor: 'bg-pink-600',
    price: 9.90,
    imageUrl: '',
    videoUrl: '',
    mediaType: 'IMAGE' as 'VIDEO' | 'IMAGE',
    active: true,
    displayOrder: 1,
  })

  // Dialog de Exclusão Segura
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<HighlightItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const handleOpenNew = () => {
    setEditingItem(null)
    setUploadFileName('')
    setFormData({
      title: '',
      subtitle: '',
      badgeLabel: 'MAIS PEDIDO',
      badgeColor: 'bg-pink-600',
      price: 9.90,
      imageUrl: '/images/official/acai_copo_500g.jpg',
      videoUrl: '',
      mediaType: 'IMAGE',
      active: true,
      displayOrder: highlights.length + 1,
    })
    setMediaMode('URL')
    setEditOpen(true)
  }

  const handleOpenEdit = (item: HighlightItem) => {
    setEditingItem(item)
    setUploadFileName('')
    setFormData({
      title: item.title,
      subtitle: item.subtitle,
      badgeLabel: item.badgeLabel,
      badgeColor: item.badgeColor || 'bg-pink-600',
      price: item.price,
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      mediaType: item.videoUrl ? 'VIDEO' : 'IMAGE',
      active: item.active,
      displayOrder: item.displayOrder,
    })
    setMediaMode(item.imageUrl?.startsWith('data:') || item.videoUrl?.startsWith('data:') ? 'UPLOAD' : 'URL')
    setEditOpen(true)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFileName(file.name)
    const isVideo = file.type.startsWith('video/')
    const reader = new FileReader()

    reader.onload = (event) => {
      const result = event.target?.result as string
      if (isVideo) {
        setFormData((prev) => ({
          ...prev,
          videoUrl: result,
          mediaType: 'VIDEO',
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          imageUrl: result,
          videoUrl: '',
          mediaType: 'IMAGE',
        }))
      }
      toast.success(`Arquivo "${file.name}" carregado com sucesso!`)
    }

    reader.readAsDataURL(file)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Informe o título do destaque')
      return
    }

    const payload: Partial<HighlightItem> = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      badgeLabel: formData.badgeLabel.trim() || 'DESTAQUE',
      badgeColor: formData.badgeColor || 'bg-pink-600',
      price: Number(formData.price) || 0,
      imageUrl: formData.imageUrl.trim() || '/images/official/acai_copo_500g.jpg',
      videoUrl: formData.videoUrl.trim() || undefined,
      mediaType: formData.videoUrl?.trim() ? 'VIDEO' : 'IMAGE',
      active: formData.active,
      displayOrder: Number(formData.displayOrder) || 1,
    }

    if (editingItem) {
      updateHighlight(editingItem.id, payload)
      toast.success(`Destaque "${formData.title}" atualizado e publicado no Cardápio Visual!`)
    } else {
      const newH: HighlightItem = {
        id: `hl-${Date.now()}`,
        title: payload.title!,
        subtitle: payload.subtitle!,
        badgeLabel: payload.badgeLabel!,
        badgeColor: payload.badgeColor!,
        price: payload.price!,
        imageUrl: payload.imageUrl!,
        videoUrl: payload.videoUrl,
        mediaType: payload.mediaType,
        active: payload.active!,
        displayOrder: payload.displayOrder!,
      }
      addHighlight(newH)
      toast.success(`Destaque "${formData.title}" criado e publicado no Cardápio Visual!`)
    }
    setEditOpen(false)
  }

  const handleToggleActive = (h: HighlightItem) => {
    toggleActive(h.id)
    toast.success(h.active ? 'Destaque pausado no cardápio' : 'Destaque ativado no cardápio!')
  }

  const handleOpenDelete = (h: HighlightItem) => {
    setDeletingItem(h)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setDeletingLoading(true)
    try {
      deleteHighlight(deletingItem.id)
      toast.success(`Destaque "${deletingItem.title}" removido com sucesso!`)
      setDeleteOpen(false)
    } finally {
      setDeletingLoading(false)
      setDeletingItem(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Oficial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#18022b]/95 p-5 rounded-3xl border border-purple-150 dark:border-white/10 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight">
            Destaques & Stories
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-semibold mt-0.5">
            Gerencie as taças, açaís e campanhas promovidas no carrossel de topo do cardápio visual e nos QR Codes.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="h-10 px-5 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-700/20 cursor-pointer shrink-0"
        >
          + Novo Destaque
        </Button>
      </div>

      {/* Grid de Destaques Cadastrados */}
      {highlights.length === 0 ? (
        <div className="bg-white dark:bg-[#18022b]/95 border border-dashed border-purple-200 dark:border-white/15 rounded-3xl p-12 text-center">
          <p className="text-sm font-bold text-purple-950 dark:text-white">Nenhum destaque cadastrado</p>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/70 mt-1">
            Clique em "+ Novo Destaque" para adicionar uma promoção ou story ao topo do cardápio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {highlights
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#18022b]/95 border border-purple-150 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                {/* Mídia do Card (Vídeo em loop ou Imagem) */}
                <div className="relative h-48 w-full bg-purple-950/40 overflow-hidden">
                  {item.videoUrl ? (
                    <video
                      src={item.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={item.imageUrl || '/images/official/acai_copo_500g.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Tag do Destaque */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md ${
                        item.badgeColor || 'bg-pink-600'
                      } text-white tracking-wider`}
                    >
                      {item.badgeLabel}
                    </span>
                  </div>

                  {/* Preço em Destaque */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-white font-mono font-black text-sm">
                    {formatCurrency(item.price)}
                  </div>
                </div>

                {/* Conteúdo Textual */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="font-extrabold text-sm text-purple-950 dark:text-white leading-tight">
                      {item.title}
                    </h2>
                    <p className="text-xs text-purple-700/80 dark:text-purple-300/70 font-medium line-clamp-2 mt-1">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Barra de Ações & Status */}
                  <div className="pt-3 border-t border-purple-100 dark:border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition cursor-pointer ${
                        item.active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-400 border border-zinc-200 dark:border-white/10'
                      }`}
                    >
                      {item.active ? '● Ativo no Menu' : '○ Pausado'}
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(item)}
                        className="h-8 w-8 p-0 rounded-xl hover:bg-purple-100 dark:hover:bg-white/10 text-purple-700 dark:text-pink-300 cursor-pointer"
                        title="Editar Destaque"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDelete(item)}
                        className="h-8 w-8 p-0 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer"
                        title="Remover Destaque"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#18022b] text-slate-900 dark:text-white border-purple-150 dark:border-white/15 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-purple-950 dark:text-white">
              {editingItem ? 'Editar Destaque & Story' : 'Novo Destaque & Story'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* 1. Título & Subtítulo */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Título do Destaque *
                </Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Açaí 500g da Rose ou Taça Suprema"
                  className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Descrição / Subtítulo
                </Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ex: Frutas frescas à vontade, cremosidade artesanal e acompanhamentos livres"
                  className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1"
                />
              </div>
            </div>

            {/* 2. Gerenciamento de Tags (Texto + Cores) */}
            <div className="p-3.5 bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-purple-950 dark:text-white">
                  Gerenciamento de Tags / Selos
                </Label>
                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                  Exibido sobre o banner
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                    Texto da Tag
                  </Label>
                  <Input
                    value={formData.badgeLabel}
                    onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })}
                    placeholder="Ex: MAIS PEDIDO, REFRESCANTE..."
                    className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-bold uppercase"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                    Cor da Tag
                  </Label>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {TAG_COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, badgeColor: opt.id })}
                        className={`h-7 w-7 rounded-xl ${opt.class} flex items-center justify-center text-xs font-black shadow-xs transition-transform cursor-pointer ${
                          formData.badgeColor === opt.id ? 'ring-2 ring-purple-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={opt.name}
                      >
                        ✓
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Seletor de Mídia: Upload ou URL */}
            <div className="p-3.5 bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black text-purple-950 dark:text-white">
                  Mídia do Destaque (Vídeo ou Imagem)
                </Label>

                {/* Abas de Seleção: Upload vs URL */}
                <div className="flex items-center gap-1 bg-purple-100 dark:bg-white/10 p-0.5 rounded-xl text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMediaMode('UPLOAD')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      mediaMode === 'UPLOAD'
                        ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                        : 'text-purple-900 dark:text-purple-200'
                    }`}
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaMode('URL')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      mediaMode === 'URL'
                        ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                        : 'text-purple-900 dark:text-purple-200'
                    }`}
                  >
                    <Link2 className="h-3 w-3" />
                    <span>Link / URL</span>
                  </button>
                </div>
              </div>

              {mediaMode === 'UPLOAD' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 dark:border-white/20 rounded-2xl p-4 text-center cursor-pointer hover:bg-purple-100/50 dark:hover:bg-white/5 transition"
                  >
                    <Upload className="h-6 w-6 text-purple-600 dark:text-pink-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-purple-950 dark:text-white">
                      {uploadFileName || 'Clique para selecionar Vídeo (.mp4) ou Imagem (.jpg, .png)'}
                    </p>
                    <p className="text-[10px] text-purple-700 dark:text-purple-300/70 mt-0.5">
                      Suporte a arquivos diretos do computador ou telemóvel
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                      URL da Imagem
                    </Label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Ex: /images/official/acai_copo_500g.jpg ou https://..."
                      className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                      URL do Vídeo (Opcional - Reproduz em Loop)
                    </Label>
                    <Input
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="Ex: /videos/hero_cup_rotation.mp4 ou https://..."
                      className="h-9 text-xs rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Preço & Ordem de Exibição */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Preço Especial (€) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  Ordem de Exibição
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  className="h-10 text-xs rounded-xl bg-purple-50/40 dark:bg-white/5 border-purple-200 dark:border-white/15 mt-1 font-mono font-bold"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`h-10 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.active
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-300 dark:bg-white/10 dark:text-zinc-300'
                  }`}
                >
                  <span>{formData.active ? '● Ativo no Menu' : '○ Pausado'}</span>
                </button>
              </div>
            </div>

            {/* 5. Pré-visualização em Tempo Real */}
            <div className="p-3 bg-purple-950 rounded-2xl text-white space-y-2 border border-purple-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-pink-400" />
                  <span>Pré-visualização do Banner</span>
                </span>
                <span className="text-[10px] uppercase">{formData.badgeLabel}</span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {formData.title || 'Título do Destaque'}
                  </div>
                  <div className="text-[11px] text-purple-200/80 line-clamp-1">
                    {formData.subtitle || 'Descrição do açaí ou taça'}
                  </div>
                  <div className="text-base font-black text-pink-300 font-mono mt-1">
                    {formatCurrency(Number(formData.price) || 0)}
                  </div>
                </div>

                <div className="h-16 w-16 rounded-xl bg-purple-900 overflow-hidden shrink-0 border border-white/20">
                  {formData.videoUrl ? (
                    <video
                      src={formData.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={formData.imageUrl || '/images/official/acai_copo_500g.jpg'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-10 px-4 rounded-xl border-purple-200 dark:border-white/15 cursor-pointer text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 text-white cursor-pointer text-xs font-black shadow-md"
              >
                Salvar Destaque
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão Segura */}
      <SafeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover Destaque & Story"
        description="Tem a certeza de que deseja remover este destaque do cardápio? Esta ação é definitiva."
        itemName={deletingItem?.title}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
      />
    </div>
  )
}
