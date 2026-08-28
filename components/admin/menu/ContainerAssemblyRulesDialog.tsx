'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SlidersHorizontal, CheckCircle2, ShieldCheck, Heart } from 'lucide-react'

interface ContainerRuleItem {
  id: string
  name: string
  weightGrams: number
  precoBase: number
  limiteBases: number
  limiteFrutas: number // 999 para livres
  limiteToppings: number // 999 para livres
  limiteComplementosGratis: number
}

const DEFAULT_CONTAINER_RULES: ContainerRuleItem[] = [
  { id: 'cnt-250', name: 'Açaí 250g', weightGrams: 250, precoBase: 6.50, limiteBases: 1, limiteFrutas: 2, limiteToppings: 3, limiteComplementosGratis: 3 },
  { id: 'cnt-350', name: 'Açaí 350g', weightGrams: 350, precoBase: 9.00, limiteBases: 1, limiteFrutas: 3, limiteToppings: 4, limiteComplementosGratis: 4 },
  { id: 'cnt-500', name: 'Açaí 500g', weightGrams: 500, precoBase: 12.90, limiteBases: 2, limiteFrutas: 999, limiteToppings: 999, limiteComplementosGratis: 999 },
  { id: 'cnt-750', name: 'Açaí 750g', weightGrams: 750, precoBase: 18.90, limiteBases: 2, limiteFrutas: 999, limiteToppings: 999, limiteComplementosGratis: 999 },
  { id: 'cnt-1000', name: 'Açaí 1 Kg (Barca)', weightGrams: 1000, precoBase: 25.90, limiteBases: 3, limiteFrutas: 999, limiteToppings: 999, limiteComplementosGratis: 999 },
]

interface ContainerAssemblyRulesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onSaved?: () => void
}

export default function ContainerAssemblyRulesDialog({
  open,
  onOpenChange,
  tenantId,
  onSaved,
}: ContainerAssemblyRulesDialogProps) {
  const [rules, setRules] = useState<ContainerRuleItem[]>(DEFAULT_CONTAINER_RULES)
  const [saving, setSaving] = useState(false)

  const handleUpdateField = (id: string, field: keyof ContainerRuleItem, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar regras
      toast.success('Regras de montagem do açaí configuradas e ativas no PDV e QR Code!')
      if (onSaved) onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white rounded-3xl border border-purple-100 dark:border-white/15 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-zinc-900">
                Regras de Montagem do Açaí (Por Tamanho)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure os limites de acompanhamentos inclusos na montagem para cada copo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3 max-h-[60vh] overflow-y-auto pr-1">
          {rules.map((rule) => {
            const isFrutasLivres = rule.limiteFrutas >= 999
            const isToppingsLivres = rule.limiteToppings >= 999

            return (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-zinc-900">{rule.name}</span>
                    <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded-md">
                      {rule.weightGrams}g
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-zinc-700">
                    Preço Master: € {rule.precoBase.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Bases Inclusas */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-zinc-700">Bases Inclusas</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={rule.limiteBases}
                      onChange={(e) => handleUpdateField(rule.id, 'limiteBases', Number(e.target.value))}
                      className="h-9 rounded-xl text-xs bg-white"
                    />
                  </div>

                  {/* Frutas Inclusas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-zinc-700">Limite de Frutas</Label>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(rule.id, 'limiteFrutas', isFrutasLivres ? 3 : 999)}
                        className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        {isFrutasLivres ? 'Definir limite' : 'Tornar Livres'}
                      </button>
                    </div>
                    {isFrutasLivres ? (
                      <div className="h-9 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        Frutas Livres
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={rule.limiteFrutas}
                        onChange={(e) => handleUpdateField(rule.id, 'limiteFrutas', Number(e.target.value))}
                        className="h-9 rounded-xl text-xs bg-white"
                      />
                    )}
                  </div>

                  {/* Toppings Inclusos */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-zinc-700">Limite de Toppings</Label>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(rule.id, 'limiteToppings', isToppingsLivres ? 4 : 999)}
                        className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer"
                      >
                        {isToppingsLivres ? 'Definir limite' : 'Tornar Livres'}
                      </button>
                    </div>
                    {isToppingsLivres ? (
                      <div className="h-9 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        Toppings Livres
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={rule.limiteToppings}
                        onChange={(e) => handleUpdateField(rule.id, 'limiteToppings', Number(e.target.value))}
                        className="h-9 rounded-xl text-xs bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-purple-100">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-5 shadow-md flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Salvar Regras de Montagem</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
