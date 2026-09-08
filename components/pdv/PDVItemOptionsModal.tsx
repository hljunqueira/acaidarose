'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Check } from 'lucide-react'
import { toast } from 'sonner'

interface PDVItemOptionsModalProps {
  product: ProductContainer | null
  open: boolean
  onClose: () => void
  onConfirm: (itemPayload: {
    containerId: string
    containerName: string
    unitPrice: number
    quantity: number
    lineTotal: number
    selectedOptions: any[]
    observations?: string
  }) => void
}

export default function PDVItemOptionsModal({
  product,
  open,
  onClose,
  onConfirm,
}: PDVItemOptionsModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  // Mapeamento de seleções de opções: { [groupId]: optionId[] }
  const initialMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    if (!product || !Array.isArray(product.optionGroups)) return map

    for (const grp of product.optionGroups) {
      const defaultOpts = (grp.options || []).filter((o: any) => o.default).map((o: any) => o.id)
      if (defaultOpts.length > 0) {
        map[grp.id] = defaultOpts
      } else if (grp.required && (grp.min || 1) === 1 && grp.options && grp.options.length > 0) {
        map[grp.id] = [grp.options[0].id]
      } else {
        map[grp.id] = []
      }
    }
    return map
  }, [product])

  const [selectedMap, setSelectedMap] = useState<Record<string, string[]>>(initialMap)

  useEffect(() => {
    if (open) {
      setSelectedMap(initialMap)
      setQuantity(1)
      setNotes('')
    }
  }, [open, initialMap])

  if (!product) return null

  const unitBasePrice = product.precoBase || 0

  // Soma dos opcionais
  let optionsSum = 0
  if (Array.isArray(product.optionGroups)) {
    for (const grp of product.optionGroups) {
      const ids = selectedMap[grp.id] || []
      for (const optId of ids) {
        const opt = (grp.options || []).find((o: any) => o.id === optId)
        if (opt && typeof opt.price === 'number') {
          optionsSum += opt.price
        }
      }
    }
  }

  const effectivePrice = unitBasePrice + optionsSum
  const lineTotal = effectivePrice * quantity

  const handleToggle = (groupId: string, optionId: string, max: number = 1, isRequired: boolean = false) => {
    setSelectedMap((prev) => {
      const current = prev[groupId] || []
      if (max === 1) {
        if (current.includes(optionId) && !isRequired) {
          return { ...prev, [groupId]: [] }
        }
        return { ...prev, [groupId]: [optionId] }
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) }
        } else {
          if (current.length >= max) {
            toast.info(`Máximo de ${max} opções permitidas`)
            return prev
          }
          return { ...prev, [groupId]: [...current, optionId] }
        }
      }
    })
  }

  const handleSave = () => {
    // Validação
    if (Array.isArray(product.optionGroups)) {
      for (const grp of product.optionGroups) {
        const selected = selectedMap[grp.id] || []
        const min = grp.min !== undefined ? grp.min : grp.required ? 1 : 0
        if (min > 0 && selected.length < min) {
          toast.error(`Por favor selecione uma opção para: ${grp.name}`)
          return
        }
      }
    }

    const selectedOptionsList: any[] = []
    if (Array.isArray(product.optionGroups)) {
      for (const grp of product.optionGroups) {
        const ids = selectedMap[grp.id] || []
        for (const optId of ids) {
          const opt = (grp.options || []).find((o: any) => o.id === optId)
          if (opt) {
            selectedOptionsList.push({
              groupId: grp.id,
              groupName: grp.name,
              id: opt.id,
              name: opt.name,
              price: opt.price || 0,
            })
          }
        }
      }
    }

    onConfirm({
      containerId: product.id,
      containerName: product.name,
      unitPrice: effectivePrice,
      quantity,
      lineTotal: +lineTotal.toFixed(2),
      selectedOptions: selectedOptionsList,
      observations: notes.trim() || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border border-purple-150 dark:border-white/20 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-purple-100 dark:border-white/10 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-pink-400">
            PDV Balcão · Personalização Rápida
          </span>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* GRUPOS DE OPÇÕES (MODIFICADORES) */}
          {Array.isArray(product.optionGroups) && product.optionGroups.length > 0 ? (
            product.optionGroups.map((grp: any) => {
              const selected = selectedMap[grp.id] || []
              const max = grp.max || 1
              const isRequired = grp.required || (grp.min && grp.min > 0)

              return (
                <div
                  key={grp.id}
                  className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-950 dark:text-white">{grp.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-purple-300">
                        {max === 1 ? 'Selecione 1 opção' : `Até ${max} opções`}
                      </div>
                    </div>
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isRequired
                          ? 'bg-purple-200/80 text-purple-900 dark:bg-pink-600/30 dark:text-pink-300'
                          : 'bg-slate-200/70 text-slate-700 dark:bg-white/10 dark:text-purple-200'
                      }`}
                    >
                      {isRequired ? 'Obrigatório' : 'Opcional'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    {(grp.options || []).map((opt: any) => {
                      const isSelected = selected.includes(opt.id)
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleToggle(grp.id, opt.id, max, isRequired)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-900 text-white border-purple-900 dark:bg-pink-600 dark:border-pink-600 shadow-xs'
                              : 'bg-white dark:bg-white/5 border-purple-100 dark:border-white/10 text-slate-800 dark:text-purple-100 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-white text-purple-900 dark:text-pink-600 border-white'
                                  : 'border-slate-300 dark:border-white/30'
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                            <span>{opt.name}</span>
                          </div>
                          {typeof opt.price === 'number' && opt.price > 0 && (
                            <span className={`font-mono text-[11px] font-bold ${isSelected ? 'text-pink-200' : 'text-purple-700 dark:text-pink-400'}`}>
                              +{formatCurrency(opt.price)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-xs text-slate-500 py-2">Sem modificadores extras para este produto.</div>
          )}

          {/* Quantidade e Preço */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-purple-200 block">Quantidade</span>
              <span className="text-sm font-bold text-purple-700 dark:text-pink-300 font-mono">
                {formatCurrency(effectivePrice)} un.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-white flex items-center justify-center font-bold disabled:opacity-40 hover:bg-purple-200 cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-base w-6 text-center font-mono">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-white flex items-center justify-center font-bold hover:bg-purple-200 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Observações da Copa */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-purple-200">
              Observações para a Copa / Cozinha:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem açúcar, muito gelo..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl text-xs font-bold h-10 border-purple-200 dark:border-white/15"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="flex-2 rounded-xl text-xs font-bold h-10 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20"
          >
            Adicionar • {formatCurrency(lineTotal)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
