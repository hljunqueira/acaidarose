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
      {/* Header Sem Ícone de Sparkles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            Itens em Destaque
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure os açaís promovidos com selos de destaque no topo do cardápio visual e nos QR Codes.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
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
            className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              {/* Imagem com Selo */}
              <div className="relative h-44 w-full bg-purple-950 overflow-hidden">
                <img
                  src={h.imageUrl}
                  alt={h.title}
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-3 right-3 ${h.badgeColor || 'bg-fuchsia-600'} text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border-0 shadow-lg`}>
                  {h.badgeLabel}
                </Badge>
              </div>

              {/* Detalhes */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-zinc-900 leading-tight">
                    {h.title}
                  </h3>
                  <span className="font-mono font-black text-sm text-fuchsia-700">
                    {formatCurrency(h.price)}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                  {h.subtitle}
                </p>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="p-3.5 bg-purple-50/50 border-t border-purple-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(h)}
                className="cursor-pointer"
              >
                {h.active ? (
                  <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                    Ativo no Menu
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 font-bold text-[10px]">
                    Pausado
                  </Badge>
                )}
              </button>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(h)}
                  className="h-8 w-8 p-0 text-zinc-600 hover:text-purple-700 hover:bg-purple-100/50 rounded-lg cursor-pointer"
                  title="Editar Destaque"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDelete(h)}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-purple-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-zinc-900">
              {editingItem ? 'Editar Destaque' : 'Novo Destaque'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Título do Produto em Destaque</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Açaí 500g Especial da Rose"
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Texto / Subtítulo Promocional</Label>
              <textarea
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Descrição dos ingredientes e motivo do destaque..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Texto do Selo (Badge)</Label>
                <Input
                  value={formData.badgeLabel}
                  onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })}
                  placeholder="MAIS PEDIDO, NOVIDADE..."
                  className="h-10 rounded-xl text-xs uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Preço (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="h-10 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">URL da Foto</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-10 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-5 shadow-md"
              >
                Salvar Destaque
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
