import React, { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/i18n/formatters'
import { useAuthStore } from '@/lib/stores/authStore'
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
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

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
        ? `"${product.name}" agora está visível no Cardápio QR Code.`
        : `"${product.name}" agora está invisível no Cardápio QR Code.`
    )
  }

  const handleToggleAvailability = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = !isAvailable
    setIsAvailable(next)
    onToggleStatus({ ...product, isAvailableInStore: next })
    toast.success(
      next
        ? `"${product.name}" marcado como disponível no estoque da loja.`
        : `"${product.name}" marcado como indisponível / pausado na loja.`
    )
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
    <div className={`py-3.5 px-4 rounded-2xl bg-white dark:bg-[#160228]/95 border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none text-slate-900 dark:text-white shadow-xs dark:shadow-md ${
      isVisible ? 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50' : 'border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-950/20 opacity-80'
    }`}>
      {/* 1. ESQUERDA: GRIP + IMAGEM + TÍTULO/DESCRIÇÃO */}
      <div className="flex items-center gap-3 min-w-[240px] max-w-sm">
        <div className="text-purple-400 dark:text-purple-300/40 hover:text-purple-700 dark:hover:text-pink-400 cursor-grab">
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="h-14 w-14 rounded-xl overflow-hidden bg-purple-50 dark:bg-white/5 flex-shrink-0 border border-purple-150 dark:border-white/10 relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-purple-700 dark:text-pink-300">
              {product.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-extrabold text-sm text-purple-950 dark:text-white leading-tight">{product.name}</h4>
          <p className="text-[11px] text-purple-700 dark:text-purple-200/70 font-medium line-clamp-1 mt-0.5">
            {product.description || (product.weightGrams ? `${product.weightGrams}g com regras de personalização.` : 'Produto oficial Açaí da Rose')}
          </p>
        </div>
      </div>

      {/* 2. CENTRO: RESUMO DAS REGRAS (OPCIONAIS VINCULADOS) */}
      <div className="flex-1 px-2 hidden lg:block text-[11px] text-purple-900/80 dark:text-purple-200/80 font-medium space-y-0.5 max-w-md">
        <div className="text-purple-950 dark:text-white font-bold truncate">
          Escolha suas bases / cremes preferidos:
        </div>
        <div className="text-purple-700 dark:text-purple-300/80 truncate">
          Deseja adicionar frutas frescas?
        </div>
        <div className="text-purple-700 dark:text-purple-300/80 truncate">
          Quais toppings & crocantes?
        </div>
        <div className="text-purple-700 dark:text-purple-300/80 truncate">
          Deseja adicionar caldas nobres?
        </div>
      </div>

      {/* 3. DIREITA: PREÇO + STATUS RÁPIDOS + AÇÕES */}
      <div className="flex items-center gap-4 self-end md:self-center flex-shrink-0">
        {/* Preço de Tabela */}
        <div className="text-right">
          <div className="font-black text-sm text-purple-950 dark:text-white font-mono">
            {formatCurrency(price)}
          </div>
        </div>

        {/* Pílulas de Status */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="cursor-pointer"
            title="Clique para alternar Visibilidade no QR Code"
          >
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
              isVisible ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30'
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
              isAvailable ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' : 'bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600'
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
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white shadow-xs'
                : 'bg-purple-50 dark:bg-white/5 text-purple-900/70 dark:text-purple-200/70 border border-purple-200 dark:border-white/10 hover:bg-purple-100 dark:hover:bg-white/10'
            }`}>
              {isRecommended ? 'Recomendado' : 'Recomendar'}
            </span>
          </button>
        </div>

        {/* Caixa de Ícones de Ações */}
        <div className="flex items-center border border-purple-200 dark:border-white/15 rounded-xl overflow-hidden divide-x divide-purple-200 dark:divide-white/15 bg-white dark:bg-white/5 shadow-xs">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setReplicateOpen(true)}
              title="Replicar para Filiais (Franqueadora)"
              className="p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(product)}
            title="Editar Produto & Complementos"
            className="p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setDuplicateOpen(true)}
            title="Duplicar Item"
            className="p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setHoursOpen(true)}
            title="Horários Ativos"
            className="p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Clock className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setPairingOpen(true)}
            title="Harmonização"
            className="p-2 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Wine className="h-3 w-3" />
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              title="Excluir Item"
              className="p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Modais de Ação */}
      {isSuperAdmin && (
        <ReplicateStoreDialog open={replicateOpen} onOpenChange={setReplicateOpen} product={product} tenantId={tenantId} />
      )}
      <DuplicateItemDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} product={product} tenantId={tenantId} />
      {isSuperAdmin && (
        <DeleteItemDialog open={deleteOpen} onOpenChange={setDeleteOpen} product={product} tenantId={tenantId} onSuccess={() => onDelete(product)} />
      )}
      <ActiveHoursDialog open={hoursOpen} onOpenChange={setHoursOpen} product={product} tenantId={tenantId} />
      <PromoHoursDialog open={promoOpen} onOpenChange={setPromoOpen} product={product} tenantId={tenantId} />
      <PairingDialog open={pairingOpen} onOpenChange={setPairingOpen} product={product} tenantId={tenantId} />
    </div>
  )
}
