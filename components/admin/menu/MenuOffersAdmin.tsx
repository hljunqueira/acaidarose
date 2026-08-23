'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Tag, Percent, Calendar, Clock, Gift } from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/formatters'
import SafeDeleteDialog from '@/components/admin/common/SafeDeleteDialog'

interface OfferItem {
  id: string
  title: string
  description: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  validDays: string
  validHours: string
  couponCode?: string
  active: boolean
}

const INITIAL_OFFERS: OfferItem[] = [
  {
    id: 'off-1',
    title: 'Happy Hour de Verão — Açaí 350g',
    description: 'Desconto de 20% no copo de 350g em dias úteis no período da tarde',
    originalPrice: 9.00,
    discountedPrice: 7.20,
    discountPercent: 20,
    validDays: 'Segunda a Sexta',
    validHours: '14:00 às 18:00',
    couponCode: 'HAPPYROSE',
    active: true,
  },
  {
    id: 'off-2',
    title: 'Combo Barca Família 1Kg + 2 Bebidas',
    description: 'Barca completa com todas as frutas e toppings livres com desconto especial',
    originalPrice: 28.50,
    discountedPrice: 23.90,
    discountPercent: 16,
    validDays: 'Sábado e Domingo',
    validHours: 'Todo o dia',
    couponCode: 'BARCA10',
    active: true,
  },
  {
    id: 'off-3',
    title: 'Bónus S2 Cashback Fidelidade',
    description: 'Acumule 10% de cashback para resgatar em copos grátis na próxima visita',
    originalPrice: 12.90,
    discountedPrice: 11.60,
    discountPercent: 10,
    validDays: 'Todos os dias',
    validHours: 'Sempre ativo',
    couponCode: 'S2CASHBACK',
    active: true,
  },
]

interface MenuOffersAdminProps {
  tenantId: string
}

