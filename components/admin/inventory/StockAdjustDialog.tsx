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
import { InventoryItemRow } from '@/lib/repositories/inventoryRepository'

interface StockAdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItemRow | null
  onConfirmAdjust: (params: {
    itemId: string
    newQuantity: number
    difference: number
    reason: string
    newMinAlert?: number
  }) => Promise<void> | void
}

export default function StockAdjustDialog({
  open,
  onOpenChange,
  item,
  onConfirmAdjust,
}: StockAdjustDialogProps) {
  const [adjustType, setAdjustType] = useState<'ENTRY' | 'BREAKAGE' | 'DAILY_USAGE' | 'COUNT'>('ENTRY')
  const [quantityInput, setQuantityInput] = useState('')
  const [minAlertInput, setMinAlertInput] = useState<string>('2')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuantityInput('')
    setReason('')
    setAdjustType('ENTRY')
    if (item) {
      setMinAlertInput(String(item.minAlertQuantity ?? 2))
    }
  }, [open, item])

  if (!item) return null

  const currentQty = item.currentQuantity || 0
  const inputVal = parseFloat(quantityInput) || 0

  let computedNewQty = currentQty
  let computedDiff = 0

  if (adjustType === 'ENTRY') {
    computedNewQty = currentQty + inputVal
    computedDiff = inputVal
  } else if (adjustType === 'BREAKAGE') {
    computedNewQty = Math.max(0, currentQty - inputVal)
    computedDiff = -inputVal
  } else if (adjustType === 'DAILY_USAGE') {
    computedNewQty = Math.max(0, currentQty - inputVal)
    computedDiff = -inputVal
  } else if (adjustType === 'COUNT') {
    computedNewQty = inputVal
    computedDiff = inputVal - currentQty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(inputVal) || inputVal < 0) return
    setLoading(true)
    try {
      const parsedMin = parseFloat(minAlertInput)
      await onConfirmAdjust({
        itemId: item.id,
        newQuantity: computedNewQty,
        difference: computedDiff,
        newMinAlert: !isNaN(parsedMin) && parsedMin >= 0 ? parsedMin : undefined,
        reason:
          reason ||
          (adjustType === 'ENTRY'
            ? 'COMPRA_LOCAL_EMERGENCIA'
            : adjustType === 'BREAKAGE'
            ? 'QUEBRA_DESCARTE'
            : adjustType === 'DAILY_USAGE'
            ? 'USO_DIARIO_SEMANAL'
            : 'AJUSTE_INVENTARIO'),
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
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
            Ajustar Saldo: {item.name}
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
            Lançamento físico assistido com registro imutável no log de auditoria
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tipo de Ajuste */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">Tipo de Operação</Label>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0338] px-3 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
            >
              <option value="ENTRY">+ Entrada / Compra Local Emergencial</option>
              <option value="BREAKAGE">- Saída por Quebra / Descarte / Perda</option>
              <option value="DAILY_USAGE">- Saída uso diário/semanal</option>
              <option value="COUNT">= Correção de Saldo por Contagem Física</option>
            </select>
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">
              {adjustType === 'ENTRY' && `Quantidade a Adicionar (${item.unit})`}
              {adjustType === 'BREAKAGE' && `Quantidade Descartada / Quebrada (${item.unit})`}
              {adjustType === 'DAILY_USAGE' && `Quantidade de Saída / Uso Diário ou Semanal (${item.unit})`}
              {adjustType === 'COUNT' && `Nova Quantidade Física Real (${item.unit})`}
            </Label>
            <Input
              required
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white font-mono"
            />
          </div>

          {/* Justificativa / Motivo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">Justificativa / Motivo</Label>
            <Input
              placeholder="Ex: Uso diário no salão, reposição semanal, quebra, Makro..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white"
            />
          </div>

          {/* Limite Mínimo de Alerta da Loja */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">
                Limite Mínimo em Estoque ({item.unit})
              </Label>
              <span className="text-[10px] text-purple-600 dark:text-pink-400 font-bold">
                Alerta de reposição desta loja
              </span>
            </div>
            <Input
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 20"
              value={minAlertInput}
              onChange={(e) => setMinAlertInput(e.target.value)}
              className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-xs text-purple-950 dark:text-white font-mono font-bold"
            />
            <p className="text-[10px] text-purple-700/80 dark:text-purple-300/70">
              A loja entrará em alerta se o saldo físico ficar abaixo deste valor.
            </p>
          </div>

          {/* Prévia do Resultado */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">Saldo Atual</span>
              <span className="font-mono font-black text-purple-950 dark:text-white text-sm">
                {currentQty} {item.unit}
              </span>
            </div>
            <div className="text-right">
              <span className="text-purple-700/80 dark:text-purple-300/70 block text-[11px] font-bold">Novo Saldo Projetado</span>
              <span className="font-mono font-black text-purple-950 dark:text-pink-300 text-base">
                {computedNewQty.toFixed(1)} {item.unit}
              </span>
            </div>
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
              disabled={loading || !quantityInput}
              className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {loading ? 'A registar...' : 'Confirmar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
