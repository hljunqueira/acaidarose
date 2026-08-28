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
  }) => Promise<void> | void
}

export default function StockAdjustDialog({
  open,
  onOpenChange,
  item,
  onConfirmAdjust,
}: StockAdjustDialogProps) {
  const [adjustType, setAdjustType] = useState<'ENTRY' | 'BREAKAGE' | 'COUNT'>('ENTRY')
  const [quantityInput, setQuantityInput] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuantityInput('')
    setReason('')
    setAdjustType('ENTRY')
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
  } else if (adjustType === 'COUNT') {
    computedNewQty = inputVal
    computedDiff = inputVal - currentQty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isNaN(inputVal) || inputVal < 0) return
    setLoading(true)
    try {
      await onConfirmAdjust({
        itemId: item.id,
        newQuantity: computedNewQty,
        difference: computedDiff,
        reason: reason || (adjustType === 'ENTRY' ? 'COMPRA_LOCAL_EMERGENCIA' : adjustType === 'BREAKAGE' ? 'QUEBRA_DESCARTE' : 'AJUSTE_INVENTARIO'),
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
              className="w-full h-10 rounded-xl border border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-[#1f0338] px-3 text-xs font-bold text-purple-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ENTRY">+ Entrada / Compra Local Emergencial</option>
              <option value="BREAKAGE">- Saída por Quebra / Descarte / Perda</option>
              <option value="COUNT">= Correção de Saldo por Contagem Física</option>
            </select>
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-purple-950 dark:text-white">
              {adjustType === 'ENTRY' && `Quantidade a Adicionar (${item.unit})`}
              {adjustType === 'BREAKAGE' && `Quantidade Descartada / Quebrada (${item.unit})`}
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
              placeholder="Ex: Compra emergencial Makro, fruta oxidada, conferência..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 rounded-xl border-purple-200 dark:border-white/15 bg-purple-50/50 dark:bg-white/5 text-xs text-purple-950 dark:text-white"
            />
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
