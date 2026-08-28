'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface InventoryItemFormData {
  id?: string
  name: string
  category: string
  unit: string
  marketPrice: number
  supplyPrice: number
  minAlertQuantity?: number
  isCriticalChecklist?: boolean
}

interface InventoryItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItemFormData | null
  onSave: (data: InventoryItemFormData) => Promise<void> | void
  isMaster?: boolean
}

export default function InventoryItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  isMaster = false,
}: InventoryItemDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('TOPPING')
  const [unit, setUnit] = useState('Baldes')
  const [marketPrice, setMarketPrice] = useState(0)
  const [supplyPrice, setSupplyPrice] = useState(0)
  const [minAlertQuantity, setMinAlertQuantity] = useState(2)
  const [isCriticalChecklist, setIsCriticalChecklist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setCategory(item.category || 'TOPPING')
      setUnit(item.unit || 'Baldes')
      setMarketPrice(item.marketPrice || 0)
      setSupplyPrice(item.supplyPrice || 0)
      setMinAlertQuantity(item.minAlertQuantity ?? 2)
      setIsCriticalChecklist(item.isCriticalChecklist ?? false)
    } else {
      setName('')
      setCategory('TOPPING')
      setUnit('Baldes')
      setMarketPrice(0)
      setSupplyPrice(0)
      setMinAlertQuantity(2)
      setIsCriticalChecklist(false)
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSave({
        id: item?.id,
        name: name.trim(),
        category,
        unit,
        marketPrice: Number(marketPrice) || 0,
        supplyPrice: Number(supplyPrice) || 0,
        minAlertQuantity: Number(minAlertQuantity) || 2,
        isCriticalChecklist,
      })
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-black text-purple-950 dark:text-white">
            {item?.id ? 'Editar Insumo de Estoque' : 'Cadastrar Novo Insumo'}
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
            {isMaster
              ? 'Configuração corporativa de insumo homologado para toda a rede de franquias'
              : 'Definição do insumo e limites de alerta para esta unidade'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Nome do Insumo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">Nome do Insumo / Artigo</Label>
            <Input
              required
              placeholder="Ex: Açaí Puro 10kg, Nutella 3kg, Morango..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white"
            />
          </div>

          {/* Categoria e Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Categoria</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0338] px-3 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="BASE">Base (Açaí/Cremes)</option>
                <option value="TOPPING">Topping & Caldas</option>
                <option value="FRUTA">Frutas Frescas</option>
                <option value="EMBALAGEM">Embalagens & Copos</option>
                <option value="DESCARTAVEL">Descartáveis</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Unidade de Medida</Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0338] px-3 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="Baldes">Baldes</option>
                <option value="Kg">Quilos (Kg)</option>
                <option value="Latas">Latas</option>
                <option value="Centenas">Centenas</option>
                <option value="Caixas">Caixas</option>
                <option value="Unidades">Unidades</option>
              </select>
            </div>
          </div>

          {/* Preços (Tabela Comparativa B2B) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Mercado Ext. (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={marketPrice}
                onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Matriz B2B (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={supplyPrice}
                onChange={(e) => setSupplyPrice(parseFloat(e.target.value) || 0)}
                className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Limite Mínimo de Alerta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">Estoque Mínimo de Alerta ({unit})</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={minAlertQuantity}
              onChange={(e) => setMinAlertQuantity(parseFloat(e.target.value) || 0)}
              className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
            />
          </div>

          {/* Checklist de Fechamento */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isCritical"
              checked={isCriticalChecklist}
              onChange={(e) => setIsCriticalChecklist(e.target.checked)}
              className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label
              htmlFor="isCritical"
              className="text-xs text-purple-900 dark:text-purple-200 font-medium cursor-pointer"
            >
              Item Crítico de Fechamento (Aparece no Checklist Rápido de Turno)
            </label>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-bold text-purple-950 dark:text-white cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {loading ? 'A gravar...' : item?.id ? 'Salvar Alterações' : 'Cadastrar Insumo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
