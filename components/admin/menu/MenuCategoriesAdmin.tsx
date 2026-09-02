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

  const { categories, setCategories, addCategory, updateCategory, deleteCategory } = useMenuConfigStore()

  // Filtra para exibir EXCLUSIVAMENTE as categorias reais cadastradas (sem "Todas as categorias")
  const displayCategories = useMemo(() => {
    return categories.filter(
      (c) => c.id !== 'all_cats' && !c.name.toLowerCase().includes('todas as categorias')
    )
  }, [categories])

  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CustomCategoryItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<CustomCategoryItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    emoji: '',
    displayOrder: 1,
    active: true,
  })

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/categories?tenantId=${encodeURIComponent(tenantId || user?.tenantId || '')}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.categories)) {
          setCategories(data.categories)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchCategories()
  }, [tenantId, user?.tenantId])

  const handleOpenNew = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      emoji: '',
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
      emoji: cat.emoji || '',
      displayOrder: cat.displayOrder,
      active: cat.active,
    })
    setEditOpen(true)
  }

  const handleOpenDelete = (cat: CustomCategoryItem) => {
    setDeletingCategory(cat)
    setDeleteOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Informe o nome da categoria')
      return
    }

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description.trim(),
            emoji: formData.emoji.trim() || '',
            displayOrder: Number(formData.displayOrder),
            active: formData.active,
            tenantId: tenantId || user?.tenantId,
          }),
        })
        if (!res.ok) throw new Error('Falha ao atualizar categoria')
        toast.success(`Categoria "${formData.name}" atualizada com sucesso!`)
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description.trim(),
            emoji: formData.emoji.trim() || '',
            displayOrder: Number(formData.displayOrder),
            active: formData.active,
            tenantId: tenantId || user?.tenantId,
          }),
        })
        if (!res.ok) throw new Error('Falha ao cadastrar categoria')
        toast.success(`Categoria "${formData.name}" criada com sucesso!`)
      }

      await fetchCategories()
      setEditOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar categoria')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    setDeletingLoading(true)
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao excluir categoria')
      deleteCategory(deletingCategory.id)
      toast.success(`Categoria "${deletingCategory.name}" removida com sucesso!`)
      setDeleteOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria')
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleToggleActive = async (cat: CustomCategoryItem) => {
    const nextActive = !cat.active
    updateCategory(cat.id, { active: nextActive })
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive, tenantId: tenantId || user?.tenantId }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar no banco')
      toast.success(
        nextActive
          ? `Categoria "${cat.name}" ativada no cardápio.`
          : `Categoria "${cat.name}" pausada no cardápio.`
      )
    } catch (err: any) {
      updateCategory(cat.id, { active: cat.active })
      toast.error(err.message || 'Erro ao pausar categoria')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-700 dark:text-pink-400" />
            <span>Categorias do Cardápio</span>
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Gerenciamento das 5 categorias oficiais de copos e grupos de complementos do Açaí da Rose
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={handleOpenNew}
            className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer"
          >
            <span>Nova Categoria</span>
          </Button>
        )}
      </div>

      {/* Grid de Categorias (Apenas as reais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayCategories.map((cat) => (
          <div
            key={cat.id}
            className={`p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border transition-all shadow-xs dark:shadow-md flex flex-col justify-between text-slate-900 dark:text-white ${
              cat.active
                ? 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50 hover:shadow-md'
                : 'border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 opacity-60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-purple-800 dark:text-pink-300 font-mono flex items-center justify-center">
                    #{cat.displayOrder}
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-purple-950 dark:text-white leading-snug">
                      {cat.name}
                    </h3>
                    <div className="text-[10px] text-purple-600/80 dark:text-purple-200/60 font-mono">
                      slug: {cat.slug}
                    </div>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  onClick={() => handleToggleActive(cat)}
                  className={`text-[10px] font-bold cursor-pointer select-none transition ${
                    cat.active
                      ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-purple-200 dark:border-white/15 bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {cat.active ? 'Ativa' : 'Pausada'}
                </Badge>
              </div>

              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 line-clamp-2">
                {cat.description || 'Categoria de produtos e complementos'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-purple-100 dark:border-white/10">
              <div className="text-[11px] font-bold text-purple-700 dark:text-pink-300">
                {cat.itemsCount || 1} produto{cat.itemsCount === 1 ? '' : 's'} vinculado{cat.itemsCount === 1 ? '' : 's'}
              </div>

              {isSuperAdmin && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(cat)}
                    className="h-8 w-8 p-0 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(cat)}
                    className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
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
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] border-purple-200 dark:border-white/15 text-slate-900 dark:text-white rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-900 dark:text-purple-200">Nome da Categoria</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: COPOS TRADICIONAIS"
                required
                className="rounded-xl h-10 text-xs font-bold uppercase bg-white dark:bg-white/10 border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-200">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve explicação da categoria..."
                className="rounded-xl h-10 text-xs bg-white/10 border-white/15 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-200">Ordem de Exibição</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  className="rounded-xl h-10 text-xs font-mono bg-white/10 border-white/15 text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-200">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="copos-tradicionais"
                  className="rounded-xl h-10 text-xs font-mono bg-white/10 border-white/15 text-white"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl h-10 text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl h-10 text-xs shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#160228] p-4 sm:p-5 rounded-2xl border border-white/15 text-white">
          <div className="flex items-center gap-3 text-red-400 mb-2">
            <div className="p-2 rounded-xl bg-red-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-black text-white">Excluir Categoria</DialogTitle>
          </div>

          <p className="text-xs text-purple-200/80 leading-relaxed">
            Tem certeza que deseja excluir a categoria <strong className="text-pink-300 font-bold">{deletingCategory?.name}</strong>? Os itens desta categoria poderão ficar desorganizados.
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
