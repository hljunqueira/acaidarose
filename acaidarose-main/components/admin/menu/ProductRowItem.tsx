'use client'

import React, { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/i18n/formatters'
import { ReplicateStoreDialog, DuplicateItemDialog, DeleteItemDialog, ActiveHoursDialog, PromoHoursDialog, PairingDialog } from './ActionDialogs'
import { toast } from 'sonner'
import {
  RefreshCw,
  Edit2,
  Copy,
  Clock,
  Wine,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react'

interface ProductRowItemProps {
  product: any
  categoryType: 'containers' | 'bases' | 'toppings'
  tenantId: string
  onEdit: (product: any) => void
  onToggleStatus: (product: any) => void
  onDelete: (product: any) => void
}

export default function ProductRowItem({
  product,
  categoryType,
  tenantId,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductRowItemProps) {
  const [replicateOpen, setReplicateOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [hoursOpen, setHoursOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [pairingOpen, setPairingOpen] = useState(false)

  // Estados locais reativos com atualização instantânea
  const [isVisible, setIsVisible] = useState(product.active !== false)
  const [isAvailable, setIsAvailable] = useState(product.isAvailableInStore !== false)
  const [isRecommended, setIsRecommended] = useState(product.isRecommended === true)

  useEffect(() => {
    setIsVisible(product.active !== false)
    setIsAvailable(product.isAvailableInStore !== false)
    setIsRecommended(product.isRecommended === true)
  }, [product])

  const handleToggleVisibility = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = !isVisible
    setIsVisible(next)
    onToggleStatus({ ...product, active: next })
    toast.success(
      next
        ? `🟢 "${product.name}" agora está VISÍVEL no Cardápio QR Code!`
        : `🔴 "${product.name}" agora está INVISÍVEL no Cardápio QR Code.`
    )
  }

  const handleToggleAvailability = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = !isAvailable
    setIsAvailable(next)
    onToggleStatus({ ...product, isAvailableInStore: next })
    toast.success(
      next
        ? `"${product.name}" marcado como DISPONÍVEL no estoque.`
        : `"${product.name}" marcado como INDISPONÍVEL / PAUSADO.`
    )
  }

  const handleToggleRecommend = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = !isRecommended
    setIsRecommended(next)
    toast.success(
      next
        ? `⭐ "${product.name}" marcado como RECOMENDADO no cardápio!`
        : `Recomendação de "${product.name}" desativada.`
    )
  }

  const price = product.precoBase ?? product.precoCobrado ?? product.price ?? 0

  return (
    <div className={`py-3 px-4 rounded-xl bg-white border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none ${
      isVisible ? 'border-zinc-200/80 hover:border-zinc-300' : 'border-red-200/60 bg-red-50/20 opacity-80'
    }`}>
      {/* 1. ESQUERDA: GRIP + IMAGEM + TÍTULO/DESCRIÇÃO */}
      <div className="flex items-center gap-3 min-w-[240px] max-w-sm">
        <div className="text-zinc-400 hover:text-zinc-600 cursor-grab">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="h-14 w-14 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-600">
              {product.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="font-bold text-xs sm:text-sm text-zinc-900 uppercase tracking-tight truncate">
            {product.name}
          </h3>
          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-snug">
            {product.description || (product.weightGrams ? `${product.weightGrams}g com regras de personalização.` : 'Produto do cardápio')}
          </p>
        </div>
      </div>

      {/* 2. CENTRO: COMPLEMENTOS VINCULADOS (SEMPRE VISÍVEIS) */}
      <div className="flex flex-col gap-0.5 text-[11px] text-zinc-600 border-l border-zinc-200/80 pl-4 pr-3 flex-1 min-w-[210px]">
        <div className="font-medium text-zinc-700">Escolha suas bases / cremes preferidos:</div>
        <div>Deseja adicionar frutas frescas?</div>
        <div>Quais toppings & crocantes?</div>
        <div>Deseja adicionar caldas nobres?</div>
      </div>

      {/* 3. LADO DIREITO: PREÇO COM OLHINHO INTERATIVO E AÇÕES */}
      <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 self-end md:self-center">
        {/* Preço e Olho Interativo */}
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-xs text-zinc-800">
            {formatCurrency(price)}
          </span>

          <button
            type="button"
            onClick={handleToggleVisibility}
            className="p-1 rounded-md hover:bg-zinc-100 transition cursor-pointer"
            title={isVisible ? '🟢 Visível no Cardápio QR Code (Clique para ocultar)' : '🔴 Invisível no Cardápio QR Code (Clique para exibir)'}
          >
            {isVisible ? (
              <Eye className="h-4 w-4 text-emerald-600 hover:text-emerald-700 transition" />
            ) : (
              <EyeOff className="h-4 w-4 text-red-500 hover:text-red-600 transition" />
            )}
          </button>
        </div>

        {/* Badges de Status e Caixa de Ações */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Badges de Status Clicáveis */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleVisibility}
              className="cursor-pointer"
              title="Clique para alternar Visibilidade no QR Code"
            >
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                isVisible ? 'bg-[#3bb54a] text-white hover:bg-[#339e40]' : 'bg-red-500 text-white hover:bg-red-600'
              }`}>
                {isVisible ? 'Visível' : 'Invisível'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleAvailability}
              className="cursor-pointer"
              title="Clique para alternar Disponibilidade"
            >
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                isAvailable ? 'bg-[#fbb03b] text-white hover:bg-[#e09b2f]' : 'bg-zinc-300 text-zinc-700 hover:bg-zinc-400'
              }`}>
                {isAvailable ? 'Disponível' : 'Indisponível'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleRecommend}
              className="cursor-pointer"
              title="Clique para alternar recomendação no cardápio"
            >
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                isRecommended
                  ? 'bg-purple-700 text-white shadow-xs hover:bg-purple-800'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
              }`}>
                {isRecommended ? '★ Recomendado' : 'Recomendar'}
              </span>
            </button>
          </div>

          {/* Caixa de Ícones de Ações (Minimalista Abrahão) */}
          <div className="flex items-center border border-zinc-300 rounded-md overflow-hidden divide-x divide-zinc-300 bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setReplicateOpen(true)}
              title="Replicar para Filiais"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(product)}
              title="Editar Produto & Complementos"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDuplicateOpen(true)}
              title="Duplicar Item"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setHoursOpen(true)}
              title="Horários Ativos"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <Clock className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setPairingOpen(true)}
              title="Harmonização"
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              <Wine className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              title="Excluir Item"
              className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modais de Ação */}
      <ReplicateStoreDialog open={replicateOpen} onOpenChange={setReplicateOpen} product={product} tenantId={tenantId} />
      <DuplicateItemDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} product={product} tenantId={tenantId} />
      <DeleteItemDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={product} tenantId={tenantId} onSuccess={() => onDelete(product)} />
      <ActiveHoursDialog open={hoursOpen} onOpenChange={setHoursOpen} product={product} tenantId={tenantId} />
      <PromoHoursDialog open={promoOpen} onOpenChange={setPromoOpen} product={product} tenantId={tenantId} />
      <PairingDialog open={pairingOpen} onOpenChange={setPairingOpen} product={product} tenantId={tenantId} />
    </div>
  )
}
