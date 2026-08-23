'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/i18n/formatters'
import { toast } from 'sonner'

interface SplitBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  tableNumber: number
  onConfirmSplit: (methodShares: { method: string; amount: number }[]) => void
}

export default function SplitBillDialog({
  open,
  onOpenChange,
  total,
  tableNumber,
  onConfirmSplit,
}: SplitBillDialogProps) {
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL')
  const [numPeople, setNumPeople] = useState('2')
  const [mbwayAmount, setMbwayAmount] = useState('0')
  const [cashAmount, setCashAmount] = useState('0')
  const [cardAmount, setCardAmount] = useState('0')

  const peopleCount = Math.max(1, Number(numPeople) || 1)
  const perPerson = +(total / peopleCount).toFixed(2)

  const handleApply = () => {
    if (splitMode === 'EQUAL') {
      toast.success(`Conta da Mesa ${tableNumber} dividida em ${peopleCount}x de ${formatCurrency(perPerson)}!`)
      onConfirmSplit([
        { method: 'DIVISAO_IGUAL', amount: total },
      ])
    } else {
      const sum = Number(mbwayAmount) + Number(cashAmount) + Number(cardAmount)
      if (Math.abs(sum - total) > 0.05) {
        toast.error(`A soma dos valores (${formatCurrency(sum)}) deve ser igual ao total da mesa (${formatCurrency(total)})`)
        return
      }
      toast.success('Divisão de métodos registrada!')
      onConfirmSplit([
        { method: 'MBWAY', amount: Number(mbwayAmount) },
        { method: 'NUMERARIO', amount: Number(cashAmount) },
        { method: 'CARTAO', amount: Number(cardAmount) },
      ].filter((s) => s.amount > 0))
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground">
            Divisão de Conta — Mesa {tableNumber}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Total da Comanda: <span className="font-black text-purple-950">{formatCurrency(total)}</span>
          </p>
        </DialogHeader>

        {/* Modo de Divisão */}
        <div className="flex bg-purple-50 p-1 rounded-xl gap-1 my-2">
          <button
            type="button"
            onClick={() => setSplitMode('EQUAL')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              splitMode === 'EQUAL' ? 'bg-white text-purple-950 shadow-xs' : 'text-purple-700'
            }`}
          >
            Dividir por Pessoas
          </button>
          <button
            type="button"
            onClick={() => {
              setSplitMode('CUSTOM')
              setMbwayAmount((total / 2).toFixed(2))
              setCashAmount((total / 2).toFixed(2))
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              splitMode === 'CUSTOM' ? 'bg-white text-purple-950 shadow-xs' : 'text-purple-700'
            }`}
          >
            Métodos Mistos
          </button>
        </div>

        {splitMode === 'EQUAL' ? (
          <div className="space-y-4 my-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Número de Pessoas na Mesa:</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={numPeople}
                onChange={(e) => setNumPeople(e.target.value)}
                className="h-10 text-xs font-bold font-mono rounded-xl"
              />
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 text-center">
              <div className="text-[11px] text-muted-foreground font-semibold">Valor por pessoa:</div>
              <div className="text-2xl font-black text-purple-950 mt-0.5">{formatCurrency(perPerson)}</div>
              <div className="text-[10px] text-purple-700 mt-1">{peopleCount} pagamentos iguais</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 my-2 text-xs">
            <div className="space-y-1">
              <Label className="font-bold">Valor em MB Way (€):</Label>
              <Input
                type="number"
                step="0.5"
                value={mbwayAmount}
                onChange={(e) => setMbwayAmount(e.target.value)}
                className="h-9 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Valor em Numerário (€):</Label>
              <Input
                type="number"
                step="0.5"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="h-9 font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Valor em Multibanco / Cartão (€):</Label>
              <Input
                type="number"
                step="0.5"
                value={cardAmount}
                onChange={(e) => setCardAmount(e.target.value)}
                className="h-9 font-mono"
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleApply} className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs">
            Confirmar Divisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
