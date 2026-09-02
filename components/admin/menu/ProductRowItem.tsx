import React, { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/i18n/formatters'
import { useAuthStore } from '@/lib/stores/authStore'
import { ReplicateStoreDialog, DuplicateItemDialog, DeleteItemDialog } from './ActionDialogs'
import { toast } from 'sonner'
import FranchiseRequestDialog from './FranchiseRequestDialog'
import {
  RefreshCw,
  Edit2,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Send,
} from 'lucide-react'

interface ProductRowItemProps {
  product: any
  categoryType: 'containers' | 'bases' | 'toppings'
  tenantId: string
  onEdit: (product: any) => void
  onToggleStatus: (product: any) => void
  onDelete: (product: any) => void
}

import { canManageMasterCatalog } from '@/lib/utils/permissions'

export default function ProductRowItem({
  product,
  categoryType,
  tenantId,
  onEdit,
  onToggleStatus,
  onDelete,
}: ProductRowItemProps) {
  const { user } = useAuthStore()
  const isFranchisor = canManageMasterCatalog(user, tenantId)

  const [replicateOpen, setReplicateOpen] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
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
    if (next && product.isCategoryPaused) {
      toast.warning(
        `Atenção: "${product.name}" foi ativado, mas a categoria ${product.categoryName ? `"${product.categoryName}"` : 'deste produto'} está PAUSADA nesta loja. O produto não aparecerá aos clientes até que a categoria seja reativada.`,
        { duration: 7000 }
      )
    } else {
      toast.success(
        next
          ? `"${product.name}" agora está visível no Cardápio QR Code.`
          : `"${product.name}" agora está invisível no Cardápio QR Code.`
      )
    }
  }

  const handleToggleAvailability = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = !isAvailable
    setIsAvailable(next)
    onToggleStatus({ ...product, isAvailableInStore: next })
    if (next && product.isCategoryPaused) {
      toast.warning(
        `Atenção: "${product.name}" foi marcado como disponível, mas a categoria ${product.categoryName ? `"${product.categoryName}"` : 'deste produto'} está PAUSADA nesta loja. O produto não aparecerá aos clientes até que a categoria seja reativada.`,
        { duration: 7000 }
      )
    } else {
      toast.success(
        next
          ? `"${product.name}" marcado como disponível no estoque da loja.`
          : `"${product.name}" marcado como indisponível / pausado na loja.`
      )
    }
  }

  const handleToggleRecommend = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = !isRecommended
    setIsRecommended(next)
    toast.success(
      next
        ? `"${product.name}" marcado como item recomendado no cardápio.`
        : `Recomendação de "${product.name}" desativada.`
    )
  }

  const price = product.precoBase ?? product.precoCobrado ?? product.price ?? 0

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#160228]/95 border transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 select-none text-slate-900 dark:text-white shadow-xs dark:shadow-md ${
        isVisible
          ? 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50'
          : 'border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-950/20 opacity-80'
      }`}
    >
      {/* 1. TOPO (Mobile) / ESQUERDA (Desktop): GRIP + IMAGEM + TÍTULO/DESCRIÇÃO + PREÇO NO MOBILE */}
      <div className="flex items-start md:items-center justify-between gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="text-purple-400 dark:text-purple-300/40 hover:text-purple-700 dark:hover:text-pink-400 cursor-grab shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-purple-50 dark:bg-white/5 shrink-0 border border-purple-150 dark:border-white/10 relative">
            {product.videoUrl ? (
              <video
                src={product.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (product.image || product.videoPoster) ? (
              <img src={product.image || product.videoPoster} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-purple-700 dark:text-pink-300">
                {product.name.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-purple-950 dark:text-white leading-tight truncate">
              {product.name}
            </h4>
            <p className="text-[11px] text-purple-700 dark:text-purple-200/70 font-medium line-clamp-1 mt-0.5">
              {product.description ||
                (product.weightGrams
                  ? `${product.weightGrams}g com regras de personalização.`
                  : 'Produto oficial Açaí da Rose')}
            </p>
          </div>
        </div>

        {/* Preço no Mobile (fica na linha superior alinhado à direita) */}
        <div className="md:hidden shrink-0">
          <span className="font-mono font-black text-sm text-purple-950 dark:text-white bg-purple-50/80 dark:bg-white/10 px-2.5 py-1 rounded-xl border border-purple-150 dark:border-white/10 whitespace-nowrap inline-block">
            {formatCurrency(price)}
          </span>
        </div>
      </div>

      {/* 2. CENTRO (Apenas telas grandes): RESUMO DAS REGRAS REAIS */}
      <div className="hidden lg:block flex-1 px-3 text-[11px] text-purple-900/80 dark:text-purple-200/80 font-medium space-y-0.5 max-w-sm">
        {categoryType === 'containers' ? (
          (() => {
            const weight = product.weightGrams || 500
            const basesLimit = product.limiteBases || (weight >= 1000 ? 3 : weight >= 500 ? 2 : 1)
            const frutasLimit = product.limiteFrutas !== undefined
              ? product.limiteFrutas
              : (weight === 250 ? 2 : weight === 350 ? 3 : 999)
            const toppingsLimit = product.limiteToppings !== undefined
              ? product.limiteToppings
              : (weight === 250 ? 3 : weight === 350 ? 4 : 999)

            const rulesParts: string[] = []
            rulesParts.push(`${basesLimit} ${basesLimit === 1 ? 'Base' : 'Bases'}`)

            if (frutasLimit >= 999 && toppingsLimit >= 999) {
              rulesParts.push('Frutas e Acompanhamentos livres')
            } else {
              if (frutasLimit < 999) {
                rulesParts.push(`Até ${frutasLimit} ${frutasLimit === 1 ? 'Fruta' : 'Frutas'}`)
              } else {
                rulesParts.push('Frutas livres')
              }

              if (toppingsLimit < 999) {
                rulesParts.push(`Até ${toppingsLimit} Acompanhamentos`)
              } else {
                rulesParts.push('Acompanhamentos livres')
              }
            }

            return (
              <>
                <div className="text-purple-950 dark:text-white font-bold truncate">
                  {rulesParts[0]} • {rulesParts[1]}
                </div>
                <div className="text-purple-700 dark:text-purple-300/80 truncate text-[10px]">
                  {rulesParts[2] ? rulesParts[2] : 'Montagem personalizada na taça'}
                </div>
              </>
            )
          })()
        ) : categoryType === 'bases' ? (
          <>
            <div className="text-purple-950 dark:text-white font-bold truncate">
              Base / Creme Artesanal
            </div>
            <div className="text-purple-700 dark:text-purple-300/80 truncate text-[10px]">
              Opção de base para taças de açaí
            </div>
          </>
        ) : (
          <>
            <div className="text-purple-950 dark:text-white font-bold truncate">
              {product.category || 'Acompanhamento'} {product.isPremium ? '• Adicional Premium' : ''}
            </div>
            <div className="text-purple-700 dark:text-purple-300/80 truncate text-[10px]">
              {product.isPremium && product.precoExtra ? `+ € ${Number(product.precoExtra).toFixed(2)} por porção` : 'Incluso nas opções de personalização'}
            </div>
          </>
        )}
      </div>

      {/* 3. BASE (Mobile) / DIREITA (Desktop): PREÇO DESKTOP + STATUS + AÇÕES */}
      <div className="flex items-center justify-between md:justify-end gap-3 pt-2.5 md:pt-0 border-t md:border-t-0 border-purple-100 dark:border-white/10 shrink-0 flex-wrap sm:flex-nowrap">
        {/* Preço no Desktop (oculto no mobile porque já está no topo) */}
        <div className="hidden md:block text-right pr-2">
          <div className="font-black text-sm text-purple-950 dark:text-white font-mono whitespace-nowrap">
            {formatCurrency(price)}
          </div>
        </div>

        {/* Pílulas de Status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="cursor-pointer"
            title="Clique para alternar Visibilidade no QR Code"
          >
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition whitespace-nowrap ${
                isVisible
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30'
              }`}
            >
              {isVisible ? 'Visível' : 'Invisível'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleAvailability}
            className="cursor-pointer"
            title="Clique para alternar Disponibilidade"
          >
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition whitespace-nowrap ${
                isAvailable
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                  : 'bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600'
              }`}
            >
              {isAvailable ? 'Disponível' : 'Indisponível'}
            </span>
          </button>

          {product.isCategoryPaused && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40 whitespace-nowrap flex items-center gap-1 shadow-xs"
              title={`A categoria ${product.categoryName ? `"${product.categoryName}"` : 'deste item'} está pausada nesta loja. O produto continuará oculto aos clientes.`}
            >
              <span>⚠️ Categoria Pausada</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleToggleRecommend}
            className="cursor-pointer"
            title="Clique para alternar recomendação no cardápio"
          >
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition whitespace-nowrap ${
                isRecommended
                  ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 dark:bg-white/5 text-purple-900/70 dark:text-purple-200/70 border border-purple-200 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
              }`}
            >
              {isRecommended ? 'Recomendado' : 'Recomendar'}
            </span>
          </button>
        </div>

        {/* Ação Franqueado: Botão Solicitar Ajuste */}
        {!isFranchisor && (
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            title="Solicitar Ajuste de Preço, Nome ou Horário à Franqueadora"
            className="px-2.5 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/60 border border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
          >
            <Send className="h-3 w-3" />
            <span>Solicitar Ajuste</span>
          </button>
        )}

        {/* Caixa de Ícones de Ações */}
        <div className="flex items-center border border-purple-200 dark:border-white/15 rounded-xl overflow-hidden divide-x divide-purple-200 dark:divide-white/15 bg-white dark:bg-white/5 shadow-xs shrink-0">
          {isFranchisor && (
            <button
              type="button"
              onClick={() => setReplicateOpen(true)}
              title="Replicar para Filiais (Franqueadora)"
              className="p-1.5 sm:p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(product)}
            title={isFranchisor ? "Editar Produto & Toppings" : "Visualizar Detalhes"}
            className="p-1.5 sm:p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          {isFranchisor && (
            <button
              type="button"
              onClick={() => setDuplicateOpen(true)}
              title="Duplicar Item"
              className="p-1.5 sm:p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {isFranchisor && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              title="Excluir Item"
              className="p-1.5 sm:p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Modais de Ação */}
      {isFranchisor && (
        <ReplicateStoreDialog open={replicateOpen} onOpenChange={setReplicateOpen} product={product} tenantId={tenantId} />
      )}
      {isFranchisor && (
        <DuplicateItemDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} product={product} tenantId={tenantId} />
      )}
      {isFranchisor && (
        <DeleteItemDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={product} tenantId={tenantId} onSuccess={() => onDelete(product)} />
      )}
      {!isFranchisor && (
        <FranchiseRequestDialog
          open={requestOpen}
          onOpenChange={setRequestOpen}
          tenantId={tenantId}
          initialItem={product}
          initialType="PRICE_CHANGE"
        />
      )}
    </div>
  )
}
