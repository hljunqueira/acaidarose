'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useCustomerTheme } from '@/lib/hooks/useIsolatedTheme'

interface SwitchTableModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTableNumber: string | number
  tenantId: string
  onTableSwitched: (newTableNumber: string) => void
}

interface TableOption {
  number: number
  type: 'MESA' | 'ESPLANADA'
  nickname?: string
}

export default function SwitchTableModal({
  open,
  onOpenChange,
  currentTableNumber,
  tenantId,
  onTableSwitched,
}: SwitchTableModalProps) {
  const { isDark: isCustomerDark } = useCustomerTheme()
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [availableTables, setAvailableTables] = useState<TableOption[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)

  const currentNum = parseInt(String(currentTableNumber).replace(/\D/g, ''), 10) || 0

  useEffect(() => {
    if (open) {
      setSelectedTable(null)
      setLoading(true)
      fetch(`/api/tables?tenantId=${encodeURIComponent(tenantId || '11111111-1111-1111-1111-111111111111')}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.tables) && data.tables.length > 0) {
            const tableList: TableOption[] = data.tables
              .map((t: any) => ({
                number: Number(t.number || t.table_number),
                type: (t.type || t.table_type || 'MESA') as 'MESA' | 'ESPLANADA',
                nickname: t.nickname,
              }))
              .filter((t: TableOption) => Boolean(t.number))
            setAvailableTables(tableList.sort((a, b) => a.number - b.number))
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, tenantId])

  const handleConfirmSwitch = async () => {
    if (!selectedTable) {
      toast.error('Selecione uma mesa ou esplanada')
      return
    }

    if (selectedTable === currentNum) {
      onOpenChange(false)
      return
    }

    setSwitching(true)
    try {
      const res = await fetch('/api/tables/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          oldTableNumber: currentNum,
          newTableNumber: selectedTable,
        }),
      })

      if (!res.ok) throw new Error('Falha ao atualizar mesa')

      toast.success(`Mesa alterada para o nº ${selectedTable} com sucesso!`)
      onTableSwitched(String(selectedTable))
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao mudar de mesa')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-[92vw] sm:w-full max-w-md p-5 sm:p-6 rounded-3xl shadow-2xl transition-colors duration-200 ${isCustomerDark ? 'dark bg-[#160228] text-white border-white/20' : 'bg-white text-slate-900 border-purple-100'}`}>
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Trocar de Mesa / Esplanada
          </DialogTitle>
          <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
            Selecione a sua nova posição no salão ou esplanada para onde se mudou:
          </p>
        </DialogHeader>

        {/* Grade de Mesas */}
        <div className="py-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
            {availableTables.map((t) => {
              const isCurrent = t.number === currentNum
              const isSelected = selectedTable === t.number
              const isOutdoor = t.type === 'ESPLANADA'

              return (
                <button
                  key={t.number}
                  type="button"
                  onClick={() => setSelectedTable(t.number)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer font-bold ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-transparent shadow-md scale-105'
                      : isCurrent
                      ? 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-500/40'
                      : 'bg-purple-50/50 hover:bg-purple-100/80 text-slate-800 border-purple-150 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-opacity-80">
                    {isOutdoor ? 'Esplanada' : 'Mesa'}
                  </div>
                  <div className="text-base font-black font-mono">{t.number}</div>
                  {isCurrent && <div className="text-[9px] font-extrabold mt-0.5 opacity-80">(Atual)</div>}
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-purple-200 dark:border-white/15 text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmSwitch}
            disabled={!selectedTable || switching}
            className="rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black shadow-md cursor-pointer px-5"
          >
            {switching ? 'A transferir...' : 'Confirmar Nova Mesa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
