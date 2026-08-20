'use client'

import React, { useState, useMemo } from 'react'
import { ProductContainer, ProductBase, ProductTopping, CatalogData } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Check, Plus, Minus, X, Sparkles, AlertCircle } from 'lucide-react'

interface CustomerProductDetailProps {
  container: ProductContainer | null
  catalog: CatalogData
  onClose: () => void
  onAddToCart: (item: any) => void
  viewOnly?: boolean
}

export default function CustomerProductDetail({
  container,
  catalog,
  onClose,
  onAddToCart,
  viewOnly = false,
}: CustomerProductDetailProps) {
  if (!container) return null

  const [selectedBases, setSelectedBases] = useState<ProductBase[]>([catalog.bases?.[0]].filter(Boolean))
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const isUnlimited = container.weightGrams >= 500
  const maxBases = container.limiteCremes || container.limiteBases || 1
  const maxFrutas = container.limiteFrutas || (isUnlimited ? 999 : 2)
  const maxToppings = container.limiteToppings || (isUnlimited ? 999 : 3)

  const allToppings = catalog.toppings || []
  const bases = catalog.bases || []

  // Separação de Categorias
  const frutas = useMemo(() => {
    return allToppings.filter((t) => t.category === 'Frutas' || ['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f)))
  }, [allToppings])

  const toppingsTradicionais = useMemo(() => {
    return allToppings.filter((t) => !t.isPremium && t.category !== 'Frutas' && t.category !== 'Adicionais' && !['banana', 'morango', 'kiwi', 'manga', 'uva'].some((f) => t.name.toLowerCase().includes(f)))
  }, [allToppings])

  const caldasPremium = useMemo(() => {
    return allToppings.filter((t) => t.isPremium || t.category === 'Adicionais' || (t.precoExtra && t.precoExtra > 0))
  }, [allToppings])

  const selectedFrutas = selectedToppings.filter((t) => frutas.some((f) => f.id === t.id))
  const selectedExtras = selectedToppings.filter((t) => toppingsTradicionais.some((top) => top.id === t.id))
  const selectedPremiums = selectedToppings.filter((t) => caldasPremium.some((p) => p.id === t.id))

  // Alternar Base
  const toggleBase = (base: ProductBase) => {
    const exists = selectedBases.find((b) => b.id === base.id)
    if (exists) {
      if (selectedBases.length > 1) {
        setSelectedBases(selectedBases.filter((b) => b.id !== base.id))
      }
    } else {
      if (selectedBases.length >= maxBases) {
        setSelectedBases([...selectedBases.slice(1), base])
      } else {
        setSelectedBases([...selectedBases, base])
      }
    }
  }

  // Alternar Fruta
  const toggleFruta = (item: ProductTopping) => {
    const exists = selectedToppings.find((t) => t.id === item.id)
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== item.id))
    } else {
      if (!isUnlimited && selectedFrutas.length >= maxFrutas) {
        toast.info(`Limite de ${maxFrutas} frutas atingido para este tamanho.`)
        return
      }
      setSelectedToppings([...selectedToppings, item])
    }
  }

  // Alternar Topping Tradicional
  const toggleTopping = (item: ProductTopping) => {
    const exists = selectedToppings.find((t) => t.id === item.id)
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== item.id))
    } else {
      if (!isUnlimited && selectedExtras.length >= maxToppings) {
        toast.info(`Limite de ${maxToppings} acompanhamentos atingido para este tamanho.`)
        return
      }
      setSelectedToppings([...selectedToppings, item])
    }
  }

  // Alternar Calda / Adicional Premium
  const togglePremium = (item: ProductTopping) => {
    const exists = selectedToppings.find((t) => t.id === item.id)
    if (exists) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== item.id))
    } else {
      setSelectedToppings([...selectedToppings, item])
    }
  }

  // Preço Total
  const extraPrice = selectedPremiums.reduce((acc, t) => acc + (t.priceTierLow || t.precoExtra || t.precoCobrado || 1.0), 0)
  const unitTotal = container.precoBase + extraPrice
  const lineTotal = +(unitTotal * quantity).toFixed(2)

  const handleConfirm = () => {
    if (selectedBases.length === 0) {
      toast.error('Selecione pelo menos 1 base gelada de açaí')
      return
    }

    onAddToCart({
      id: `${container.id}-${Date.now()}`,
      container,
      bases: selectedBases,
      toppings: selectedToppings,
      quantity,
      unitPrice: unitTotal,
      lineTotal,
      notes: notes.trim(),
    })

    toast.success(`${container.name} adicionado à comanda!`)
    onClose()
  }

  return (
    <Dialog open={Boolean(container)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden p-0 bg-[#150226] text-white border border-white/20 rounded-3xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-[#1e0333]/90 pr-14">
          <DialogTitle className="text-base font-black text-white">
            Personalize o seu {container.name}
          </DialogTitle>
        </div>

        {/* Corpo Principal com 2 Colunas no Desktop */}
        <div className="overflow-y-auto p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Imagem & Resumo do Tamanho */}
          <div className="md:col-span-4 space-y-4">
            <div className="rounded-3xl overflow-hidden border border-white/15 bg-purple-950/40 shadow-lg">
              <img
                src={container.image || '/images/acai_500g.jpg'}
                alt={container.name}
                className="w-full h-44 object-cover"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-white">{container.name}</span>
                <span className="font-black text-fuchsia-300 font-mono text-sm">
                  {formatCurrency(container.precoBase)}
                </span>
              </div>
              <p className="text-[11px] text-purple-200/70">
                {isUnlimited
                  ? '✨ Tamanho Especial: Frutas frescas e acompanhamentos tradicionais à vontade!'
                  : `Inclui até ${maxFrutas} frutas e até ${maxToppings} toppings tradicionais gratuitos.`}
              </p>
            </div>

            {/* Quantidade */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200">Quantidade:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center font-black cursor-pointer text-white"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono font-black text-sm text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-7 w-7 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 flex items-center justify-center font-black cursor-pointer text-white"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Seleção de Ingredientes */}
          <div className="md:col-span-8 space-y-5">
            {/* ETAPA 1: BASES & CREMES GELADOS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <span>1. Escolha a sua Base Gelada</span>
                  <span className="text-fuchsia-400">({selectedBases.length}/{maxBases})</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold">Obrigatório (1 incluso)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bases.map((base) => {
                  const isSelected = selectedBases.some((b) => b.id === base.id)
                  return (
                    <button
                      key={base.id}
                      type="button"
                      onClick={() => toggleBase(base)}
                      className={`p-2.5 rounded-2xl text-left text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-fuchsia-600/30 border-fuchsia-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-purple-200/80 hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{base.emoji || '🟣'} {base.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-fuchsia-400 flex-shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ETAPA 2: FRUTAS FRESCAS */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <span>2. Frutas Frescas</span>
                  <span className="text-purple-300">
                    ({selectedFrutas.length}{isUnlimited ? '' : `/${maxFrutas}`})
                  </span>
                </label>
                <span className="text-[10px] text-purple-300 font-semibold">
                  {isUnlimited ? 'Sem limite' : `Até ${maxFrutas} inclusas`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {frutas.map((fruta) => {
                  const isSelected = selectedToppings.some((t) => t.id === fruta.id)
                  return (
                    <button
                      key={fruta.id}
                      type="button"
                      onClick={() => toggleFruta(fruta)}
                      className={`p-2.5 rounded-2xl text-left text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-purple-700 border-fuchsia-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-purple-200/80 hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{fruta.emoji || '🍓'} {fruta.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ETAPA 3: TOPPINGS & CROCANTES */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <span>3. Toppings & Crocantes Tradicionais</span>
                  <span className="text-purple-300">
                    ({selectedExtras.length}{isUnlimited ? '' : `/${maxToppings}`})
                  </span>
                </label>
                <span className="text-[10px] text-purple-300 font-semibold">
                  {isUnlimited ? 'Sem limite' : `Até ${maxToppings} inclusos`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {toppingsTradicionais.map((top) => {
                  const isSelected = selectedToppings.some((t) => t.id === top.id)
                  return (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => toggleTopping(top)}
                      className={`p-2 rounded-2xl text-left text-[11px] font-bold transition flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-purple-700 border-fuchsia-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-purple-200/80 hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{top.emoji || '🥣'} {top.name}</span>
                      {isSelected && <Check className="h-3 w-3 text-emerald-400 flex-shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ETAPA 4: CALDAS & ESPECIAIS PREMIUM */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <span>4. Caldas & Especiais Premium</span>
                  <Badge className="bg-amber-400 text-purple-950 font-black text-[9px] py-0 px-1.5 border-0">
                    Opcional
                  </Badge>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {caldasPremium.map((add) => {
                  const isSelected = selectedToppings.some((t) => t.id === add.id)
                  const price = add.priceTierLow || add.precoExtra || 1.0
                  return (
                    <button
                      key={add.id}
                      type="button"
                      onClick={() => togglePremium(add)}
                      className={`p-3 rounded-2xl text-left text-xs font-bold transition flex items-center justify-between border cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-fuchsia-900 to-purple-900 border-amber-400 text-white shadow-lg'
                          : 'bg-white/5 border-white/10 text-purple-200/80 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className="truncate font-black">{add.name}</div>
                        <div className="text-[10px] text-amber-300 font-mono mt-0.5">+{formatCurrency(price)}</div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-amber-300 flex-shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ETAPA 5: OBSERVAÇÕES */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-purple-200">
                Observações para a Copa / Atendimento:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: pouco leite condensado, frutas no fundo do copo..."
                className="w-full h-10 px-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>
        </div>

        {/* Rodapé Fixo com Preço Total e Botão */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1e0333] flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-purple-300 font-bold uppercase">Total do Item</div>
            <div className="text-xl sm:text-2xl font-black text-fuchsia-300 font-mono">
              {formatCurrency(lineTotal)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-xs text-purple-200 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="h-11 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-fuchsia-600/30 cursor-pointer"
            >
              + Adicionar ao Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
