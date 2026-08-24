'use client'

import React, { useState, useEffect } from 'react'
import { RestaurantTable } from '@/types/tables'
import { StaffMember } from '@/types/staff'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Store, Layers } from 'lucide-react'

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
        if (!res.ok) throw new Error('Falha ao criar lote de mesas')
        toast.success(`${totalBatchCount} mesas criadas com sucesso!`)
      } else {
        const payload = {
          tenantId,
          number: Number(number),
          code: number,
          nickname: nickname || `Mesa ${number.padStart(2, '0')}`,
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

        if (!res.ok) throw new Error('Falha ao guardar mesa')
        toast.success(table ? 'Mesa atualizada!' : `Mesa ${number} adicionada ao salão!`)
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
      <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#160228] border border-purple-100 dark:border-white/15 shadow-2xl text-slate-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-purple-950 dark:text-white flex items-center gap-2">
            <Store className="h-4 w-4 text-purple-700 dark:text-pink-400" />
            <span>{table ? `Editar Mesa ${table.number}` : 'Adicionar Mesas'}</span>
          </DialogTitle>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70">
            Configure as mesas físicas do salão para gerar os QR Codes de autoatendimento.
          </p>
        </DialogHeader>

        {/* Abas Alternador: Individual vs Lote (apenas se for criação) */}
        {!table && (
          <div className="grid grid-cols-2 p-1 bg-purple-50/70 dark:bg-white/5 rounded-2xl border border-purple-150 dark:border-white/10 my-2">
            <button
              type="button"
              onClick={() => setIsBatch(false)}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
              className={`py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                isBatch
                  ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-xs'
                  : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              Criar em Lote (ex: 1 a 10)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 my-2">
          {isBatch && !table ? (
            /* Formulário em Lote */
            <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-white/5 rounded-2xl border border-purple-100 dark:border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Do Número:</Label>
                  <Input
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                    required
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-purple-950 dark:text-white">Até o Número:</Label>
                  <Input
                    type="number"
                    min={startNumber}
                    value={endNumber}
                    onChange={(e) => setEndNumber(e.target.value)}
                    required
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="text-[11px] text-purple-700 dark:text-purple-200/80 font-medium">
                Serão criadas <strong className="text-purple-950 dark:text-white">{totalBatchCount} mesas</strong> prontas com QR Codes automáticos.
              </div>
            </div>
          ) : (
            /* Formulário Unitário */
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Número da Mesa *</Label>
                <Input
                  type="number"
                  min="1"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ex: 1"
                  required
                  className="h-10 text-xs rounded-xl font-bold font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Apelido / Localização (Opcional)</Label>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Esplanada, Salão Principal, Varanda"
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
              {saving ? 'A guardar...' : table ? 'Guardar Alterações' : isBatch ? `Criar ${totalBatchCount} Mesas` : 'Adicionar Mesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
