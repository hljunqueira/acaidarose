'use client'

import React, { useState, useMemo } from 'react'
import { ProductContainer, ProductBase, ProductTopping, CatalogData } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Check, Plus, Minus } from 'lucide-react'
import { useCustomerTheme } from '@/lib/hooks/useIsolatedTheme'

interface CustomerProductDetailProps {
  container: ProductContainer | null
  catalog: CatalogData
  tenantId?: string
  onClose: () => void
  onAddToCart: (item: any) => void
  viewOnly?: boolean
}

const CUP_IMAGES: Record<number, string> = {
  250: '/images/official/acai_copo_250g.jpg',
  350: '/images/official/acai_copo_350g.jpg',
  500: '/images/official/acai_copo_500g.jpg',
  750: '/images/official/acai_tigela_750g.jpg',
  1000: '/images/official/acai_balde_1kg.jpg',
}

import { isProductTimeAvailable } from './CustomerMenuHome'

const CUP_VIDEOS: Record<number, string> = {
  250: '/videos/hero_revealing_cup.mp4',
  350: '/videos/hero_orbiting_cup.mp4',
  500: '/videos/hero_cup_rotation.mp4',
  750: '/videos/hero_gliding_texture.mp4',
  1000: '/videos/hero_cup_rotation.mp4',
}

function getToppingItemPrice(topping: ProductTopping, weightGrams?: number): number {
  const nameLower = (topping.name || '').toLowerCase()
  const isLarge = (weightGrams || 500) > 500 // 750g and 1000g

  // Creme de Pistache: +2€ até 500g / +4€ acima de 500g
  if (nameLower.includes('pistache')) {
    return isLarge ? 4.0 : 2.0
  }
  // Creme de Ninho / Nutella: +1€ até 500g / +2€ acima de 500g
  if (nameLower.includes('ninho') || nameLower.includes('nutella')) {
    return isLarge ? 2.0 : 1.0
  }

  if (topping.precoExtra && Number(topping.precoExtra) > 0) {
    return Number(topping.precoExtra)
  }
  return 0
}

