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
  staffList: StaffMember[]
  onSuccess: () => void
}

export default function AddEditTableDialog({
  open,
  onOpenChange,
  table,
  tenantId,
  staffList,
  onSuccess,
}: AddEditTableDialogProps) {
  const [isBatch, setIsBatch] = useState(false)
  const [number, setNumber] = useState('1')
  const [startNumber, setStartNumber] = useState('1')
  const [endNumber, setEndNumber] = useState('10')
  const [nickname, setNickname] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [serviceChargePercent, setServiceChargePercent] = useState('0')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (table) {
      setIsBatch(false)
      setNumber(table.number.toString())
      setNickname(table.nickname || '')
      setAssignedStaffId(table.assignedStaffId || '')
      setServiceChargePercent((table.serviceChargePercent || 0).toString())
    } else {
      setIsBatch(false)
      setNumber('1')
      setStartNumber('1')
      setEndNumber('10')
      setNickname('')
      setAssignedStaffId('')
      setServiceChargePercent('0')
    }
  }, [table, open])

  const numStart = parseInt(startNumber) || 1
  const numEnd = parseInt(endNumber) || 1
  const totalBatchCount = Math.max(1, numEnd - numStart + 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const selectedStaff = staffList.find((s) => s.id === assignedStaffId)

      if (isBatch && !table) {
        const res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            isBatch: true,
            startNumber: numStart,
            endNumber: numEnd,
            assignedStaffId: selectedStaff ? selectedStaff.id : null,
            assignedStaffName: selectedStaff ? (selectedStaff.nickname || selectedStaff.name) : null,
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
          serviceChargePercent: Number(serviceChargePercent) || 0,
          status: table?.status || 'AVAILABLE',
          assignedStaffId: selectedStaff ? selectedStaff.id : null,
          assignedStaffName: selectedStaff ? (selectedStaff.nickname || selectedStaff.name) : null,
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
      <DialogContent className="max-w-md p-6 rounded-3xl bg-white border border-purple-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
            <Store className="h-4 w-4 text-purple-700" />
            <span>{table ? `Editar Mesa ${table.number}` : isBatch ? 'Adicionar Lote de Mesas' : 'Cadastrar Nova Mesa'}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Seletor de Modo: Individual vs Lote */}
        {!table && (
          <div className="flex bg-purple-50/80 p-1.5 rounded-2xl gap-1 border border-purple-100/60 my-1">
            <button
              type="button"
              onClick={() => setIsBatch(false)}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                !isBatch
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-900 hover:bg-purple-100/60'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Mesa Individual</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatch(true)}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                isBatch
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-purple-900 hover:bg-purple-100/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Criar em Lote (ex: 1 a 20)</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {isBatch && !table ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Mesa Inicial (De)</Label>
                <Input
                  type="number"
                  min="1"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  required
                  className="rounded-2xl h-11 text-xs font-black font-mono border-purple-200 focus:ring-purple-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Mesa Final (Até)</Label>
                <Input
                  type="number"
                  min={startNumber || '1'}
                  value={endNumber}
                  onChange={(e) => setEndNumber(e.target.value)}
                  required
                  className="rounded-2xl h-11 text-xs font-black font-mono border-purple-200 focus:ring-purple-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Número / Código</Label>
                  <Input
                    type="number"
                    min="1"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                    className="rounded-2xl h-11 text-xs font-black font-mono border-purple-200 focus:ring-purple-600 text-center"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Apelido / Setor (Opcional)</Label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="ex: Esplanada 01, Salão Principal"
                    className="rounded-2xl h-11 text-xs border-purple-200 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Pré-visualização da Placa de Mesa */}
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-950 text-white flex items-center justify-center font-black text-sm">
                    {number || '1'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-purple-950">
                      {nickname || `Mesa ${(number || '1').padStart(2, '0')}`}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">● Status Inicial: Disponível / Livre</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-purple-200 text-purple-800">
                  QR Code Automático
                </Badge>
              </div>
            </div>
          )}

          {/* Atendente Designado */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Garçom / Atendente Responsável</Label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-2xl border border-purple-200 bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-purple-600 cursor-pointer"
            >
              <option value="">Sem atendente fixo (Geral)</option>
              {staffList
                .filter((s) => s.active)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nickname || st.name} ({st.code})
                  </option>
                ))}
            </select>
          </div>

          {/* Taxa de Serviço */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Taxa de Serviço Opcional (%)</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={serviceChargePercent}
              onChange={(e) => setServiceChargePercent(e.target.value)}
              className="rounded-2xl h-11 text-xs font-mono border-purple-200 focus:ring-purple-600"
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-2xl text-xs font-bold border-purple-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-10 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-5 shadow-xs cursor-pointer"
            >
              {saving
                ? 'A gravar...'
                : table
                ? 'Atualizar Mesa'
                : isBatch
                ? `Gerar ${totalBatchCount} Mesas em Lote`
                : `Cadastrar Mesa ${number}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
