'use client'

import React, { useState, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'
import { useMenuConfigStore, CustomMenuItem } from '@/lib/stores/menuConfigStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  LayoutGrid,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
} from 'lucide-react'

interface MenuSectionsAdminProps {
  tenantId?: string
}

export default function MenuSectionsAdmin({ tenantId }: MenuSectionsAdminProps = {}) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const { mainMenus, addMenu, updateMenu, deleteMenu } = useMenuConfigStore()

  // Filtra para exibir EXCLUSIVAMENTE os menus reais cadastrados (sem "Todos os Menus")
  const displayMenus = useMemo(() => {
    return mainMenus.filter(
      (m) => m.id !== 'all_menus' && !m.name.toLowerCase().includes('todos os menus')
    )
  }, [mainMenus])

  const [editOpen, setEditOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<CustomMenuItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingMenu, setDeletingMenu] = useState<CustomMenuItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    availableHours: 'Sempre disponível',
    displayOrder: 1,
    active: true,
  })

  const handleOpenNew = () => {
    setEditingMenu(null)
    setFormData({
      name: '',
      code: '',
      description: '',
      availableHours: 'Sempre disponível',
      displayOrder: displayMenus.length + 1,
      active: true,
    })
    setEditOpen(true)
  }

  const handleOpenEdit = (menu: CustomMenuItem) => {
    setEditingMenu(menu)
    setFormData({
      name: menu.name,
      code: menu.code,
      description: menu.description || '',
      availableHours: menu.availableHours || 'Sempre disponível',
      displayOrder: menu.displayOrder,
      active: menu.active,
    })
    setEditOpen(true)
  }

  const handleOpenDelete = (menu: CustomMenuItem) => {
    setDeletingMenu(menu)
    setDeleteOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Informe o nome do cardápio')
      return
    }

    if (editingMenu) {
      updateMenu(editingMenu.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || 'MENU',
        description: formData.description.trim(),
        availableHours: formData.availableHours.trim(),
        displayOrder: Number(formData.displayOrder),
        active: formData.active,
      })
      toast.success(`Cardápio "${formData.name}" atualizado com sucesso!`)
    } else {
      const newMenu: CustomMenuItem = {
        id: `menu_${Date.now()}`,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase() || `MENU_${Date.now()}`,
        description: formData.description.trim(),
        availableHours: formData.availableHours.trim(),
        displayOrder: Number(formData.displayOrder),
        active: formData.active,
      }
      addMenu(newMenu)
      toast.success(`Cardápio "${formData.name}" criado com sucesso!`)
    }

    setEditOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!deletingMenu) return
    setDeletingLoading(true)
    try {
      deleteMenu(deletingMenu.id)
      toast.success(`Cardápio "${deletingMenu.name}" removido com sucesso!`)
      setDeleteOpen(false)
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleToggleActive = (menu: CustomMenuItem) => {
    updateMenu(menu.id, { active: !menu.active })
    toast.success(
      menu.active
        ? `Cardápio "${menu.name}" desativado.`
        : `Cardápio "${menu.name}" ativado com sucesso!`
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-50">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-purple-700" />
            <span>Menus Principais</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Estrutura dos cardápios mestres exibidos no topo do painel e no QR Code
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={handleOpenNew}
            className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-purple-700/20 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Menu</span>
          </Button>
        )}
      </div>

      {/* Grid de Menus (Apenas os reais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayMenus.map((menu) => (
          <div
            key={menu.id}
            className={`p-4 rounded-2xl bg-white border transition-all shadow-xs flex flex-col justify-between ${
              menu.active
                ? 'border-purple-100 hover:border-purple-200 hover:shadow-md'
                : 'border-zinc-200 bg-zinc-50/70 opacity-70'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 leading-snug">
                      {menu.name}
                    </h3>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Cód: {menu.code} • Ordem: #{menu.displayOrder}
                    </div>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  onClick={() => handleToggleActive(menu)}
                  className={`text-[10px] font-bold cursor-pointer select-none transition ${
                    menu.active
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {menu.active ? 'Ativo' : 'Pausado'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-600 line-clamp-2">
                {menu.description || 'Cardápio de produtos e serviços'}
              </p>

              {menu.availableHours && (
                <div className="flex items-center gap-1.5 text-[11px] text-purple-900/80 font-medium">
                  <Clock className="h-3.5 w-3.5 text-purple-600" />
                  <span>{menu.availableHours}</span>
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-purple-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(menu)}
                  className="h-8 w-8 p-0 text-zinc-500 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(menu)}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-2xl border border-purple-100">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950">
              {editingMenu ? 'Editar Menu Principal' : 'Novo Menu Principal'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Nome do Menu</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: MENU: AÇAÍ DA ROSE"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700">Código do Menu</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ACAI_ROSE"
                  className="h-9 text-xs rounded-xl font-mono uppercase"
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
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Horários de Disponibilidade</Label>
              <Input
                value={formData.availableHours}
                onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                placeholder="Ex: Seg a Dom • 12:00 às 23:00"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-700">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição curta do menu..."
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
            <DialogTitle className="text-base font-black text-red-950">Excluir Menu</DialogTitle>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Tem certeza que deseja excluir o menu <strong className="text-foreground">{deletingMenu?.name}</strong>?
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