export default function MenuOffersAdmin({ tenantId }: MenuOffersAdminProps) {
  const [offers, setOffers] = useState<OfferItem[]>(INITIAL_OFFERS)

  // Dialog de Criação / Edição
  const [editOpen, setEditOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    originalPrice: 10.00,
    discountedPrice: 8.00,
    validDays: 'Todos os dias',
    validHours: 'Sempre ativo',
    couponCode: '',
    active: true,
  })

  // Dialog de Exclusão Segura
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingOffer, setDeletingOffer] = useState<OfferItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const handleOpenNew = () => {
    setEditingOffer(null)
    setFormData({
      title: '',
      description: '',
      originalPrice: 10.00,
      discountedPrice: 8.00,
      validDays: 'Segunda a Sexta',
      validHours: '14:00 às 18:00',
      couponCode: '',
      active: true,
    })
    setEditOpen(true)
  }

  const handleOpenEdit = (offer: OfferItem) => {
    setEditingOffer(offer)
    setFormData({
      title: offer.title,
      description: offer.description,
      originalPrice: offer.originalPrice,
      discountedPrice: offer.discountedPrice,
      validDays: offer.validDays,
      validHours: offer.validHours,
      couponCode: offer.couponCode || '',
      active: offer.active,
    })
    setEditOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Informe o título da promoção')
      return
    }

    const orig = Number(formData.originalPrice) || 0
    const disc = Number(formData.discountedPrice) || 0
    const percent = orig > 0 ? Math.round(((orig - disc) / orig) * 100) : 0

    if (editingOffer) {
      setOffers((prev) =>
        prev.map((o) =>
          o.id === editingOffer.id
            ? {
                ...o,
                title: formData.title.trim(),
                description: formData.description.trim(),
                originalPrice: orig,
                discountedPrice: disc,
                discountPercent: Math.max(0, percent),
                validDays: formData.validDays,
                validHours: formData.validHours,
                couponCode: formData.couponCode.trim().toUpperCase(),
                active: formData.active,
              }
            : o
        )
      )
      toast.success(`Oferta "${formData.title}" atualizada com sucesso!`)
    } else {
      const newOff: OfferItem = {
        id: `off-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        originalPrice: orig,
        discountedPrice: disc,
        discountPercent: Math.max(0, percent),
        validDays: formData.validDays,
        validHours: formData.validHours,
        couponCode: formData.couponCode.trim().toUpperCase(),
        active: formData.active,
      }
      setOffers((prev) => [...prev, newOff])
      toast.success(`Oferta "${formData.title}" criada com sucesso!`)
    }
    setEditOpen(false)
  }

  const handleToggleActive = (offer: OfferItem) => {
    setOffers((prev) =>
      prev.map((item) => (item.id === offer.id ? { ...item, active: !item.active } : item))
    )
    toast.success(offer.active ? 'Oferta pausada' : 'Oferta ativada no cardápio')
  }

  const handleOpenDelete = (offer: OfferItem) => {
    setDeletingOffer(offer)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingOffer) return
    setDeletingLoading(true)
    try {
      setOffers((prev) => prev.filter((o) => o.id !== deletingOffer.id))
      toast.success(`Oferta "${deletingOffer.title}" removida com sucesso!`)
      setDeleteOpen(false)
      setDeletingOffer(null)
    } finally {
      setDeletingLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-700 dark:text-pink-400" />
            <span>Ofertas & Promoções</span>
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            Crie campanhas de desconto, promoções por horário (Happy Hour) e cupons para o Açaí da Rose.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Oferta</span>
        </Button>
      </div>

      {/* Grid de Ofertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {offers.map((off) => (
          <div
            key={off.id}
            className="bg-white dark:bg-[#160228]/95 rounded-3xl border border-purple-150 dark:border-white/15 shadow-xs dark:shadow-xl overflow-hidden flex flex-col justify-between hover:border-purple-400 dark:hover:border-pink-500/50 transition-all text-slate-900 dark:text-white"
          >
            <div className="p-5 space-y-3">
              {/* Header do Card de Oferta */}
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-700 dark:bg-pink-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full border-0">
                  -{off.discountPercent}% OFF
                </Badge>
                {off.couponCode && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-white/10 text-purple-900 dark:text-pink-300 border border-purple-200 dark:border-white/15">
                    CUPOM: {off.couponCode}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-black text-base text-purple-950 dark:text-white leading-tight">
                  {off.title}
                </h3>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-1 leading-relaxed">
                  {off.description}
                </p>
              </div>

              {/* Preços */}
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-white/5 border border-purple-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-purple-600/70 dark:text-purple-200/50 line-through">
                    De {formatCurrency(off.originalPrice)}
                  </div>
                  <div className="text-base font-black text-purple-950 dark:text-pink-300 font-mono">
                    Por {formatCurrency(off.discountedPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded-lg">
                    Economiza {formatCurrency(off.originalPrice - off.discountedPrice)}
                  </span>
                </div>
              </div>

              {/* Regras e Horários */}
              <div className="space-y-1 text-[11px] text-purple-800 dark:text-purple-200/80 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                  <span>{off.validDays}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-700 dark:text-pink-400" />
                  <span>{off.validHours}</span>
                </div>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="p-3.5 bg-purple-50/40 dark:bg-black/20 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(off)}
                className="cursor-pointer"
              >
                {off.active ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold text-[10px]">
                    Oferta Ativa
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 font-bold text-[10px]">
                    Pausada
                  </Badge>
                )}
              </button>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(off)}
                  className="h-8 w-8 p-0 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100/70 dark:hover:bg-white/10 rounded-lg cursor-pointer"
                  title="Editar Oferta"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDelete(off)}
                  className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg cursor-pointer"
                  title="Excluir Oferta"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-6 bg-[#160228] rounded-3xl border border-white/15 shadow-2xl text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-white">
              {editingOffer ? 'Editar Oferta' : 'Nova Oferta Promocional'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-200">Título da Oferta</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Happy Hour de Verão — Açaí 350g"
                required
                className="h-10 rounded-xl text-xs bg-white/10 border-white/15 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-200">Descrição dos Benefícios</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da promoção, regras e produtos válidos..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-white/15 bg-white/10 text-white text-xs placeholder:text-purple-300/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">Preço Original (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  className="h-10 rounded-xl text-xs font-mono bg-white/10 border-white/15 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">Preço com Desconto (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) })}
                  className="h-10 rounded-xl text-xs font-mono font-black text-pink-300 bg-white/10 border-white/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">Dias Válidos</Label>
                <Input
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                  placeholder="Ex: Segunda a Sexta"
                  className="h-10 rounded-xl text-xs bg-white/10 border-white/15 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-purple-200">Horário Válido</Label>
                <Input
                  value={formData.validHours}
                  onChange={(e) => setFormData({ ...formData, validHours: e.target.value })}
                  placeholder="Ex: 14:00 às 18:00"
                  className="h-10 rounded-xl text-xs bg-white/10 border-white/15 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-purple-200">Código de Cupom (Opcional)</Label>
              <Input
                value={formData.couponCode}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                placeholder="Ex: HAPPYROSE"
                className="h-10 rounded-xl text-xs font-mono uppercase bg-white/10 border-white/15 text-white"
              />
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-10 rounded-xl text-xs border-white/15 bg-white/5 hover:bg-white/10 text-white cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                Salvar Oferta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão Segura */}
      <SafeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Oferta Promocional"
        description="Tem certeza que deseja remover esta promoção? Ela não estará mais disponível para os clientes."
        itemName={deletingOffer?.title}
        loading={deletingLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
