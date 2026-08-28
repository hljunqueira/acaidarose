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
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { InventoryItemRow } from '@/lib/repositories/inventoryRepository'
import InventoryItemDialog, { InventoryItemFormData } from './InventoryItemDialog'
import StockAdjustDialog from './StockAdjustDialog'
import ShiftChecklistDialog from './ShiftChecklistDialog'

export default function InventoryManagementView({ tenantId = '11111111-1111-1111-1111-111111111111' }: { tenantId?: string }) {
  const { authFetch } = useAuthStore()
  const [items, setItems] = useState<InventoryItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modais de Controle
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemFormData | null>(null)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<InventoryItemRow | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(false)

  const loadInventory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/inventory?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.items)) {
          setItems(data.items)
        }
      }
    } catch {
      toast.error('Erro ao conectar com o estoque local')
    } finally {
      setLoading(false)
    }
  }, [tenantId, authFetch])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])

  const handleSaveItem = async (formData: InventoryItemFormData) => {
    try {
      if (formData.id) {
        // Atualizar insumo existente
        const res = await authFetch(`/api/inventory/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, tenantId }),
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

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Deseja realmente remover "${itemName}" do inventário?`)) return
    try {
      const res = await authFetch(`/api/inventory/${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir insumo')
      toast.success('Insumo removido com sucesso!')
      loadInventory()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir insumo')
    }
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

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const alertItems = items.filter((i) => i.status === 'ALERT' || i.status === 'CRITICAL')
  const criticalItems = items.filter((i) => i.isCriticalChecklist)

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-150 dark:border-white/15">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-white/5 text-purple-700 dark:text-pink-400 border border-purple-150 dark:border-white/10 shadow-xs">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-purple-950 dark:text-white tracking-tight">
              Gestão de Estoque Local
            </h1>
            <p className="text-xs sm:text-sm text-purple-700/80 dark:text-purple-200/70 font-medium">
              Acompanhamento assistido por alertas inteligentes e checklist rápido de turno
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={loadInventory}
            className="h-9 text-xs font-bold gap-1.5 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => {
              setEditingItem(null)
              setItemDialogOpen(true)
            }}
            size="sm"
            variant="outline"
            className="h-9 text-xs font-bold px-3 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-white/10 text-purple-950 dark:text-white cursor-pointer shadow-2xs"
          >
            <span>Novo Insumo</span>
          </Button>

          <Button
            onClick={() => setChecklistOpen(true)}
            size="sm"
            className="h-9 bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 text-white rounded-xl text-xs font-black gap-1.5 cursor-pointer shadow-xs"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
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
          <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
            {alertItems.length} {alertItems.length === 1 ? 'Alerta Ativo' : 'Alertas Ativos'}
          </Badge>
        </div>
      )}

      {/* Barra de Busca */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
        <Input
          placeholder="Pesquisar insumo (ex: Nutella, Copos, Açaí, Morango)..."
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
    </div>
  )
}