export default function CustomerProductDetail({
  container,
  catalog,
  tenantId = 'tenant-torres-novas',
  onClose,
  onAddToCart,
  viewOnly = false,
}: CustomerProductDetailProps) {
  const { isDark: isCustomerDark } = useCustomerTheme()
  if (!container) return null

  // Filtra bases e opcionais ativos (itens invisíveis são ocultados)
  const bases = useMemo(() => {
    return (catalog.bases || []).filter(
      (b) => b.active !== false && isProductTimeAvailable(b.availableHours)
    )
  }, [catalog.bases])

  const allToppings = useMemo(() => {
    return (catalog.toppings || []).filter(
      (t) => t.active !== false && isProductTimeAvailable(t.availableHours)
    )
  }, [catalog.toppings])

  // Suporte a grupos de opções dinâmicos configurados no produto
  const hasDynamicGroups = !!(container.optionGroups && container.optionGroups.length > 0)
  const [customSelections, setCustomSelections] = useState<Record<string, Record<string, number>>>({})

  const [selectedBases, setSelectedBases] = useState<ProductBase[]>([bases?.[0]].filter(Boolean))
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([])
  const [notes, setNotes] = useState('')
  const quantity = 1

  const isUnlimited = container.weightGrams >= 500
  const maxFrutas = container.limiteFrutas || (isUnlimited ? 999 : container.weightGrams === 250 ? 2 : 3)
  const maxToppingsGratis = container.limiteToppings || (isUnlimited ? 999 : container.weightGrams === 350 ? 4 : 3)

  const frutas = useMemo(() => {
    return allToppings.filter((t) => 
      t.category === 'Frutas' || 
      ['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f))
    )
  }, [allToppings])

  const toppingsTradicionais = useMemo(() => {
    return allToppings.filter((t) => 
      !t.isPremium && 
      t.category !== 'Frutas' && 
      t.category !== 'Adicionais' && 
      !['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f))
    )
  }, [allToppings])

  const caldasPremium = useMemo(() => {
    return allToppings.filter((t) => 
      t.isPremium || 
      t.category === 'Adicionais' || 
      (t.precoExtra && t.precoExtra > 0)
    )
  }, [allToppings])

  const selectedFrutas = selectedToppings.filter((t) => frutas.some((f) => f.id === t.id))
  const selectedExtras = selectedToppings.filter((t) => toppingsTradicionais.some((top) => top.id === t.id))
  const selectedPremiums = selectedToppings.filter((t) => caldasPremium.some((p) => p.id === t.id))

  // Regras de Preços Canônicas / Dinâmicas
  const basePrice = container.precoBase
  const extraBasesCount = Math.max(0, selectedBases.length - 1)
  const basesModel = (container.optionGroups || []).find((g: any) => g.id === 'model-bases' || g.name?.toLowerCase().includes('base') || g.name?.toLowerCase().includes('creme'))
  const toppingsModel = (container.optionGroups || []).find((g: any) => g.id === 'model-toppings' || g.name?.toLowerCase().includes('acompanhamento') || g.name?.toLowerCase().includes('topping'))
  const frutasModel = (container.optionGroups || []).find((g: any) => g.id === 'model-frutas' || g.name?.toLowerCase().includes('fruta'))

  const additionalBasePrice = basesModel?.additionalPrice !== undefined ? Number(basesModel.additionalPrice) : 2.0
  const additionalToppingPrice = toppingsModel?.additionalPrice !== undefined ? Number(toppingsModel.additionalPrice) : 0.50
  const additionalFrutaPrice = frutasModel?.additionalPrice !== undefined ? Number(frutasModel.additionalPrice) : 0.50

  const extraBasesPrice = extraBasesCount * additionalBasePrice
  const extraToppingsCount = isUnlimited ? 0 : Math.max(0, selectedExtras.length - maxToppingsGratis)
  const extraToppingsPrice = extraToppingsCount * additionalToppingPrice

  const premiumsPrice = selectedPremiums.reduce((acc, top) => {
    return acc + getToppingItemPrice(top, container.weightGrams)
  }, 0)
  const extraPremiumsPrice = premiumsPrice

  // Preço calculado dos grupos dinâmicos vinculados
  const dynamicGroupsPrice = useMemo(() => {
    if (!hasDynamicGroups) return 0
    let sum = 0
    for (const group of (container.optionGroups || [])) {
      const selections = customSelections[group.id || group.name] || {}
      const groupAddPrice = Number(group.additionalPrice || 0)
      const groupTotalCount = Object.values(selections).reduce((a, b) => a + b, 0)

      if (group.priceType === 'Individual') {
        for (const opt of group.options || []) {
          const qty = selections[opt.id] || 0
          if (qty > 0) {
            const optPrice = opt.price !== undefined && Number(opt.price) > 0 ? Number(opt.price) : groupAddPrice
            sum += optPrice * qty
          }
        }
      } else {
        // Grupo Incluso / Grátis
        // 1. Itens com sobrepreço avulso individual (ex: premium)
        for (const opt of group.options || []) {
          const qty = selections[opt.id] || 0
          if (qty > 0 && opt.price && Number(opt.price) > 0) {
            sum += Number(opt.price) * qty
          }
        }
        // 2. Excedente além da cota gratuita maxQty (ex: 2º creme +2,00€)
        const maxFree = Number(group.maxQty) || 0
        if (maxFree > 0 && groupTotalCount > maxFree && groupAddPrice > 0) {
          const extraCount = groupTotalCount - maxFree
          sum += extraCount * groupAddPrice
        }
      }
    }
    return sum
  }, [hasDynamicGroups, container.optionGroups, customSelections])

  const unitTotal = hasDynamicGroups
    ? +(basePrice + dynamicGroupsPrice).toFixed(2)
    : +(basePrice + extraBasesPrice + extraToppingsPrice + premiumsPrice).toFixed(2)
  const lineTotal = +(unitTotal * quantity).toFixed(2)

  // Handlers para grupos dinâmicos
  const updateDynamicOptionQty = (groupId: string, optionId: string, delta: number, group: any) => {
    const currentGroupSelections = customSelections[groupId] || {}
    const currentQty = currentGroupSelections[optionId] || 0
    const groupTotalQty = Object.values(currentGroupSelections).reduce((a, b) => a + b, 0)
    const hasAddCharge = (Number(group.additionalPrice) || 0) > 0

    if (delta > 0 && group.maxQty && groupTotalQty >= group.maxQty) {
      if (!hasAddCharge && group.priceType !== 'Individual') {
        toast.warning(`Limite de ${group.maxQty} escolhas atingido para "${group.name}"`)
        return
      }
    }

    const newQty = Math.max(0, currentQty + delta)
    if (!group.allowItemQuantity && newQty > 1) return

    setCustomSelections((prev) => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || {}),
        [optionId]: newQty,
      },
    }))
  }

  const toggleDynamicOptionSingle = (groupId: string, optionId: string, group: any) => {
    const currentGroupSelections = customSelections[groupId] || {}
    const isSelected = (currentGroupSelections[optionId] || 0) > 0
    const groupTotalQty = Object.values(currentGroupSelections).reduce((a, b) => a + b, 0)
    const hasAddCharge = (Number(group.additionalPrice) || 0) > 0

    if (!isSelected && group.maxQty && groupTotalQty >= group.maxQty) {
      if (group.maxQty === 1 && !hasAddCharge) {
        setCustomSelections((prev) => ({
          ...prev,
          [groupId]: { [optionId]: 1 },
        }))
        return
      }
      if (!hasAddCharge && group.priceType !== 'Individual') {
        toast.warning(`Limite de ${group.maxQty} escolhas atingido para "${group.name}"`)
        return
      }
    }

    setCustomSelections((prev) => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || {}),
        [optionId]: isSelected ? 0 : 1,
      },
    }))
  }

  const toggleBase = (base: ProductBase) => {
    if (selectedBases.some((b) => b.id === base.id)) {
      if (selectedBases.length === 1) {
        toast.info('Selecione pelo menos 1 base para a sua taça')
        return
      }
      setSelectedBases((prev) => prev.filter((b) => b.id !== base.id))
    } else {
      setSelectedBases((prev) => [...prev, base])
    }
  }

  const toggleFruta = (item: ProductTopping) => {
    const isSelected = selectedToppings.some((t) => t.id === item.id)
    if (isSelected) {
      setSelectedToppings((prev) => prev.filter((t) => t.id !== item.id))
    } else {
      if (!isUnlimited && selectedFrutas.length >= maxFrutas) {
        toast.warning(`Limite de ${maxFrutas} frutas atingido para esta taça!`)
        return
      }
      setSelectedToppings((prev) => [...prev, item])
    }
  }

  const toggleTopping = (item: ProductTopping) => {
    const isSelected = selectedToppings.some((t) => t.id === item.id)
    if (isSelected) {
      setSelectedToppings((prev) => prev.filter((t) => t.id !== item.id))
    } else {
      setSelectedToppings((prev) => [...prev, item])
    }
  }

  const togglePremium = (item: ProductTopping) => {
    const isSelected = selectedToppings.some((t) => t.id === item.id)
    if (isSelected) {
      setSelectedToppings((prev) => prev.filter((t) => t.id !== item.id))
    } else {
      setSelectedToppings((prev) => [...prev, item])
    }
  }

  const handleConfirm = () => {
    if (hasDynamicGroups) {
      for (const group of (container.optionGroups || [])) {
        const selections = customSelections[group.id || group.name] || {}
        const totalQty = Object.values(selections).reduce((a, b) => a + b, 0)
        const minRequired = group.isRequired ? Math.max(1, group.minQty || 1) : (group.minQty || 0)
        if (totalQty < minRequired) {
          toast.error(`Selecione pelo menos ${minRequired} item(ns) em "${group.name}"`)
          return
        }
      }

      // Montar listas planas para compatibilidade com carrinho, cozinha (KDS) e faturas
      const flatBases: any[] = []
      const flatToppings: any[] = []

      for (const group of (container.optionGroups || [])) {
        const groupId = group.id || group.name
        const selections = customSelections[groupId] || {}
        const gNameLower = (group.name || '').toLowerCase()
        const isBaseGroup = gNameLower.includes('base') || gNameLower.includes('creme')

        for (const opt of group.options || []) {
          const qty = selections[opt.id] || 0
          if (qty > 0) {
            for (let i = 0; i < qty; i++) {
              if (isBaseGroup) {
                flatBases.push({ id: opt.id, name: opt.name })
              } else {
                flatToppings.push({ id: opt.id, name: opt.name, category: group.name })
              }
            }
          }
        }
      }

      onAddToCart({
        id: `${container.id}-${Date.now()}`,
        containerId: container.id,
        containerName: container.name,
        containerWeight: container.weightGrams,
        container,
        bases: flatBases,
        toppings: flatToppings,
        customSelections,
        optionGroups: container.optionGroups,
        quantity,
        unitPrice: unitTotal,
        lineTotal,
        notes: notes.trim(),
      })

      toast.success(`${container.name} adicionado ao pedido!`)
      onClose()
      return
    }

    if (selectedBases.length === 0) {
      toast.error('Selecione pelo menos 1 base')
      return
    }

    onAddToCart({
      id: `${container.id}-${Date.now()}`,
      containerId: container.id,
      containerName: container.name,
      containerWeight: container.weightGrams,
      container,
      bases: selectedBases,
      toppings: selectedToppings,
      extraBasesCount,
      extraToppingsCount,
      quantity,
      unitPrice: unitTotal,
      lineTotal,
      notes: notes.trim(),
    })

    toast.success(`${container.name} adicionado ao pedido!`)
    onClose()
  }

  const video = container.videoUrl || CUP_VIDEOS[container.weightGrams]

  return (
    <Dialog open={Boolean(container)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-3xl flex flex-col shadow-2xl transition-colors duration-200 ${isCustomerDark ? 'dark bg-[#150226] text-white border-white/20' : 'bg-white text-slate-900 border-purple-100'}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-purple-100 dark:border-white/10 bg-purple-50 dark:bg-[#1e0333]/90 pr-14">
          <DialogTitle className="text-base font-black text-slate-900 dark:text-white">
            {viewOnly ? `Ingredientes: ${container.name}` : `Personalize o seu ${container.name}`}
          </DialogTitle>
        </div>

        {/* Corpo Principal */}
        <div className="overflow-y-auto p-4 sm:p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 text-slate-900 dark:text-white">
          {/* Coluna Esquerda */}
          <div className="md:col-span-4 space-y-4">
            <div className="rounded-3xl overflow-hidden border border-purple-100 dark:border-white/15 bg-purple-50 dark:bg-purple-950/40 shadow-sm">
              {video ? (
                <video
                  src={video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-36 sm:h-44 object-cover"
                />
              ) : (
                <img
                  src={CUP_IMAGES[container.weightGrams] || container.image || '/images/official/acai_copo_500g.jpg'}
                  alt={container.name}
                  className="w-full h-36 sm:h-44 object-cover"
                />
              )}
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/80 border border-purple-100 dark:bg-white/5 dark:border-white/10 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">{container.name}</span>
                <span className="font-black text-fuchsia-600 dark:text-fuchsia-300 font-mono text-sm">
                  {formatCurrency(container.precoBase)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-purple-200/70 leading-relaxed font-medium">
                {isUnlimited
                  ? 'Frutas frescas e acompanhamentos tradicionais à vontade.'
                  : `Inclui até ${maxFrutas} frutas e até ${maxToppingsGratis} acompanhamentos.`}
              </p>
            </div>

            {/* Resumo da Composição e Acréscimos em Tempo Real */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 dark:bg-white/5 dark:border-white/10 space-y-2 text-left">
              <div className="text-xs font-black text-purple-950 dark:text-white uppercase tracking-wider">
                Resumo dos Valores:
              </div>
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-purple-200/80 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-purple-200">Preço Base:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(basePrice)}</span>
                </div>
                {hasDynamicGroups ? (
                  dynamicGroupsPrice > 0 && (
                    <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-semibold">
                      <span>Adicionais Escolhidos:</span>
                      <span>+{formatCurrency(dynamicGroupsPrice)}</span>
                    </div>
                  )
                ) : (
                  <>
                    {extraBasesCount > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-semibold">
                        <span>{extraBasesCount}x Creme Extra (+2€):</span>
                        <span>+{formatCurrency(extraBasesPrice)}</span>
                      </div>
                    )}
                    {extraToppingsCount > 0 && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-semibold">
                        <span>{extraToppingsCount}x Topping (+0,50€):</span>
                        <span>+{formatCurrency(extraToppingsPrice)}</span>
                      </div>
                    )}
                    {extraPremiumsPrice > 0 && (
                      <div className="flex justify-between text-amber-700 dark:text-amber-300 font-semibold">
                        <span>Adicionais Especiais:</span>
                        <span>+{formatCurrency(extraPremiumsPrice)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-purple-200 dark:border-white/10 pt-1.5 flex justify-between text-xs text-fuchsia-700 dark:text-fuchsia-300 font-black">
                  <span>Total Deste Item:</span>
                  <span>{formatCurrency(unitTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Seleção */}
          <div className="md:col-span-8 space-y-5">
            {hasDynamicGroups ? (
              container.optionGroups!.map((group, groupIdx) => {
                const groupId = group.id || group.name
                const groupSelections = customSelections[groupId] || {}
                const groupTotalCount = Object.values(groupSelections).reduce((a, b) => a + b, 0)
                const isObligatory = group.isRequired || (group.minQty && group.minQty > 0)
                const isDetailed = !!group.showDetailed

                return (
                  <div key={groupId || groupIdx} className="space-y-2.5 p-3.5 rounded-2xl bg-purple-50/40 dark:bg-white/5 border border-purple-100 dark:border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <label className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>{group.name}</span>
                        <span className="text-purple-700 dark:text-purple-300 font-bold">
                          ({groupTotalCount}{group.maxQty ? `/${group.maxQty}` : ''})
                        </span>
                        {group.priceType === 'Gratis' && group.maxQty && groupTotalCount > group.maxQty && (
                          <span className="text-[10px] text-pink-600 dark:text-pink-400 font-bold bg-pink-100 dark:bg-pink-950/40 px-1.5 py-0.5 rounded-md">
                            +{groupTotalCount - group.maxQty} extra
                          </span>
                        )}
                      </label>

                      <div className="flex items-center gap-1.5">
                        {isObligatory ? (
                          <Badge className="bg-purple-700 text-white font-bold text-[9px] py-0 px-1.5">
                            Obrigatório {group.minQty ? `(Mín: ${group.minQty})` : ''}
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-100 text-purple-900 border border-purple-200 dark:bg-white/10 dark:text-purple-200 font-bold text-[9px] py-0 px-1.5">
                            Opcional
                          </Badge>
                        )}
                        <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                          {group.priceType === 'Individual'
                            ? (group.additionalPrice && Number(group.additionalPrice) > 0 ? `+${formatCurrency(Number(group.additionalPrice))}/un.` : 'Valor por item')
                            : (group.additionalPrice && Number(group.additionalPrice) > 0 ? `Até ${group.maxQty || 1} grátis (extra +${formatCurrency(Number(group.additionalPrice))})` : 'Incluso')}
                        </span>
                      </div>
                    </div>

                    {isDetailed ? (
                      /* Grid Detalhado com Imagem / Card */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(group.options || []).map((opt: any) => {
                          const currentQty = groupSelections[opt.id] || 0
                          const isSelected = currentQty > 0
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-purple-700/10 border-purple-600 dark:bg-purple-600/20 dark:border-pink-500'
                                  : 'bg-white dark:bg-white/5 border-purple-150 dark:border-white/10 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {opt.image ? (
                                  <img src={opt.image} alt={opt.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                                ) : null}
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-purple-950 dark:text-white truncate">
                                    {opt.name}
                                  </div>
                                  {group.priceType === 'Individual' && Number(opt.price) > 0 && (
                                    <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      +{formatCurrency(Number(opt.price))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {group.allowItemQuantity ? (
                                <div className="flex items-center gap-2 flex-shrink-0 bg-purple-50 dark:bg-white/10 p-1 rounded-xl border border-purple-200 dark:border-white/15">
                                  <button
                                    type="button"
                                    disabled={currentQty <= 0}
                                    onClick={() => updateDynamicOptionQty(groupId, opt.id, -1, group)}
                                    className="h-6 w-6 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-mono font-bold text-xs w-4 text-center text-purple-950 dark:text-white">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateDynamicOptionQty(groupId, opt.id, 1, group)}
                                    className="h-6 w-6 rounded-lg flex items-center justify-center bg-purple-700 text-white hover:bg-purple-800 cursor-pointer shadow-xs"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleDynamicOptionSingle(groupId, opt.id, group)}
                                  className={`h-7 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-700 text-white shadow-xs'
                                      : 'bg-purple-100/70 text-purple-900 hover:bg-purple-200 dark:bg-white/10 dark:text-purple-200'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                  <span>{isSelected ? 'Selecionado' : 'Escolher'}</span>
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* Linhas Compactas (showDetailed === false) */
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(group.options || []).map((opt: any) => {
                          const currentQty = groupSelections[opt.id] || 0
                          const isSelected = currentQty > 0
                          return (
                            <div
                              key={opt.id}
                              onClick={() => !group.allowItemQuantity && toggleDynamicOptionSingle(groupId, opt.id, group)}
                              className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-1.5 cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-purple-700 border-purple-700 text-white shadow-sm dark:bg-purple-700 dark:border-fuchsia-400'
                                  : 'bg-white dark:bg-white/5 border-purple-150 dark:border-white/10 hover:border-purple-300 dark:hover:border-white/20 text-slate-800 dark:text-purple-200'
                              }`}
                            >
                              <div className="truncate flex-1">
                                <div className="text-xs font-semibold truncate">{opt.name}</div>
                                {group.priceType === 'Individual' && Number(opt.price) > 0 && (
                                  <div className={`text-[10px] font-mono font-bold ${isSelected ? 'text-pink-200' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    +{formatCurrency(Number(opt.price))}
                                  </div>
                                )}
                              </div>

                              {group.allowItemQuantity ? (
                                <div
                                  className="flex items-center gap-1 flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    disabled={currentQty <= 0}
                                    onClick={() => updateDynamicOptionQty(groupId, opt.id, -1, group)}
                                    className={`h-5 w-5 rounded flex items-center justify-center cursor-pointer ${
                                      isSelected ? 'text-white hover:bg-white/20' : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                                    } disabled:opacity-20`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="font-mono font-bold text-xs w-3 text-center">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateDynamicOptionQty(groupId, opt.id, 1, group)}
                                    className={`h-5 w-5 rounded flex items-center justify-center cursor-pointer ${
                                      isSelected ? 'bg-white text-purple-900' : 'bg-purple-700 text-white'
                                    }`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              /* Fallback Tradicional de Açaí */
              <>
                {/* ETAPA 1: BASES & CREMES */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>1. Base / Cremes</span>
                      <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">({selectedBases.length})</span>
                    </label>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">1 p/unid. Adicional mais 2€</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bases.map((base) => {
                      const isSelected = selectedBases.some((b) => b.id === base.id)
                      const isAvailable = base.isAvailableInStore !== false
                      return (
                        <button
                          key={base.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && toggleBase(base)}
                          className={`p-2.5 rounded-2xl text-left text-xs font-semibold transition flex items-center justify-between border cursor-pointer ${
                            !isAvailable
                              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                              : isSelected
                              ? 'bg-purple-700 border-purple-700 text-white shadow-md dark:bg-purple-700 dark:border-fuchsia-400'
                              : 'bg-purple-50/60 border-purple-200/80 text-slate-800 hover:bg-purple-100 hover:border-purple-300 dark:bg-white/5 dark:border-white/10 dark:text-purple-200/90 dark:hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{base.name}</span>
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 text-white dark:text-fuchsia-300 flex-shrink-0 ml-1" />
                          ) : !isAvailable ? (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Esgotado</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ETAPA 2: FRUTAS FRESCAS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>2. Frutas Frescas</span>
                      <span className="text-purple-700 dark:text-purple-300 font-bold">
                        ({selectedFrutas.length}{isUnlimited ? '' : `/${maxFrutas}`})
                      </span>
                    </label>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                      {isUnlimited ? 'Sem limite' : `Até ${maxFrutas} inclusas`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {frutas.map((fruta) => {
                      const isSelected = selectedToppings.some((t) => t.id === fruta.id)
                      const isAvailable = fruta.isAvailableInStore !== false
                      return (
                        <button
                          key={fruta.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && toggleFruta(fruta)}
                          className={`p-2.5 rounded-2xl text-left text-xs font-semibold transition flex items-center justify-between border cursor-pointer ${
                            !isAvailable
                              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                              : isSelected
                              ? 'bg-purple-700 border-purple-700 text-white shadow-md dark:bg-purple-700 dark:border-fuchsia-400'
                              : 'bg-purple-50/60 border-purple-200/80 text-slate-800 hover:bg-purple-100 hover:border-purple-300 dark:bg-white/5 dark:border-white/10 dark:text-purple-200/90 dark:hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{fruta.name}</span>
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5 text-white dark:text-emerald-400 flex-shrink-0 ml-1" />
                          ) : !isAvailable ? (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Esgotado</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ETAPA 3: TOPPINGS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>3. Toppings</span>
                      <span className="text-purple-700 dark:text-purple-300 font-bold">
                        ({selectedExtras.length}{isUnlimited ? '' : `/${maxToppingsGratis}`})
                      </span>
                    </label>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                      {isUnlimited ? 'À vontade' : `Até ${maxToppingsGratis} inclusos`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {toppingsTradicionais.map((top) => {
                      const isSelected = selectedToppings.some((t) => t.id === top.id)
                      const isAvailable = top.isAvailableInStore !== false
                      return (
                        <button
                          key={top.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && toggleTopping(top)}
                          className={`p-2 rounded-2xl text-left text-[11px] font-semibold transition flex items-center justify-between border cursor-pointer ${
                            !isAvailable
                              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500'
                              : isSelected
                              ? 'bg-purple-700 border-purple-700 text-white shadow-md dark:bg-purple-700 dark:border-fuchsia-400'
                              : 'bg-purple-50/60 border-purple-200/80 text-slate-800 hover:bg-purple-100 hover:border-purple-300 dark:bg-white/5 dark:border-white/10 dark:text-purple-200/90 dark:hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{top.name}</span>
                          {isSelected ? (
                            <Check className="h-3 w-3 text-white dark:text-emerald-400 flex-shrink-0 ml-1" />
                          ) : !isAvailable ? (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Esgotado</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ETAPA 4: ADICIONAIS */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>4. Adicionais</span>
                      <Badge className="bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-400 dark:text-purple-950 font-bold text-[9px] py-0 px-1.5">
                        Opcional
                      </Badge>
                    </label>
                    <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                      Mais toppings 0,50€ cada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {caldasPremium.map((add) => {
                      const isSelected = selectedToppings.some((t) => t.id === add.id)
                      const isAvailable = add.isAvailableInStore !== false
                      const dynamicPrice = getToppingItemPrice(add, container.weightGrams)
                      return (
                        <button
                          key={add.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => isAvailable && togglePremium(add)}
                          className={`p-3 rounded-2xl text-left text-xs font-semibold transition flex items-center justify-between border cursor-pointer ${
                            !isAvailable
                              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-40 cursor-not-allowed text-slate-400'
                              : isSelected
                              ? 'bg-gradient-to-r from-purple-800 to-amber-900 border-amber-400 text-white shadow-lg dark:from-fuchsia-900 dark:to-purple-900 dark:border-amber-400'
                              : 'bg-amber-50/70 border-amber-200/80 text-slate-900 hover:bg-amber-100 hover:border-amber-300 dark:bg-white/5 dark:border-white/10 dark:text-purple-200/90 dark:hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="truncate font-bold">{add.name}</div>
                            <div className={`text-[10px] font-mono font-bold mt-0.5 ${isSelected ? 'text-amber-300' : 'text-amber-800 dark:text-amber-300'}`}>
                              +{formatCurrency(dynamicPrice)}
                            </div>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-amber-300 flex-shrink-0 ml-1" />
                          ) : !isAvailable ? (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">Esgotado</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ETAPA 5: OBSERVAÇÕES */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-purple-200">
                Observações:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: pouco leite condensado..."
                className="w-full h-11 px-3.5 rounded-2xl bg-white border border-purple-200 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="px-6 py-4 border-t border-purple-100 dark:border-white/10 bg-white dark:bg-[#1e0333] flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-purple-300 font-bold uppercase">
              {viewOnly ? 'Preço Base' : 'Total do Item'}
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-fuchsia-300 font-mono">
              {formatCurrency(viewOnly ? basePrice : lineTotal)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewOnly ? (
              <Button
                type="button"
                onClick={onClose}
                className="h-11 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                Fechar
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-purple-200 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  className="h-11 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 hover:from-purple-800 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  Adicionar ao Pedido
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

