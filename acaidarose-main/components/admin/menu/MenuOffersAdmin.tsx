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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-fuchsia-600" />
            <span>Ofertas & Promoções</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie campanhas de desconto, promoções por horário (Happy Hour) e cupons para o Açaí da Rose.
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
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
            className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="p-5 space-y-3">
              {/* Header do Card de Oferta */}
              <div className="flex items-center justify-between">
                <Badge className="bg-fuchsia-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full border-0">
                  -{off.discountPercent}% OFF
                </Badge>
                {off.couponCode && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 border border-purple-200">
                    CUPOM: {off.couponCode}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-black text-base text-zinc-900 leading-tight">
                  {off.title}
                </h3>
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                  {off.description}
                </p>
              </div>

              {/* Preços */}
              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-400 line-through">
                    De {formatCurrency(off.originalPrice)}
                  </div>
                  <div className="text-base font-black text-fuchsia-700 font-mono">
                    Por {formatCurrency(off.discountedPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    Economiza {formatCurrency(off.originalPrice - off.discountedPrice)}
                  </span>
                </div>
              </div>

              {/* Regras e Horários */}
              <div className="space-y-1 text-[11px] text-zinc-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  <span>{off.validDays}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-600" />
                  <span>{off.validHours}</span>
                </div>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="p-3.5 bg-purple-50/40 border-t border-purple-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(off)}
                className="cursor-pointer"
              >
                {off.active ? (
                  <Badge className="bg-emerald-500 text-white font-bold text-[10px]">
                    Oferta Ativa
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 font-bold text-[10px]">
                    Inativa
                  </Badge>
                )}
              </button>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(off)}
                  className="h-8 w-8 p-0 text-zinc-600 hover:text-purple-700 hover:bg-purple-100/50 rounded-lg cursor-pointer"
                  title="Editar Oferta"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDelete(off)}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-purple-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-zinc-900">
              {editingOffer ? 'Editar Oferta' : 'Nova Oferta Promocional'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Título da Oferta</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Happy Hour de Verão — Açaí 350g"
                required
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Descrição dos Benefícios</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes da promoção, regras e produtos válidos..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Preço Original (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  className="h-10 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Preço com Desconto (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) })}
                  className="h-10 rounded-xl text-xs font-mono font-black text-fuchsia-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Dias Válidos</Label>
                <Input
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                  placeholder="Ex: Segunda a Sexta"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Horário Válido</Label>
                <Input
                  value={formData.validHours}
                  onChange={(e) => setFormData({ ...formData, validHours: e.target.value })}
                  placeholder="Ex: 14:00 às 18:00"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Código de Cupom (Opcional)</Label>
              <Input
                value={formData.couponCode}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                placeholder="Ex: HAPPYROSE"
                className="h-10 rounded-xl text-xs font-mono uppercase"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-10 rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs px-5 shadow-md"
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
