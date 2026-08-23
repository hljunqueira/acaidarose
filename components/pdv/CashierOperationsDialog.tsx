'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface CashierOperationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  operatorName: string
  onSuccess?: () => void
}

export default function CashierOperationsDialog({
  open,
  onOpenChange,
  tenantId,
  operatorName,
  onSuccess,
}: CashierOperationsDialogProps) {
  const [opType, setOpType] = useState<'SUPPLY' | 'BLEED'>('SUPPLY')
  const [amount, setAmount] = useState('50.00')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0 || !reason) {
      toast.error('Informe o valor e o motivo da movimentação')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cashier/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          type: opType,
          amount: Number(amount),
          reason,
          operatorName,
        }),
      })

      if (!res.ok) throw new Error('Falha ao registar operação')
      toast.success(opType === 'SUPPLY' ? 'Suprimento registado com sucesso!' : 'Sangria de caixa registada!')
      setReason('')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gravar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground">
            Movimentação de Caixa (Troco / Sangria)
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Registo avulso de entrada de troco ou retirada de dinheiro para conferência de caixa.
          </p>
        </DialogHeader>

        {/* Tipo de Operação */}
        <div className="flex bg-purple-50 p-1 rounded-xl gap-1 my-2">
          <button
            type="button"
            onClick={() => setOpType('SUPPLY')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              opType === 'SUPPLY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-purple-700'
            }`}
          >
            Suprimento (Entrada de Troco)
          </button>
          <button
            type="button"
            onClick={() => setOpType('BLEED')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              opType === 'BLEED' ? 'bg-amber-600 text-white shadow-xs' : 'text-purple-700'
            }`}
          >
            Sangria (Retirada de Dinheiro)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">Valor (€):</Label>
            <Input
              type="number"
              step="0.5"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-10 text-xs font-bold font-mono rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">Motivo / Justificativa:</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={opType === 'SUPPLY' ? 'ex: Fundo de troco de abertura' : 'ex: Recolha para o cofre'}
              required
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`text-white font-bold text-xs ${opType === 'SUPPLY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {loading ? 'A gravar...' : 'Registar Movimentação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
