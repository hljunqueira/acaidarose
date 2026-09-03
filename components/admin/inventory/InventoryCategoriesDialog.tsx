'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, FolderTree, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'

export interface InventoryCategoryItem {
  id: string
  name: string
  code: string
  displayOrder: number
}

interface InventoryCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoriesUpdated?: () => void
}

export default function InventoryCategoriesDialog({
  open,
  onOpenChange,
  onCategoriesUpdated,
}: InventoryCategoriesDialogProps) {
  const { authFetch } = useAuthStore()
  const [categories, setCategories] = useState<InventoryCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [adding, setAdding] = useState(false)

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/inventory/categories')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.categories)) {
          setCategories(data.categories)
        }
      }
    } catch {
      toast.error('Erro ao carregar categorias de estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadCategories()
    }
  }, [open])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newCode.trim()) return

    setAdding(true)
    try {
      const res = await authFetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          code: newCode.trim().toUpperCase(),
          displayOrder: categories.length + 1,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha ao cadastrar categoria')
      }

      toast.success('Categoria de estoque criada com sucesso!')
      setNewName('')
      setNewCode('')
      await loadCategories()
      onCategoriesUpdated?.()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar categoria')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover a categoria "${name}"?`)) return

    try {
      const res = await authFetch(`/api/inventory/categories/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao excluir categoria')

      toast.success('Categoria removida!')
      await loadCategories()
      onCategoriesUpdated?.()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir categoria')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-100 dark:bg-white/10 flex items-center justify-center text-purple-800 dark:text-pink-300">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                Categorias de Estoque
              </DialogTitle>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
                Classificação oficial para compras de suprimentos e inventário local
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Formulário de Adição Rápida */}
        <form onSubmit={handleAddCategory} className="pt-2 pb-1 border-b border-purple-100 dark:border-white/10">
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 space-y-1">
              <Label className="text-[11px] font-bold text-purple-950 dark:text-white">Nome da Categoria</Label>
              <Input
                placeholder="Ex: Caldas Nobres..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-[11px] font-bold text-purple-950 dark:text-white">Código</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="CALDA"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white font-mono uppercase"
                />
                <Button
                  type="submit"
                  disabled={adding || !newName.trim() || !newCode.trim()}
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl bg-purple-800 hover:bg-purple-900 text-white shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Listagem de Categorias Existentes */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 py-2">
          {loading ? (
            <div className="py-6 text-center text-xs text-purple-500">Carregando categorias...</div>
          ) : categories.length === 0 ? (
            <div className="py-6 text-center text-xs text-purple-500">Nenhuma categoria cadastrada.</div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-purple-100 dark:border-white/5 bg-purple-50/30 dark:bg-white/5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-white/10 font-mono text-[10px] font-bold text-purple-900 dark:text-purple-200">
                    {cat.code}
                  </span>
                  <span className="font-bold text-purple-950 dark:text-white">{cat.name}</span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="h-7 w-7 p-0 text-purple-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
