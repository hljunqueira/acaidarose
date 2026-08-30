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

const CUP_VIDEOS: Record<number, string> = {
  250: '/videos/hero_revealing_cup.mp4',
  350: '/videos/hero_orbiting_cup.mp4',
  500: '/videos/hero_cup_rotation.mp4',
  750: '/videos/hero_gliding_texture.mp4',
  1000: '/videos/hero_cup_rotation.mp4',
}

function getPremiumPrice(toppingName: string, weightGrams: number): number {
  const name = toppingName.toLowerCase()
  const isLarge = weightGrams > 500
  if (name.includes('pistache')) {
    return isLarge ? 4.0 : 2.0
  }
  if (name.includes('nutella') || name.includes('leite em p') || name.includes('ninho')) {
    return isLarge ? 2.0 : 1.0
  }
  return isLarge ? 2.0 : 1.0
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

  const bases = catalog.bases || []
  const allToppings = catalog.toppings || []

  const [selectedBases, setSelectedBases] = useState<ProductBase[]>([bases?.[0]].filter(Boolean))
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([])
  const [notes, setNotes] = useState('')
  const quantity = 1

  const isUnlimited = container.weightGrams >= 500
  const maxFrutas = container.limiteFrutas || (isUnlimited ? 999 : container.weightGrams === 250 ? 2 : 3)
  const maxToppingsGratis = container.limiteToppings || (isUnlimited ? 999 : 3)

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

  // Regras de Preços Canônicas
  const basePrice = container.precoBase
  const extraBasesCount = Math.max(0, selectedBases.length - 1)
  const extraBasesPrice = extraBasesCount * 2.0

  const extraToppingsCount = isUnlimited ? 0 : Math.max(0, selectedExtras.length - maxToppingsGratis)
  const extraToppingsPrice = extraToppingsCount * 0.50

  const premiumsPrice = selectedPremiums.reduce((acc, top) => {
    return acc + getPremiumPrice(top.name, container.weightGrams)
  }, 0)
  const extraPremiumsPrice = premiumsPrice

  const unitTotal = +(basePrice + extraBasesPrice + extraToppingsPrice + premiumsPrice).toFixed(2)
  const lineTotal = +(unitTotal * quantity).toFixed(2)

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
                  <span className="text-slate-600 dark:text-purple-200">Base da Taça:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{formatCurrency(basePrice)}</span>
                </div>
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
                <div className="border-t border-purple-200 dark:border-white/10 pt-1.5 flex justify-between text-xs text-fuchsia-700 dark:text-fuchsia-300 font-black">
                  <span>Total Desta Taça:</span>
                  <span>{formatCurrency(unitTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Seleção */}
          <div className="md:col-span-8 space-y-5">
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
                  const isAvailable = base.active !== false
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
                  const isAvailable = fruta.active !== false
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
                  const isAvailable = top.active !== false
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
                  const isAvailable = add.active !== false
                  const dynamicPrice = getPremiumPrice(add.name, container.weightGrams)
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

