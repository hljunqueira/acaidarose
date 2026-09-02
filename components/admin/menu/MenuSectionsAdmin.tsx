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
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  GripVertical,
} from 'lucide-react'
import { emitCatalogSync } from '@/lib/utils/catalogSync'

interface MenuSectionsAdminProps {
  tenantId?: string
}

function formatAvailableHours(val: any): string {
  if (!val) return 'Sempre disponível'
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed === 'object' && parsed !== null) return formatAvailableHours(parsed)
      return val
    } catch {
      return val
    }
  }
  if (typeof val === 'object' && val !== null) {
    const daysCount = Array.isArray(val.days) ? val.days.length : 7
    const daysLabel = daysCount === 7 ? 'Todos os dias' : `${daysCount} dias/sem`
    const timeLabel = val.startTime && val.endTime ? `${val.startTime} às ${val.endTime}` : '24h'
    return `${daysLabel} (${timeLabel})`
  }
  return String(val)
}

export default function MenuSectionsAdmin({ tenantId }: MenuSectionsAdminProps = {}) {
  const { user, authFetch } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const { mainMenus, setMainMenus, addMenu, updateMenu, deleteMenu } = useMenuConfigStore()

  // Filtra para exibir EXCLUSIVAMENTE os menus reais cadastrados (sem "Todos os Menus")
  const displayMenus = useMemo(() => {
    return mainMenus.filter(
      (m) => m.id !== 'all_menus' && !m.name.toLowerCase().includes('todos os menus')
    )
  }, [mainMenus])

  const [loading, setLoading] = useState(false)
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

  const [draggedMenuId, setDraggedMenuId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMenuId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedMenuId || draggedMenuId === targetId) return

    const currentIndex = displayMenus.findIndex((m) => m.id === draggedMenuId)
    const targetIndex = displayMenus.findIndex((m) => m.id === targetId)
    if (currentIndex === -1 || targetIndex === -1) return

    const reordered = [...displayMenus]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const updatedWithOrders = reordered.map((m, idx) => ({
      ...m,
      displayOrder: idx + 1,
    }))

    setMainMenus(updatedWithOrders)
    setDraggedMenuId(null)

    try {
      const itemsPayload = updatedWithOrders.map((m) => ({
        id: m.id,
        displayOrder: m.displayOrder,
      }))
      const res = await authFetch('/api/menus/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          tenantId: tenantId || user?.tenantId,
        }),
      })
      if (!res.ok) throw new Error('Falha ao salvar ordem no servidor')
      toast.success('Ordem dos menus atualizada com sucesso!')
      emitCatalogSync({
        tenantId: (tenantId || user?.tenantId) || undefined,
        entity: 'menu',
        action: 'reorder',
      })
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sincronizar ordenação')
    }
  }

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/menus?tenantId=${encodeURIComponent(tenantId || user?.tenantId || '')}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.menus)) {
          setMainMenus(data.menus)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar menus:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchMenus()
  }, [tenantId, user?.tenantId])

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
      availableHours: formatAvailableHours(menu.availableHours),
      displayOrder: menu.displayOrder,
      active: menu.active,
    })
    setEditOpen(true)
  }

  const handleOpenDelete = (menu: CustomMenuItem) => {
    setDeletingMenu(menu)
    setDeleteOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Informe o nome do cardápio')
      return
    }

    try {
      if (editingMenu) {
        const res = await authFetch(`/api/menus/${editingMenu.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase() || 'MENU',
            description: formData.description.trim(),
            displayOrder: Number(formData.displayOrder),
            active: formData.active,
            tenantId: tenantId || user?.tenantId,
          }),
        })
        if (!res.ok) throw new Error('Falha ao atualizar cardápio')
        toast.success(`Cardápio "${formData.name}" atualizado com sucesso!`)
      } else {
        const res = await authFetch(`/api/menus`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase() || 'MENU',
            description: formData.description.trim(),
            displayOrder: Number(formData.displayOrder),
            active: formData.active,
            tenantId: tenantId || user?.tenantId,
          }),
        })
        if (!res.ok) throw new Error('Falha ao criar cardápio')
        toast.success(`Cardápio "${formData.name}" criado com sucesso!`)
      }

      await fetchMenus()
      setEditOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar cardápio')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingMenu) return
    setDeletingLoading(true)
    try {
      const res = await authFetch(`/api/menus/${deletingMenu.id}?tenantId=${encodeURIComponent(tenantId || user?.tenantId || '')}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao excluir cardápio no servidor')

      deleteMenu(deletingMenu.id)
      toast.success(`Cardápio "${deletingMenu.name}" removido com sucesso!`)
      await fetchMenus()
      setDeleteOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir cardápio')
    } finally {
      setDeletingLoading(false)
    }
  }

  const handleToggleActive = async (menu: CustomMenuItem) => {
    const nextActive = !menu.active
    updateMenu(menu.id, { active: nextActive })
    try {
      const res = await authFetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive, tenantId: tenantId || user?.tenantId }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar no banco')
      emitCatalogSync({
        tenantId: (tenantId || user?.tenantId) || undefined,
        entity: 'menu',
        action: 'toggle_active',
        entityId: menu.id,
        active: nextActive,
      })
      toast.success(
        nextActive
          ? `Cardápio "${menu.name}" ativado com sucesso!`
          : `Cardápio "${menu.name}" desativado.`
      )
    } catch (err: any) {
      updateMenu(menu.id, { active: menu.active })
      toast.error(err.message || 'Erro ao alterar status')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-purple-700 dark:text-pink-400" />
            <span>Menus Principais</span>
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Estrutura dos cardápios mestres exibidos no topo do painel e no QR Code
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={handleOpenNew}
            className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 cursor-pointer"
          >
            <span>Novo Menu</span>
          </Button>
        )}
      </div>

      {/* Grid de Menus (Apenas os reais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayMenus.map((menu) => {
          const isDragging = draggedMenuId === menu.id
          return (
            <div
              key={menu.id}
              draggable={isSuperAdmin}
              onDragStart={(e) => handleDragStart(e, menu.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, menu.id)}
              className={`p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border transition-all shadow-xs dark:shadow-md flex flex-col justify-between text-slate-900 dark:text-white ${
                isDragging ? 'opacity-40 scale-95 border-purple-500 border-dashed' : ''
              } ${
                menu.active
                  ? 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50 hover:shadow-md'
                  : 'border-purple-100 dark:border-white/10 bg-purple-50/50 dark:bg-white/5 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 text-purple-400 hover:text-purple-700 dark:hover:text-white transition shrink-0"
                        title="Arrastar para reordenar"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                    <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-center text-purple-700 dark:text-pink-400 shrink-0">
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-purple-950 dark:text-white leading-snug">
                        {menu.name}
                      </h3>
                      <div className="text-[10px] text-purple-600/80 dark:text-purple-200/60 font-mono">
                        Cód: {menu.code} • Ordem: #{menu.displayOrder}
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    onClick={() => handleToggleActive(menu)}
                    className={`text-[10px] font-bold cursor-pointer select-none transition ${
                      menu.active
                        ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'border-purple-200 dark:border-white/15 bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {menu.active ? 'Ativo' : 'Pausado'}
                  </Badge>
                </div>

                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 line-clamp-2">
                  {menu.description || 'Cardápio de produtos e serviços'}
                </p>

                {menu.availableHours && (
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-800 dark:text-purple-200/90 font-medium">
                    <Clock className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                    <span>{formatAvailableHours(menu.availableHours)}</span>
                  </div>
                )}
              </div>

              {isSuperAdmin && (
                <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-purple-100 dark:border-white/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(menu)}
                    className="h-8 w-8 p-0 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDelete(menu)}
                    className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white rounded-3xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {editingMenu ? 'Editar Menu Principal' : 'Novo Menu Principal'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Nome do Menu</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: MENU: AÇAÍ DA ROSE"
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Código do Menu</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ACAI_ROSE"
                  className="h-10 text-xs rounded-xl font-mono uppercase bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                  className="h-10 text-xs rounded-xl font-mono bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Horários de Disponibilidade</Label>
              <Input
                value={formData.availableHours}
                onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                placeholder="Ex: Seg a Dom • 12:00 às 23:00"
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição curta do menu..."
                className="h-10 text-xs rounded-xl bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white placeholder:text-purple-300 dark:placeholder:text-white/40"
              />
            </div>

            <DialogFooter className="pt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border border-purple-200 dark:border-white/15 bg-purple-50 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl h-10 text-xs cursor-pointer font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl h-10 text-xs shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                {editingMenu ? 'Salvar Alterações' : 'Criar Menu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#160228] border border-purple-200 dark:border-white/15 text-slate-900 dark:text-white shadow-2xl">
          <div className="flex items-center gap-3 text-red-500 dark:text-red-400 mb-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">Excluir Menu</DialogTitle>
          </div>

          <p className="text-xs text-purple-800 dark:text-purple-200/80 leading-relaxed">
            Tem certeza que deseja excluir o menu <strong className="text-pink-600 dark:text-pink-300 font-bold">{deletingMenu?.name}</strong>?
          </p>

          <DialogFooter className="pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border border-purple-200 dark:border-white/15 bg-purple-50 dark:bg-white/5 hover:bg-purple-100 dark:hover:bg-white/10 text-purple-950 dark:text-white rounded-xl h-9 text-xs cursor-pointer font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deletingLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-9 text-xs shadow-md shadow-red-600/30 cursor-pointer"
            >
              {deletingLoading ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
