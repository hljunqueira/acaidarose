'use client'

import React, { useState, useEffect } from 'react'
import { RestaurantTable } from '@/types/tables'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface AddEditTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: RestaurantTable | null
  tenantId: string
  onSuccess: () => void
}

export default function AddEditTableDialog({
  open,
  onOpenChange,
  table,
  tenantId,
  onSuccess,
}: AddEditTableDialogProps) {
  const [isBatch, setIsBatch] = useState(false)
  const [number, setNumber] = useState('1')
  const [startNumber, setStartNumber] = useState('1')
  const [endNumber, setEndNumber] = useState('10')
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (table) {
      setIsBatch(false)
      setNumber(table.number.toString())
      setNickname(table.nickname || '')
    } else {
      setIsBatch(false)
      setNumber('1')
      setStartNumber('1')
      setEndNumber('10')
      setNickname('')
    }
  }, [table, open])

  const numStart = parseInt(startNumber) || 1
  const numEnd = parseInt(endNumber) || 1
  const totalBatchCount = Math.max(1, numEnd - numStart + 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isBatch && !table) {
        const res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            isBatch: true,
            startNumber: numStart,
            endNumber: numEnd,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Falha ao criar lote de mesas')
        }
        toast.success(`${totalBatchCount} mesas adicionadas com sucesso!`)
      } else {
        const tableNum = table ? table.number : (Number(number) || 1)
        const payload = {
          tenantId,
          number: tableNum,
          code: table?.code || `QR-MESA-${tableNum}`,
          nickname: nickname.trim() || `Mesa ${tableNum.toString().padStart(2, '0')}`,
          serviceChargePercent: 0,
          status: table?.status || 'AVAILABLE',
        }

        const url = table ? `/api/tables/${table.id}` : '/api/tables'
        const method = table ? 'PUT' : 'POST'

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Falha ao guardar mesa')
        }
        toast.success(table ? `Mesa ${tableNum} atualizada!` : `Mesa ${tableNum} adicionada!`)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
            {table ? `Editar Mesa ${table.number}` : 'Adicionar Mesas'}
          </DialogTitle>
        </DialogHeader>

        {/* Alternador de Modo (apenas ao adicionar) */}
        {!table && (
          <div className="grid grid-cols-2 p-1 bg-purple-50 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10 my-1">
            <button
              type="button"
              onClick={() => setIsBatch(false)}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                !isBatch
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              Mesa Única
            </button>
            <button
              type="button"
              onClick={() => setIsBatch(true)}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isBatch
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              Criar em Lote
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {isBatch && !table ? (
            /* Formulário em Lote */
            <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Do Número:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                    required
                    className="h-10 text-xs font-bold rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Até o Número:</Label>
                  <Input
                    type="number"
                    min={startNumber}
                    value={endNumber}
                    onChange={(e) => setEndNumber(e.target.value)}
                    required
                    className="h-10 text-xs font-bold rounded-xl"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Formulário Unitário */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Número da Mesa</Label>
                  {table && (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Bloqueado na edição
                    </span>
                  )}
                </div>
                <Input
                  type="number"
                  min="1"
                  value={table ? table.number : number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                  disabled={Boolean(table)}
                  className={`h-10 text-xs rounded-xl font-bold font-mono ${
                    table
                      ? 'bg-purple-100/50 dark:bg-white/5 opacity-70 cursor-not-allowed border-dashed'
                      : ''
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Apelido / Localização</Label>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {saving
                ? 'A guardar...'
                : table
                ? 'Guardar Alterações'
                : isBatch
                ? `Criar ${totalBatchCount} Mesas`
                : 'Adicionar Mesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
