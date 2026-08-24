'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/formatters'
import SafeDeleteDialog from '@/components/admin/common/SafeDeleteDialog'
import { useHighlightsStore, HighlightItem } from '@/lib/stores/highlightsStore'

interface MenuHighlightsAdminProps {
  tenantId: string
}

export default function MenuHighlightsAdmin({ tenantId }: MenuHighlightsAdminProps) {
  const { highlights, addHighlight, updateHighlight, deleteHighlight } = useHighlightsStore()

  // Dialog de Criação / Edição
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HighlightItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badgeLabel: 'MAIS PEDIDO',
    price: 9.90,
    imageUrl: '',
    active: true,
    displayOrder: 1,
  })

  // Dialog de Exclusão Segura
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<HighlightItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const handleOpenNew = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      subtitle: '',
      badgeLabel: 'MAIS PEDIDO',
      price: 9.90,
      imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80',
      active: true,
      displayOrder: highlights.length + 1,
    })
    setEditOpen(true)
  }

  const handleOpenEdit = (item: HighlightItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      subtitle: item.subtitle,
      badgeLabel: item.badgeLabel,
      price: item.price,
      imageUrl: item.imageUrl,
      active: item.active,
      displayOrder: item.displayOrder,
    })
    setEditOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Informe o título do destaque')
      return
    }

    if (editingItem) {
      updateHighlight(editingItem.id, {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        badgeLabel: formData.badgeLabel.trim(),
        price: Number(formData.price) || 0,
        imageUrl: formData.imageUrl.trim(),
        active: formData.active,
        displayOrder: Number(formData.displayOrder) || 1,
      })
      toast.success(`Destaque "${formData.title}" atualizado e sincronizado com o Cardápio QR Code!`)
    } else {
      const newH: HighlightItem = {
        id: `hl-${Date.now()}`,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        badgeLabel: formData.badgeLabel.trim(),
        badgeColor: 'bg-fuchsia-600',
        price: Number(formData.price) || 0,
        imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop&q=80',
        active: formData.active,
        displayOrder: Number(formData.displayOrder) || highlights.length + 1,
      }
      addHighlight(newH)
      toast.success(`Destaque "${formData.title}" criado e exibido no Cardápio QR Code!`)
    }
    setEditOpen(false)
  }

  const handleToggleActive = (h: HighlightItem) => {
    updateHighlight(h.id, { active: !h.active })
    toast.success(h.active ? 'Destaque pausado no cardápio' : 'Destaque ativado no cardápio QR Code!')
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
      setDeletingItem(null)
    } finally {
      setDeletingLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight">
            Itens em Destaque
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            Configure os açaís promovidos com selos de destaque no topo do cardápio visual e nos QR Codes.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Destaque</span>
        </Button>
      </div>

      {/* Grid de Cards dos Destaques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {highlights.map((h) => (
          <div
            key={h.id}
            className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden flex flex-col justify-between hover:border-purple-400 dark:hover:border-pink-500/50 transition-all text-slate-900 dark:text-white"
          >
            <div>
              {/* Imagem com Selo */}
              <div className="relative h-44 w-full bg-purple-50 dark:bg-black/40 overflow-hidden">
                <img
                  src={h.imageUrl}
                  alt={h.title}
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-3 right-3 ${h.badgeColor || 'bg-purple-700 dark:bg-fuchsia-600'} text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-0 shadow-md`}>
                  {h.badgeLabel}
                </Badge>
              </div>

              {/* Detalhes */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-purple-950 dark:text-white leading-tight">
                    {h.title}
                  </h3>
                  <span className="font-mono font-black text-sm text-purple-950 dark:text-pink-300">
                    {formatCurrency(h.price)}
                  </span>
                </div>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 leading-relaxed line-clamp-2">
                  {h.subtitle}
                </p>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="p-3.5 bg-purple-50/40 dark:bg-black/20 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(h)}
                className="cursor-pointer"
              >
                {h.active ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold text-[10px]">
                    Ativo no Menu
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 font-bold text-[10px]">
                    Pausado
                  </Badge>
                )}
              </button>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(h)}
                  className="h-8 w-8 p-0 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                  title="Editar Destaque"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDelete(h)}
                  className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                  title="Excluir Destaque"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] rounded-3xl border border-purple-200 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {editingItem ? 'Editar Destaque' : 'Novo Destaque'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Título do Produto em Destaque</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Açaí 500g Especial da Rose"
                required
                className="h-10 rounded-xl text-xs bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Texto / Subtítulo Promocional</Label>
              <Input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Ex: Monte com 4 adicionais e calda artesanal grátis."
                className="h-10 rounded-xl text-xs bg-white/10 border-white/15 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">Texto do Selo (Badge)</Label>
                <Input
                  value={formData.badgeLabel}
                  onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })}
                  placeholder="Ex: MAIS PEDIDO"
                  className="h-10 rounded-xl text-xs font-bold bg-white/10 border-white/15 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">Preço em Destaque (€)</Label>
                <Input
                  type="number"
                  step="0.10"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="h-10 rounded-xl text-xs font-mono bg-white/10 border-white/15 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-200">URL da Imagem</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="h-10 rounded-xl text-xs font-mono bg-white/10 border-white/15 text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeHighlightCheckbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded accent-pink-600 cursor-pointer"
              />
              <Label htmlFor="activeHighlightCheckbox" className="text-xs font-bold text-purple-200 cursor-pointer">
                Exibir este destaque no topo do cardápio visual
              </Label>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="rounded-xl h-10 text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl h-10 text-xs shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                {editingItem ? 'Salvar Alterações' : 'Criar Destaque'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão Segura */}
      <SafeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Destaque do Cardápio"
        description="Tem certeza que deseja remover este produto da vitrine de destaques?"
        itemName={deletingItem?.title}
        loading={deletingLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
