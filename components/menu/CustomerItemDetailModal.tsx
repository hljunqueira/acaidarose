'use client'

import React, { useState, useMemo } from 'react'
import { ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Check } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/languageStore'
import { getLocalizedField } from '@/lib/i18n/localization'
import { toast } from 'sonner'

interface CustomerItemDetailModalProps {
  product: ProductContainer | null
  onClose: () => void
  onAddToCart: (item: any) => void
}

export default function CustomerItemDetailModal({
  product,
  onClose,
  onAddToCart,
}: CustomerItemDetailModalProps) {
  const { language } = useLanguageStore()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  // Inicializa seleções padrão para os grupos de opções
  const initialOptionsMap = useMemo(() => {
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

  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, string[]>>(initialOptionsMap)

  // Atualiza mapa quando o produto mudar
  React.useEffect(() => {
    setSelectedOptionsMap(initialOptionsMap)
    setQuantity(1)
    setNotes('')
  }, [initialOptionsMap])

  if (!product) return null

  const displayName = getLocalizedField(product, 'name', language) || product.name
  const displayDesc = getLocalizedField(product, 'description', language) || product.description
  const unitPrice = product.precoBase || 0

  // Calcula total adicional dos modificadores selecionados
  let optionsPriceSum = 0
  if (Array.isArray(product.optionGroups)) {
    for (const grp of product.optionGroups) {
      const selectedIds = selectedOptionsMap[grp.id] || []
      for (const optId of selectedIds) {
        const opt = (grp.options || []).find((o: any) => o.id === optId)
        if (opt && typeof opt.price === 'number') {
          optionsPriceSum += opt.price
        }
      }
    }
  }

  const effectiveUnitPrice = unitPrice + optionsPriceSum
  const totalPrice = effectiveUnitPrice * quantity

  const handleToggleOption = (groupId: string, optionId: string, max: number = 1, isRequired: boolean = false) => {
    setSelectedOptionsMap((prev) => {
      const current = prev[groupId] || []
      if (max === 1) {
        // Seleção única (estilo rádio)
        if (current.includes(optionId) && !isRequired) {
          return { ...prev, [groupId]: [] }
        }
        return { ...prev, [groupId]: [optionId] }
      } else {
        // Seleção múltipla
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter((id) => id !== optionId) }
        } else {
          if (current.length >= max) {
            toast.info(
              language === 'en'
                ? `Maximum ${max} options allowed`
                : language === 'es'
                ? `Máximo de ${max} opciones permitidas`
                : `Máximo de ${max} opções permitidas`
            )
            return prev
          }
          return { ...prev, [groupId]: [...current, optionId] }
        }
      }
    })
  }

  const handleConfirm = () => {
    // Validação de grupos obrigatórios
    if (Array.isArray(product.optionGroups)) {
      for (const grp of product.optionGroups) {
        const selected = selectedOptionsMap[grp.id] || []
        const min = grp.min !== undefined ? grp.min : grp.required ? 1 : 0
        if (min > 0 && selected.length < min) {
          toast.error(
            language === 'en'
              ? `Please select an option for: ${grp.name}`
              : language === 'es'
              ? `Por favor seleccione una opción para: ${grp.name}`
              : `Por favor selecione uma opção para: ${grp.name}`
          )
          return
        }
      }
    }

    const selectedOptionsList: any[] = []
    if (Array.isArray(product.optionGroups)) {
      for (const grp of product.optionGroups) {
        const selectedIds = selectedOptionsMap[grp.id] || []
        for (const optId of selectedIds) {
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

    onAddToCart({
      containerId: product.id,
      containerName: displayName,
      unitPrice: effectiveUnitPrice,
      baseUnitPrice: unitPrice,
      quantity,
      lineTotal: +totalPrice.toFixed(2),
      selectedBases: [],
      selectedFruits: [],
      selectedToppings: [],
      selectedOptions: selectedOptionsList,
      options: selectedOptionsList,
      observations: notes.trim(),
    })
    onClose()
  }

  const isEn = language === 'en'
  const isEs = language === 'es'

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border-purple-100 dark:border-white/10 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-pink-400">
              {product.categoryName || (isEn ? 'Item' : isEs ? 'Producto' : 'Produto')}
            </span>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {displayName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mídia: Vídeo ou Imagem */}
          {product.videoUrl ? (
            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-white/10">
              <video
                src={product.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="h-full w-full object-cover"
              />
            </div>
          ) : product.image ? (
            <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-white/10">
              <img
                src={product.image}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          {displayDesc ? (
            <p className="text-xs text-slate-600 dark:text-purple-200/80 leading-relaxed font-normal">
              {displayDesc}
            </p>
          ) : null}

          {/* GRUPOS DE OPÇÕES / MODIFICADORES (Leite, Textura, Coberturas, etc.) */}
          {Array.isArray(product.optionGroups) && product.optionGroups.length > 0 && (
            <div className="space-y-4 pt-1">
              {product.optionGroups.map((grp: any) => {
                const selected = selectedOptionsMap[grp.id] || []
                const max = grp.max || 1
                const isRequired = grp.required || (grp.min && grp.min > 0)

                return (
                  <div
                    key={grp.id}
                    className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-100 dark:border-white/10 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-purple-950 dark:text-white">
                          {grp.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-purple-300">
                          {max === 1
                            ? isEn ? 'Choose 1 option' : isEs ? 'Elige 1 opción' : 'Escolha 1 opção'
                            : isEn ? `Choose up to ${max} options` : isEs ? `Elige hasta ${max} opciones` : `Escolha até ${max} opções`}
                        </div>
                      </div>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isRequired
                            ? 'bg-purple-200/80 text-purple-900 dark:bg-pink-600/30 dark:text-pink-300'
                            : 'bg-slate-200/70 text-slate-700 dark:bg-white/10 dark:text-purple-200'
                        }`}
                      >
                        {isRequired
                          ? isEn ? 'Required' : isEs ? 'Obligatorio' : 'Obrigatório'
                          : isEn ? 'Optional' : isEs ? 'Opcional' : 'Opcional'}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {(grp.options || []).map((opt: any) => {
                        const isSelected = selected.includes(opt.id)
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleToggleOption(grp.id, opt.id, max, isRequired)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-900 text-white border-purple-900 dark:bg-pink-600 dark:border-pink-600 shadow-xs'
                                : 'bg-white dark:bg-white/5 border-purple-100 dark:border-white/10 text-slate-800 dark:text-purple-100 hover:border-purple-300 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
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
              })}
            </div>
          )}

          {/* Preço Unitário Efetivo */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-600 dark:text-purple-200">
              {isEn ? 'Unit Price' : isEs ? 'Precio Unitario' : 'Preço Unitário'}
            </span>
            <span className="text-base font-bold text-purple-700 dark:text-pink-300 font-mono">
              {formatCurrency(effectiveUnitPrice)}
            </span>
          </div>

          {/* Seletor de Quantidade */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-700 dark:text-purple-200">
              {isEn ? 'Quantity' : isEs ? 'Cantidad' : 'Quantidade'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-white flex items-center justify-center font-bold disabled:opacity-40 transition hover:bg-purple-200 dark:hover:bg-white/20 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-bold text-base w-6 text-center text-slate-900 dark:text-white font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-white flex items-center justify-center font-bold transition hover:bg-purple-200 dark:hover:bg-white/20 cursor-pointer"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-purple-200">
              {isEn ? 'Notes / Special Requests' : isEs ? 'Instrucciones especiales' : 'Observações'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isEn
                  ? 'e.g. without sugar, extra cold...'
                  : isEs
                  ? 'ej: sin azúcar, bien frío...'
                  : 'Ex: sem açúcar, bem gelado...'
              }
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-black/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              maxLength={120}
            />
          </div>
        </div>

        <DialogFooter className="pt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl text-xs font-bold h-11 border-purple-200 dark:border-white/15 text-slate-700 dark:text-white hover:bg-purple-50 dark:hover:bg-white/10 cursor-pointer"
          >
            {isEn ? 'Cancel' : isEs ? 'Cancelar' : 'Cancelar'}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-2 rounded-xl text-xs font-bold h-11 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20 cursor-pointer"
          >
            {isEn ? 'Add to Order' : isEs ? 'Añadir al Pedido' : 'Adicionar ao Pedido'} • {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
