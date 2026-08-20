'use client'

import React, { useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useMenuConfigStore, CustomCategoryItem } from '@/lib/stores/menuConfigStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

interface MenuCategoriesAdminProps {
  tenantId?: string
}

export default function MenuCategoriesAdmin({ tenantId }: MenuCategoriesAdminProps = {}) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const { categories, addCategory, updateCategory, deleteCategory } = useMenuConfigStore()

  // Filtra para exibir EXCLUSIVAMENTE as categorias reais cadastradas (sem "Todas as categorias")
  const displayCategories = useMemo(() => {
    return categories.filter(
      (c) => c.id !== 'all_cats' && !c.name.toLowerCase().includes('todas as categorias')
    )
  }, [categories])

  const [editOpen, setEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CustomCategoryItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<CustomCategoryItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    emoji: '🍧',
    displayOrder: 1,
    active: true,
  })

  const handleOpenNew = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      emoji: '🍧',
      displayOrder: displayCategories.length + 1,
      active: true,
    })
    setEditOpen(true)
  }

  const handleOpenEdit = (cat: CustomCategoryItem) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      emoji: cat.emoji || '🍧',
      displayOrder: cat.displayOrder,
      active: cat.active,
    })
    setEditOpen(true)
  }

  const handleOpenDelete = (cat: CustomCategoryItem) => {
    setDeletingCategory(cat)
    setDeleteOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Informe o nome da categoria')
      return
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim(),
        emoji: formData.emoji.trim() || '🍧',
        displayOrder: Number(formData.displayOrder),
        active: formData.active,
      })
      toast.success(`Categoria "${formData.name}" atualizada com sucesso!`)
    } else {
      const newCat: CustomCategoryItem = {
        id: `cat_${Date.now()}`,
        name: formData.name.trim(),
        slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description.trim(),
        emoji: formData.emoji.trim() || '🍧',
        displayOrder: Number(formData.displayOrder),
        active: formData.active,
        menuId: 'menu_acai',
        itemsCount: 1,
      }
      addCategory(newCat)
      toast.success(`Categoria "${formData.name}" criada com sucesso!`)
    }

    setEditOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    setDeletingLoading(true)
    try {
      deleteCategory(deletingCategory.id)
      toast.success(`Categoria "${deletingCategory.name}" removida com sucesso!`)
      setDeleteOpen(false)
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleToggleActive = (cat: CustomCategoryItem) => {
    updateCategory(cat.id, { active: !cat.active })
    toast.success(
      cat.active
        ? `Categoria "${cat.name}" pausada no cardápio.`
        : `Categoria "${cat.name}" ativada no cardápio.`
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-50">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-700" />
            <span>Categorias do Cardápio</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Gerenciamento das 5 categorias oficiais de copos e grupos de complementos do Açaí da Rose
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={handleOpenNew}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-purple-700/20 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Categoria</span>
          </Button>
        )}
      </div>

      {/* Grid de Categorias (Apenas as reais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayCategories.map((cat) => (
          <div
            key={cat.id}
            className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
              cat.active
                ? 'border-purple-100 hover:border-purple-200 hover:shadow-md'
                : 'border-zinc-200 bg-zinc-50/70 opacity-70'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                    {cat.emoji || '🍧'}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 leading-snug">
                      {cat.name}
                    </h3>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      slug: {cat.slug} • Ordem: #{cat.displayOrder}
                    </div>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  onClick={() => handleToggleActive(cat)}
                  className={`text-[10px] font-bold cursor-pointer select-none transition ${
                    cat.active
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {cat.active ? 'Ativa' : 'Pausada'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-600 line-clamp-2">
                {cat.description || 'Categoria de produtos e complementos'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-purple-50">
              <div className="text-[11px] font-bold text-purple-900">
                {cat.itemsCount || 1} produto{cat.itemsCount === 1 ? '' : 's'} vinculado{cat.itemsCount === 1 ? '' : 's'}
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(cat)}
                    className="h-8 w-8 p-0 text-zinc-500 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(cat)}
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-purple-100">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Nome da Categoria</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Açaí 250g"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700">Slug (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="acai-250g"
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700">Emoji / Ícone</Label>
                <Input
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  placeholder="🍧"
                  className="h-9 text-base rounded-xl text-center"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição curta para o cardápio..."
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Ordem de Exibição</Label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold"
              >
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm bg-white p-5 rounded-2xl border border-red-100">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <div className="p-2 rounded-xl bg-red-50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-black text-red-950">Excluir Categoria</DialogTitle>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Tem certeza que deseja excluir a categoria <strong className="text-foreground">{deletingCategory?.name}</strong>? Os itens desta categoria poderão ficar desorganizados.
          </p>

          <DialogFooter className="pt-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletingLoading}
              className="rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deletingLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20"
            >
              {deletingLoading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
