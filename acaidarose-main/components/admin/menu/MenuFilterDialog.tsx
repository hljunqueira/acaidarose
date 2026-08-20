'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, RotateCcw } from 'lucide-react'

export interface MenuFilterOptions {
  status: 'all' | 'available' | 'unavailable'
  visibility: 'all' | 'visible' | 'hidden'
  minPrice?: number
  maxPrice?: number
}

interface MenuFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFilters: MenuFilterOptions
  onApplyFilters: (filters: MenuFilterOptions) => void
}

export default function MenuFilterDialog({
  open,
  onOpenChange,
  currentFilters,
  onApplyFilters,
}: MenuFilterDialogProps) {
  const [status, setStatus] = useState<'all' | 'available' | 'unavailable'>(currentFilters.status || 'all')
  const [visibility, setVisibility] = useState<'all' | 'visible' | 'hidden'>(currentFilters.visibility || 'all')
  const [minPrice, setMinPrice] = useState<string>(currentFilters.minPrice ? String(currentFilters.minPrice) : '')
  const [maxPrice, setMaxPrice] = useState<string>(currentFilters.maxPrice ? String(currentFilters.maxPrice) : '')

  const handleApply = () => {
    onApplyFilters({
      status,
      visibility,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setStatus('all')
    setVisibility('all')
    setMinPrice('')
    setMaxPrice('')
    onApplyFilters({
      status: 'all',
      visibility: 'all',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-white rounded-md border border-zinc-200 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-2">
          <Filter className="h-4 w-4 text-purple-700" />
          <DialogTitle className="text-base font-bold text-zinc-800">
            Filtrar Produtos do Cardápio
          </DialogTitle>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Disponibilidade */}
          <div className="space-y-1.5">
            <Label className="text-zinc-700 font-bold">Disponibilidade no Estoque:</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'all', label: 'Todos' },
                { val: 'available', label: 'Disponíveis' },
                { val: 'unavailable', label: 'Pausados' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setStatus(opt.val as any)}
                  className={`py-2 px-3 rounded-sm border text-xs font-medium transition cursor-pointer ${
                    status === opt.val
                      ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibilidade no QR Code */}
          <div className="space-y-1.5">
            <Label className="text-zinc-700 font-bold">Visibilidade no Cardápio QR Code:</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'all', label: 'Todos' },
                { val: 'visible', label: '🟢 Visíveis' },
                { val: 'hidden', label: '🔴 Ocultos' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setVisibility(opt.val as any)}
                  className={`py-2 px-3 rounded-sm border text-xs font-medium transition cursor-pointer ${
                    visibility === opt.val
                      ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa de Preço */}
          <div className="space-y-1.5">
            <Label className="text-zinc-700 font-bold">Faixa de Preço (€):</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Mínimo (€ 0,00)"
                  className="h-9 text-xs border-zinc-300 rounded-sm font-mono"
                />
              </div>
              <div>
                <Input
                  type="number"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Máximo (€ 30,00)"
                  className="h-9 text-xs border-zinc-300 rounded-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpar Filtros</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 rounded-sm hover:bg-zinc-100 cursor-pointer uppercase shadow-2xs"
            >
              FECHAR
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-sm cursor-pointer uppercase shadow-xs"
            >
              APLICAR
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
