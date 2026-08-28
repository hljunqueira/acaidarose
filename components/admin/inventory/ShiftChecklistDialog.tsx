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
import { Badge } from '@/components/ui/badge'
import { InventoryItemRow } from '@/lib/repositories/inventoryRepository'

interface ShiftChecklistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criticalItems: InventoryItemRow[]
  onSubmitChecklist: (counts: { itemId: string; theoretical: number; counted: number }[]) => Promise<void> | void
}

export default function ShiftChecklistDialog({
  open,
  onOpenChange,
  criticalItems,
  onSubmitChecklist,
}: ShiftChecklistDialogProps) {
  const [counts, setCounts] = useState<{ [itemId: string]: string }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initial: { [itemId: string]: string } = {}
    criticalItems.forEach((it) => {
      initial[it.id] = String(it.currentQuantity || 0)
    })
    setCounts(initial)
  }, [open, criticalItems])

  const handleInputChange = (itemId: string, val: string) => {
    setCounts((prev) => ({ ...prev, [itemId]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = criticalItems.map((it) => ({
        itemId: it.id,
        theoretical: it.currentQuantity,
        counted: parseFloat(counts[it.id] ?? String(it.currentQuantity)) || 0,
      }))
      await onSubmitChecklist(payload)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#160228] border border-purple-150 dark:border-white/15 text-purple-950 dark:text-white rounded-3xl shadow-2xl">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-black text-purple-950 dark:text-white">
              Checklist Rápido de Fechamento de Turno
            </DialogTitle>
            <Badge className="bg-purple-100 dark:bg-pink-500/20 text-purple-800 dark:text-pink-300 text-[10px] font-bold">
              2 Minutos
            </Badge>
          </div>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 font-medium">
            Conferência física dos itens críticos para auditoria de quebra e apuração do estoque real
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {criticalItems.map((item) => {
              const countedVal = parseFloat(counts[item.id] ?? String(item.currentQuantity)) || 0
              const diff = countedVal - item.currentQuantity

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-150 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-purple-950 dark:text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-purple-700/80 dark:text-purple-200/70">
                      Saldo Teórico: <b className="font-mono">{item.currentQuantity} {item.unit}</b>
                    </div>
                  </div>

                  <div className="w-28 shrink-0 flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={counts[item.id] ?? ''}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      className="h-9 px-2 text-center text-xs font-mono font-black rounded-xl border-purple-200 dark:border-white/15 bg-white dark:bg-white/10 text-purple-950 dark:text-white"
                    />
                    <span className="text-[10px] text-purple-700/70 dark:text-purple-300/60 font-bold">
                      {item.unit}
                    </span>
                  </div>

                  <div className="w-16 text-right shrink-0 font-mono text-[11px] font-bold">
                    {diff === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">0.0</span>
                    ) : diff > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+{diff.toFixed(1)}</span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400">{diff.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-[11px] text-purple-700/80 dark:text-purple-200/70 font-medium">
            Ao confirmar, o sistema atualizará o saldo físico oficial e calculará o índice de quebra no relatório diário.
          </div>

          <DialogFooter className="pt-2 gap-2">
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
              {loading ? 'A registar...' : 'Confirmar Fechamento de Estoque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
