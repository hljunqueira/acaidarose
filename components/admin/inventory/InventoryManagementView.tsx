'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Search,
  ClipboardCheck,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  Edit2,
  FolderTree,
  ShoppingCart,
  Truck,
  ArrowDownToLine,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { InventoryItemRow } from '@/lib/repositories/inventoryRepository'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import InventoryItemDialog, { InventoryItemFormData } from './InventoryItemDialog'
import InventoryCategoriesDialog from './InventoryCategoriesDialog'
import StockAdjustDialog from './StockAdjustDialog'
import ShiftChecklistDialog from './ShiftChecklistDialog'
import ConfirmActionDialog from '@/components/ui/ConfirmActionDialog'

export default function InventoryManagementView({
  tenantId = '11111111-1111-1111-1111-111111111111',
  onNavigateToSupplyOrders,
}: {
  tenantId?: string
  onNavigateToSupplyOrders?: () => void
}) {
  const { authFetch, user } = useAuthStore()
  const [items, setItems] = useState<InventoryItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const isMatriz =
    tenantId === '11111111-1111-1111-1111-111111111111' ||
    user?.tenantId === '11111111-1111-1111-1111-111111111111' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'FRANCHISOR_ADMIN'

  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferItemId, setTransferItemId] = useState('')
  const [transferQty, setTransferQty] = useState<number>(5)
  const [transferring, setTransferring] = useState(false)

  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description?: string
    onConfirm: () => Promise<void> | void
  }>({
    open: false,
    title: '',
    onConfirm: () => {},
  })

  // Modais de Controle
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemFormData | null>(null)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemRow | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false)
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; code: string }[]>([])

  const loadInventory = useCallback(async (isManual = false) => {
    setLoading(true)
    try {
      const [res, catRes] = await Promise.all([
        authFetch(`/api/inventory?tenantId=${tenantId}`),
        authFetch('/api/inventory/categories'),
      ])

      if (!res.ok) throw new Error('Falha ao carregar estoque')
      const data = await res.json()
      setItems(data.items || [])

      if (catRes.ok) {
        const catData = await catRes.json()
        if (Array.isArray(catData.categories)) {
          setCategoriesList(catData.categories)
        }
      }

      if (isMatriz) {
        authFetch('/api/supply-orders')
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data.orders)) {
              const pending = data.orders.filter(
                (o: any) => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PREPARING'
              ).length
              setPendingOrdersCount(pending)
            }
          })
          .catch(() => {})
      }

      if (isManual) toast.success('Estoque sincronizado!')
    } catch {
      if (isManual) toast.error('Erro ao atualizar estoque')
    } finally {
      setLoading(false)
    }
  }, [authFetch, tenantId, isMatriz])

  useEffect(() => {
    loadInventory(false)
  }, [loadInventory])

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferItemId || transferQty <= 0) {
      toast.error('Informe o insumo e a quantidade')
      return
    }
    setTransferring(true)
    try {
      const res = await authFetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: transferItemId,
          quantity: transferQty,
          tenantId,
        }),
      })
      if (!res.ok) throw new Error('Falha ao transferir insumo')
      toast.success('Insumos transferidos do armazém central para o balcão com sucesso!')
      setTransferModalOpen(false)
      loadInventory()
    } catch (err: any) {
      toast.error(err.message || 'Erro na transferência interna')
    } finally {
      setTransferring(false)
    }
  }

  const handleSaveItem = async (formData: InventoryItemFormData) => {
    try {
      if (formData.id) {
        // Atualizar insumo existente
        const res = await authFetch(`/api/inventory/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao atualizar insumo')
        toast.success('Insumo e limites atualizados com sucesso!')
      } else {
        // Criar novo insumo
        const res = await authFetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Falha ao cadastrar insumo')
        toast.success('Novo insumo cadastrado com sucesso!')
      }
      loadInventory()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar insumo')
    }
  }

  const handleDeleteItem = (itemId: string, itemName: string) => {
    setConfirmState({
      open: true,
      title: 'Remover Insumo do Inventário',
      description: `Deseja realmente remover "${itemName}" do inventário desta unidade?`,
      onConfirm: async () => {
        try {
          const res = await authFetch(`/api/inventory/${itemId}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Falha ao excluir insumo')
          toast.success('Insumo removido com sucesso!')
          setConfirmState((prev) => ({ ...prev, open: false }))
          loadInventory()
        } catch (err: any) {
          toast.error(err.message || 'Erro ao excluir insumo')
        }
      },
    })
  }

  const handleConfirmAdjust = async (params: {
    itemId: string
    newQuantity: number
    difference: number
    reason: string
  }) => {
    try {
      const res = await authFetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          tenantId,
        }),
      })
      if (!res.ok) throw new Error('Falha ao registrar ajuste')
      toast.success('Ajuste de saldo físico registrado com sucesso!')
      loadInventory()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao ajustar saldo')
    }
  }

  const handleQuickPauseItem = async (item: InventoryItemRow) => {
    try {
      const res = await authFetch('/api/products/toggle-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          productId: item.id,
          available: false,
          active: false,
        }),
      })
      if (!res.ok) throw new Error('Falha ao pausar')
      toast.success(`"${item.name}" pausado no Cardápio QR Code desta loja.`)
    } catch {
      toast.error(`Erro ao pausar "${item.name}" no cardápio`)
    }
  }

  const handleKeepActive = (item: InventoryItemRow) => {
    toast.success(`"${item.name}" permanece ativo no cardápio. Vendas continuam normalmente.`)
  }

  const handleSubmitChecklist = async (counts: { itemId: string; theoretical: number; counted: number }[]) => {
    try {
      const res = await authFetch('/api/inventory/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          counts,
        }),
      })
      if (!res.ok) throw new Error('Falha ao salvar checklist')
      toast.success('Checklist de fechamento registrado e estoque oficial atualizado!')
      loadInventory()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar checklist')
    }
  }

  const filteredItems = items.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.supplyCode && i.supplyCode.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchCat =
      categoryFilter === 'ALL' || i.category.toUpperCase() === categoryFilter.toUpperCase()
    return matchSearch && matchCat
  })

  const alertItems = items.filter((i) => i.status === 'ALERT' || i.status === 'CRITICAL')
  const criticalItems = items.filter((i) => i.isCriticalChecklist)

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Minimalista: Título na linha acima */}
      <div className="space-y-3 pb-3 border-b border-purple-150 dark:border-white/15">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
            Gestão de Estoque Local
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium mt-0.5">
            Controle de insumos, limites de reposição e checklist de turno
          </p>
        </div>

        {/* Linha Única de Botões Otimizada com Altura Ampliada */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap overflow-x-auto no-scrollbar pt-1">
          <Button
            variant="outline"
            onClick={() => loadInventory(true)}
            className="h-10 text-xs font-bold gap-1.5 px-3.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setCategoriesDialogOpen(true)}
            className="h-10 text-xs font-bold gap-1.5 px-3.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs shrink-0"
          >
            <FolderTree className="h-4 w-4 text-purple-600 dark:text-pink-400" />
            <span>Categorias</span>
          </Button>

          <Button
            onClick={() => {
              setEditingItem(null)
              setItemDialogOpen(true)
            }}
            variant="outline"
            className="h-10 text-xs font-bold px-4 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs shrink-0"
          >
            <span>Novo Insumo</span>
          </Button>

          {isMatriz && (
            <Button
              variant="outline"
              onClick={() => {
                if (items.length > 0) setTransferItemId(items[0].id)
                setTransferQty(5)
                setTransferModalOpen(true)
              }}
              className="h-10 text-xs font-bold gap-1.5 px-3.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-xs shrink-0"
              title="Transferir mercadoria do armazém central para o balcão da loja"
            >
              <ArrowDownToLine className="h-4 w-4 text-purple-600 dark:text-pink-400" />
              <span>Abastecer Balcão</span>
            </Button>
          )}

          <Button
            onClick={() => setChecklistOpen(true)}
            className="h-10 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-black gap-2 px-4 cursor-pointer shadow-xs shrink-0"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Checklist Rápido de Turno</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Ruptura Inteligente */}
      {alertItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-950 dark:text-amber-200">Atenção ao Balcão:</span>
              <span className="text-amber-900 dark:text-amber-300/80 ml-1">
                {alertItems.map((a) => a.name).join(', ')} próximo(s) do limite mínimo estimado. Conferir bancada física.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToSupplyOrders && (
              <Button
                size="sm"
                onClick={onNavigateToSupplyOrders}
                className="h-7 px-2.5 text-[11px] font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs flex items-center gap-1"
              >
                <ShoppingCart className="h-3 w-3" />
                <span>Pedir Reposição</span>
              </Button>
            )}
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
              {alertItems.length} {alertItems.length === 1 ? 'Alerta Ativo' : 'Alertas Ativos'}
            </Badge>
          </div>
        </div>
      )}

      {/* Filtro por Categorias de Estoque */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            categoryFilter === 'ALL'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'bg-purple-50/70 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-150 dark:border-white/10'
          }`}
        >
          Todas as Categorias
        </button>
        {categoriesList.map((cat) => (
          <button
            key={cat.code}
            type="button"
            onClick={() => setCategoryFilter(cat.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter.toUpperCase() === cat.code.toUpperCase()
                ? 'bg-purple-800 text-white shadow-xs'
                : 'bg-purple-50/70 dark:bg-white/5 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-white/10 border border-purple-150 dark:border-white/10'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
        <Input
          placeholder="Pesquisar insumo ou SKU (ex: SUP-CAL-NUT, Nutella, Copos, Açaí, Morango)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 rounded-2xl border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] text-xs text-purple-950 dark:text-white"
        />
      </div>

      {/* Tabela de Insumos da Loja */}
      <Card className="border border-purple-150 dark:border-white/15 bg-white dark:bg-[#160228] rounded-3xl overflow-hidden shadow-xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-50/70 dark:bg-white/5 border-b border-purple-150 dark:border-white/10 text-[11px] font-black uppercase text-purple-900/80 dark:text-purple-300/70">
                <tr>
                  <th className="py-3 px-4">Insumo / Artigo</th>
                  <th className="py-3 px-4">Cód. Suprimento</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Saldo Atual</th>
                  <th className="py-3 px-4">Limite Mínimo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-purple-950 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.isCriticalChecklist && (
                          <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-[8px] py-0 font-bold">
                            Crítico
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-purple-900/70 dark:text-purple-300/70">
                      {item.supplyCode || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="border-purple-200 dark:border-white/10 text-[10px] font-semibold text-purple-900 dark:text-purple-200">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-black text-purple-950 dark:text-white font-mono text-sm">
                      {item.currentQuantity} <span className="text-[10px] font-normal text-purple-700/70 dark:text-purple-300/60">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-purple-700/80 dark:text-purple-300/70 font-mono">
                      {item.minAlertQuantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'NORMAL' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Normal
                        </span>
                      )}
                      {item.status === 'ALERT' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Conferir
                        </span>
                      )}
                      {item.status === 'CRITICAL' && (
                        <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-[11px]">
                          <AlertTriangle className="h-3.5 w-3.5" /> Crítico
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'NORMAL' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuickPauseItem(item)}
                            className="h-7 px-2 rounded-lg border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold text-[10px] cursor-pointer"
                            title="Confirmar falta física e pausar no cardápio"
                          >
                            <span>Pausar Cardápio</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => {
                            setAdjustingItem(item)
                            setAdjustDialogOpen(true)
                          }}
                          className="h-7 px-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                        >
                          <SlidersHorizontal className="h-3 w-3 mr-1" />
                          <span>Ajustar Saldo</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItem({
                              id: item.id,
                              name: item.name,
                              category: item.category,
                              unit: item.unit,
                              marketPrice: item.marketPrice,
                              supplyPrice: item.supplyPrice,
                              minAlertQuantity: item.minAlertQuantity,
                              isCriticalChecklist: item.isCriticalChecklist,
                            })
                            setItemDialogOpen(true)
                          }}
                          className="h-7 w-7 p-0 text-purple-700 dark:text-pink-400 hover:bg-purple-100 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                          title="Editar limites e insumo"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                          title="Remover do inventário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modais de Operação */}
      <InventoryItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        onSave={handleSaveItem}
      />

      <InventoryCategoriesDialog
        open={categoriesDialogOpen}
        onOpenChange={setCategoriesDialogOpen}
        onCategoriesUpdated={() => loadInventory(false)}
      />

      <StockAdjustDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={adjustingItem}
        onConfirmAdjust={handleConfirmAdjust}
      />

      <ShiftChecklistDialog
        open={checklistOpen}
        onOpenChange={setChecklistOpen}
        criticalItems={criticalItems.length > 0 ? criticalItems : items.slice(0, 5)}
        onSubmitChecklist={handleSubmitChecklist}
      />

      <ConfirmActionDialog
        open={confirmState.open}
        onOpenChange={(o) => setConfirmState((prev) => ({ ...prev, open: o }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Excluir Insumo"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />

      {/* MODAL DE TRANSFERÊNCIA INTERNA (MATRIZ: ARMAZÉM -> BALCÃO) */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-black text-purple-950 dark:text-white flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-purple-600 dark:text-pink-400" />
              <span>Abastecer Balcão (Transferência Interna)</span>
            </DialogTitle>
            <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
              Transfira insumos do Armazém Central da Matriz (Figueira da Foz) para o estoque do balcão de vendas a custo zero.
            </p>
          </DialogHeader>

          <form onSubmit={handleInternalTransfer} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-purple-950 dark:text-white">Insumo / Matéria-Prima</label>
              <select
                value={transferItemId}
                onChange={(e) => setTransferItemId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-medium cursor-pointer"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id} className="text-purple-950 dark:text-black">
                    {it.name} ({it.unit}) — Saldo Atual no Balcão: {it.currentQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-purple-950 dark:text-white">Quantidade a Transferir para o Balcão</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={transferQty}
                onChange={(e) => setTransferQty(parseFloat(e.target.value) || 0)}
                className="h-10 text-xs rounded-xl font-mono border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-purple-950 dark:text-white"
              />
            </div>

            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <p className="font-bold">Movimentação Interna:</p>
              <p>
                • O estoque central da Matriz será deduzido em <strong>{transferQty} un</strong>.<br />
                • O balcão físico da loja receberá <strong>{transferQty} un</strong> imediatamente.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-purple-100 dark:border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferModalOpen(false)}
                className="h-9 text-xs font-bold rounded-xl border-purple-200 dark:border-white/15 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={transferring}
                className="h-9 text-xs font-black px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span>{transferring ? 'A transferir...' : 'Confirmar Transferência'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
