'use client'

import React, { useState } from 'react'
import { ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Minus, X } from 'lucide-react'
import { useLanguageStore } from '@/lib/stores/languageStore'

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

  if (!product) return null

  const isEn = language === 'en'
  const displayName = (isEn && product.nameEn) ? product.nameEn : product.name
  const displayDesc = (isEn && product.descriptionEn) ? product.descriptionEn : product.description
  const unitPrice = product.precoBase || 0
  const totalPrice = unitPrice * quantity

  const handleConfirm = () => {
    onAddToCart({
      containerId: product.id,
      containerName: displayName,
      unitPrice,
      quantity,
      lineTotal: +totalPrice.toFixed(2),
      selectedBases: [],
      selectedFruits: [],
      selectedToppings: [],
      observations: notes.trim(),
    })
    onClose()
  }

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border rounded-3xl max-w-md p-6 bg-white dark:bg-[#160228] text-slate-900 dark:text-white border-purple-100 dark:border-white/10 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-purple-100 dark:border-white/10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-pink-400">
              {product.categoryName || (isEn ? 'Item' : 'Produto')}
            </span>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              {displayName}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {product.image ? (
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

          {/* Preço Unitário */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-600 dark:text-purple-200">
              {isEn ? 'Unit Price' : 'Preço Unitário'}
            </span>
            <span className="text-base font-bold text-purple-700 dark:text-pink-300 font-mono">
              {formatCurrency(unitPrice)}
            </span>
          </div>

          {/* Seletor de Quantidade */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10">
            <span className="text-xs font-bold text-slate-700 dark:text-purple-200">
              {isEn ? 'Quantity' : 'Quantidade'}
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
              {isEn ? 'Notes / Special Requests' : 'Observações'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isEn ? 'e.g. without butter, extra toasted...' : 'Ex: sem manteiga, bem tostado...'}
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
            {isEn ? 'Cancel' : 'Cancelar'}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-2 rounded-xl text-xs font-bold h-11 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20 cursor-pointer"
          >
            {isEn ? 'Add to Order' : 'Adicionar ao Pedido'} • {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
