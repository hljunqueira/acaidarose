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
import { SlidersHorizontal, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'

interface ContainerRuleItem {
  id: string
  name: string
  weightGrams: number
  precoBase: number
  limiteBases: number
  limiteFrutas: number // 999 para livres
  limiteToppings: number // 999 para livres
  limiteComplementosGratis: number
  isBaseFixed: boolean
  rawContainer: any
}

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
  const { authFetch } = useAuthStore()
  const [rules, setRules] = useState<ContainerRuleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const fetchContainers = async () => {
      setLoading(true)
      try {
        const fetcher = authFetch || fetch
        const res = await fetcher(`/api/catalog?tenantId=${encodeURIComponent(tenantId)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.containers)) {
            const mapped: ContainerRuleItem[] = data.containers.map((c: any) => {
              const weight = Number(c.weightGrams) || 0
              const basesGroup = c.optionGroups?.find(
                (g: any) => g.id === 'model-bases' || g.name?.toLowerCase().includes('base') || g.name?.toLowerCase().includes('creme')
              )
              const frutasGroup = c.optionGroups?.find(
                (g: any) => g.id === 'model-frutas' || g.name?.toLowerCase().includes('fruta')
              )
              const toppingsGroup = c.optionGroups?.find(
                (g: any) =>
                  g.id === 'model-toppings' ||
                  g.name?.toLowerCase().includes('acompanhamento') ||
                  g.name?.toLowerCase().includes('topping')
              )

              const isSomenteCreme = (c.name || '').toLowerCase().includes('somente creme') || (c.name || '').toLowerCase().includes('apenas creme')
              const isBaseFixed = basesGroup?.isBaseFixed !== undefined
                ? Boolean(basesGroup.isBaseFixed)
                : !isSomenteCreme

              const limiteBases = basesGroup?.maxQty !== undefined
                ? Number(basesGroup.maxQty)
                : Number(c.limiteBases) || (isBaseFixed ? 1 : 2)

              const limiteFrutas = frutasGroup
                ? Number(frutasGroup.maxQty) || (weight >= 500 ? 999 : weight === 250 ? 2 : 3)
                : weight >= 500 ? 999 : weight === 250 ? 2 : 3

              const limiteToppings = toppingsGroup
                ? Number(toppingsGroup.maxQty) || (weight >= 500 ? 999 : weight === 250 ? 3 : 4)
                : weight >= 500 ? 999 : weight === 250 ? 3 : 4

              return {
                id: c.id,
                name: c.name,
                weightGrams: weight,
                precoBase: Number(c.precoBase) || 0,
                limiteBases,
                limiteFrutas,
                limiteToppings,
                limiteComplementosGratis: limiteToppings,
                isBaseFixed,
                rawContainer: c,
              }
            })
            setRules(mapped)
          }
        }
      } catch (e) {
        console.error('Erro ao carregar copos reais:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchContainers()
  }, [open, tenantId, authFetch])

  const handleUpdateField = (id: string, field: keyof ContainerRuleItem, value: any) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    const fetcher = authFetch || fetch
    try {
      for (const rule of rules) {
        const raw = rule.rawContainer || {}
        let optionGroups = Array.isArray(raw.optionGroups) && raw.optionGroups.length > 0
          ? [...raw.optionGroups]
          : []

        // Sincroniza os grupos de opções reais salvos no PostgreSQL
        if (optionGroups.length > 0) {
          optionGroups = optionGroups.map((g: any) => {
            if (g.id === 'model-bases' || g.name?.toLowerCase().includes('base') || g.name?.toLowerCase().includes('creme')) {
              return {
                ...g,
                maxQty: rule.limiteBases,
                isBaseFixed: rule.isBaseFixed,
              }
            }
            if (g.id === 'model-frutas' || g.name?.toLowerCase().includes('fruta')) {
              return {
                ...g,
                maxQty: rule.limiteFrutas,
              }
            }
            if (g.id === 'model-toppings' || g.name?.toLowerCase().includes('acompanhamento') || g.name?.toLowerCase().includes('topping')) {
              return {
                ...g,
                maxQty: rule.limiteToppings,
              }
            }
            return g
          })
        }

        const res = await fetcher(`/api/products/containers/${rule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...raw,
            limiteBases: rule.limiteBases,
            limiteToppings: rule.limiteToppings,
            limiteComplementosGratis: rule.limiteToppings,
            optionGroups,
          }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || `Erro ao salvar regra para ${rule.name}`)
        }
      }
      toast.success('Regras de montagem do açaí configuradas e salvas no banco de dados!')
      if (onSaved) onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar algumas regras de montagem.')
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
              <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
                Regras de Montagem do Açaí (Por Tamanho)
              </DialogTitle>
              <DialogDescription className="text-xs text-purple-700/80 dark:text-purple-200/70">
                Configure os limites de acompanhamentos inclusos na montagem para cada copo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-purple-700/70 dark:text-purple-300/70">
              Carregando recipientes e copos cadastrados no banco de dados...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-xs text-purple-700/70 dark:text-purple-300/70">
              Nenhum recipiente ou copo de açaí cadastrado no catálogo.
            </div>
          ) : (
            rules.map((rule) => {
            const isFrutasLivres = rule.limiteFrutas >= 999
            const isToppingsLivres = rule.limiteToppings >= 999

            return (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-purple-950 dark:text-white">{rule.name}</span>
                    <span className="text-xs font-mono font-bold text-purple-800 dark:text-pink-300 bg-purple-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                      {rule.weightGrams}g
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-purple-950 dark:text-purple-200">
                    Preço Master: € {rule.precoBase.toFixed(2)}
                  </span>
                </div>

                {/* Seletor de Base Fixa vs Livre */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-purple-100/60 dark:bg-white/5 border border-purple-200/60 dark:border-white/10">
                  <span className="text-xs font-bold text-purple-950 dark:text-white">
                    Regra da Base:
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateField(rule.id, 'isBaseFixed', true)
                        handleUpdateField(rule.id, 'limiteBases', 1)
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        rule.isBaseFixed
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white dark:bg-white/10 text-purple-900 dark:text-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      Açaí Tradicional Fixo + 1 Creme Incluso
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateField(rule.id, 'isBaseFixed', false)
                        handleUpdateField(rule.id, 'limiteBases', 2)
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        !rule.isBaseFixed
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white dark:bg-white/10 text-purple-900 dark:text-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      Livre Escolha (Somente Creme)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Bases Inclusas */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                      {rule.isBaseFixed ? 'Cremes Gelados Inclusos' : 'Bases/Cremes Inclusos'}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={rule.limiteBases}
                      onChange={(e) => handleUpdateField(rule.id, 'limiteBases', Number(e.target.value))}
                      className="h-9 rounded-xl text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                    />
                    <p className="text-[10px] text-purple-700/80 dark:text-purple-300/70 font-medium">
                      {rule.isBaseFixed ? 'Açaí é fixo. +1 creme incluso grátis.' : 'Cliente escolhe os cremes livremente.'}
                    </p>
                  </div>

                  {/* Frutas Inclusas */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Limite de Frutas</Label>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(rule.id, 'limiteFrutas', isFrutasLivres ? 3 : 999)}
                        className="text-[10px] font-bold text-purple-700 dark:text-pink-400 hover:underline cursor-pointer"
                      >
                        {isFrutasLivres ? 'Definir limite' : 'Tornar Livres'}
                      </button>
                    </div>
                    {isFrutasLivres ? (
                      <div className="h-9 rounded-xl bg-emerald-100/70 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        Frutas Livres
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={rule.limiteFrutas}
                        onChange={(e) => handleUpdateField(rule.id, 'limiteFrutas', Number(e.target.value))}
                        className="h-9 rounded-xl text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                      />
                    )}
                  </div>

                  {/* Toppings Inclusos */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">Limite de Toppings</Label>
                      <button
                        type="button"
                        onClick={() => handleUpdateField(rule.id, 'limiteToppings', isToppingsLivres ? 4 : 999)}
                        className="text-[10px] font-bold text-purple-700 dark:text-pink-400 hover:underline cursor-pointer"
                      >
                        {isToppingsLivres ? 'Definir limite' : 'Tornar Livres'}
                      </button>
                    </div>
                    {isToppingsLivres ? (
                      <div className="h-9 rounded-xl bg-emerald-100/70 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                        Toppings Livres
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={rule.limiteToppings}
                        onChange={(e) => handleUpdateField(rule.id, 'limiteToppings', Number(e.target.value))}
                        className="h-9 rounded-xl text-xs bg-white dark:bg-white/10 border border-purple-200 dark:border-white/15 text-purple-950 dark:text-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          }))}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-purple-100 dark:border-white/10">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl text-xs font-bold border border-purple-200 dark:border-white/15 bg-purple-50 dark:bg-white/5 text-purple-950 dark:text-white hover:bg-purple-100 dark:hover:bg-white/10 cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-10 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs px-5 shadow-lg shadow-pink-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Salvar Regras de Montagem</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
