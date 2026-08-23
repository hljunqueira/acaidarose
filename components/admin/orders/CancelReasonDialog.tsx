'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { Order } from '@/types'

interface CancelReasonDialogProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>
  loading?: boolean
}

const CANCEL_REASONS = [
  'Desistência do Cliente',
  'Ingrediente / Item Esgotado',
  'Erro de Lançamento no Caixa',
  'Mesa Transferida / Duplicada',
  'Outro Motivo',
]

export default function CancelReasonDialog({
  order,
  open,
  onOpenChange,
  onConfirmCancel,
  loading = false,
}: CancelReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  if (!order) return null

  const handleConfirm = async () => {
    const finalReason =
      selectedReason === 'Outro Motivo' && customReason.trim()
        ? customReason.trim()
        : selectedReason

    await onConfirmCancel(order.id, finalReason)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#18022b] text-slate-900 dark:text-white border border-red-200 dark:border-red-500/30 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">
              Auditoria de Cancelamento
            </span>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
            Cancelar Comanda #{order.orderNumber || 100}?
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-purple-200/70">
            Selecione o motivo do cancelamento para registro no histórico de auditoria:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 my-3">
          {CANCEL_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                selectedReason === r
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-200 shadow-xs'
                  : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-purple-200/80 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <input
                type="radio"
                name="cancel_reason"
                checked={selectedReason === r}
                onChange={() => setSelectedReason(r)}
                className="text-red-600 focus:ring-red-500 h-3.5 w-3.5"
              />
              <span>{r}</span>
            </label>
          ))}

          {selectedReason === 'Outro Motivo' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
              className="w-full h-9 px-3 text-xs rounded-xl border border-red-300 dark:border-red-500/40 bg-white dark:bg-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100 dark:border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs font-bold text-slate-600 dark:text-purple-300 hover:text-slate-900 dark:hover:text-white"
          >
            Voltar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Confirmar Cancelamento</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
