'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Tag, Percent, Calendar, Clock, Gift, ShieldCheck, Store, CheckCircle, PauseCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/formatters'
import { useAuthStore } from '@/lib/stores/authStore'
import { useOffersStore, OfferItem } from '@/lib/stores/offersStore'
import SafeDeleteDialog from '@/components/admin/common/SafeDeleteDialog'

interface MenuOffersAdminProps {
  tenantId: string
}

export default function MenuOffersAdmin({ tenantId }: MenuOffersAdminProps) {
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  const {
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    toggleOfferActiveGlobal,
    toggleOfferActiveStore,
    isOfferActiveInStore,
  } = useOffersStore()

  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'LOCAL'>('GLOBAL')

  // Dialog de Criação / Edição
  const [editOpen, setEditOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scope: 'LOCAL' as 'GLOBAL' | 'LOCAL',
    productName: 'Açaí 350g',
    originalPrice: 9.0,
    discountedPrice: 7.5,
    validDays: 'Segunda a Sexta',
    validHours: '14:00 às 18:00',
    couponCode: '',
    badgeLabel: 'OFERTA ESPECIAL',
    active: true,
  })

  // Dialog de Exclusão Segura
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingOffer, setDeletingOffer] = useState<OfferItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  // Filtra ofertas da aba selecionada
  const globalOffers = offers.filter((o) => o.scope === 'GLOBAL')
  const localOffers = offers.filter((o) => o.scope === 'LOCAL' && (!o.tenantId || o.tenantId === tenantId))
  const displayedOffers = activeTab === 'GLOBAL' ? globalOffers : localOffers

  const handleOpenNew = () => {
    setEditingOffer(null)
    setFormData({
      title: '',
      description: '',
      scope: isSuperAdmin && activeTab === 'GLOBAL' ? 'GLOBAL' : 'LOCAL',
      productName: 'Açaí 350g',
      originalPrice: 9.0,
      discountedPrice: 7.5,
      validDays: 'Segunda a Sexta',
      validHours: '14:00 às 18:00',
      couponCode: '',
      badgeLabel: 'HAPPY HOUR',
      active: true,
    })
    setEditOpen(true)
  }

  const handleOpenEdit = (offer: OfferItem) => {
    if (!isSuperAdmin && offer.scope === 'GLOBAL') {
      toast.info('Campanhas da rede são editadas exclusivamente pela Franqueadora.')
      return
    }
    setEditingOffer(offer)
    setFormData({
      title: offer.title,
      description: offer.description,
      scope: offer.scope,
      productName: offer.productName || 'Açaí 350g',
      originalPrice: offer.originalPrice,
      discountedPrice: offer.discountedPrice,
      validDays: offer.validDays,
      validHours: offer.validHours,
      couponCode: offer.couponCode || '',
      badgeLabel: offer.badgeLabel || 'OFERTA',
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
      updateOffer(editingOffer.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        productName: formData.productName,
        originalPrice: orig,
        discountedPrice: disc,
        discountPercent: Math.max(0, percent),
        validDays: formData.validDays,
        validHours: formData.validHours,
        couponCode: formData.couponCode.trim().toUpperCase(),
        badgeLabel: formData.badgeLabel.trim().toUpperCase() || 'OFERTA',
        active: formData.active,
      })
      toast.success(`Oferta "${formData.title}" atualizada com sucesso!`)
    } else {
      const newOff: OfferItem = {
        id: `off-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        scope: isSuperAdmin && activeTab === 'GLOBAL' ? 'GLOBAL' : 'LOCAL',
        tenantId: isSuperAdmin && activeTab === 'GLOBAL' ? null : tenantId,
        productName: formData.productName,
        originalPrice: orig,
        discountedPrice: disc,
        discountPercent: Math.max(0, percent),
        validDays: formData.validDays,
        validHours: formData.validHours,
        couponCode: formData.couponCode.trim().toUpperCase(),
        badgeLabel: formData.badgeLabel.trim().toUpperCase() || 'OFERTA',
        active: formData.active,
      }
      addOffer(newOff)
      toast.success(`Oferta "${formData.title}" criada com sucesso!`)
    }
    setEditOpen(false)
  }

  const handleToggleActive = (offer: OfferItem) => {
    if (isSuperAdmin && offer.scope === 'GLOBAL') {
      toggleOfferActiveGlobal(offer.id)
      toast.success(offer.active ? 'Campanha da rede pausada para todas as lojas' : 'Campanha da rede ativada')
    } else {
      toggleOfferActiveStore(tenantId, offer.id)
      const nowActive = isOfferActiveInStore(tenantId, offer)
      toast.success(!nowActive ? 'Oferta ativada na sua loja' : 'Oferta pausada na sua loja')
    }
  }

  const handleOpenDelete = (offer: OfferItem) => {
    if (!isSuperAdmin && offer.scope === 'GLOBAL') {
      toast.error('Apenas a Franqueadora pode remover campanhas da rede.')
      return
    }
    setDeletingOffer(offer)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingOffer) return
    setDeletingLoading(true)
    try {
      deleteOffer(deletingOffer.id)
      toast.success(`Oferta "${deletingOffer.title}" removida com sucesso!`)
      setDeleteOpen(false)
      setDeletingOffer(null)
    } finally {
      setDeletingLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-white/10">
        <div>
          <h1 className="text-xl font-black text-purple-950 dark:text-white tracking-tight flex items-center gap-2">
            <Tag className="h-6 w-6 text-purple-700 dark:text-pink-400" />
            <span>Ofertas & Promoções</span>
          </h1>
          <p className="text-xs text-purple-700/80 dark:text-purple-200/70 mt-0.5">
            Gerenciamento de campanhas oficiais da franqueadora, promoções locais por horário e cupons da loja
          </p>
        </div>

        <Button
          onClick={handleOpenNew}
          className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 hover:from-purple-800 hover:to-pink-700 dark:hover:from-pink-500 dark:hover:to-purple-500 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-purple-700/20 dark:shadow-pink-600/30 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{activeTab === 'GLOBAL' && isSuperAdmin ? 'Nova Campanha da Rede' : 'Nova Promoção da Loja'}</span>
        </Button>
      </div>

      {/* Abas de Navegação: Franqueadora (Rede) vs Ofertas Locais */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-purple-50/70 dark:bg-white/5 border border-purple-150 dark:border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('GLOBAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'GLOBAL'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-sm'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Campanhas da Franqueadora (Rede)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {globalOffers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LOCAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'LOCAL'
              ? 'bg-purple-700 dark:bg-pink-600 text-white shadow-sm'
              : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Minhas Ofertas Locais</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {localOffers.length}
          </span>
        </button>
      </div>

      {/* Aviso informativo de acordo com a aba */}
      <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-150 dark:border-white/10 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
        {activeTab === 'GLOBAL' ? (
          <div>
            <strong>Campanhas Oficiais da Franqueadora:</strong> Padronizadas para toda a rede de franquias.
            {!isSuperAdmin && ' Você pode ativar ou pausar a exibição da campanha na sua unidade.'}
          </div>
        ) : (
          <div>
            <strong>Ofertas & Ações Locais:</strong> Promoções específicas e cupons criados para atender ao movimento da sua unidade.
          </div>
        )}
      </div>

      {/* Grid de Ofertas */}
      {displayedOffers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-purple-200 dark:border-white/15 bg-white dark:bg-white/5 space-y-3">
          <Tag className="h-8 w-8 text-purple-400 dark:text-purple-500 mx-auto" />
          <p className="text-sm font-bold text-purple-950 dark:text-white">Nenhuma oferta cadastrada nesta seção.</p>
          <Button onClick={handleOpenNew} className="bg-purple-700 dark:bg-pink-600 text-white font-bold text-xs h-9 px-4 rounded-xl">
            Criar Primeira Oferta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayedOffers.map((off) => {
            const isStoreActive = isOfferActiveInStore(tenantId, off)

            return (
              <div
                key={off.id}
                className={`bg-white dark:bg-[#160228]/95 rounded-3xl border transition-all shadow-xs dark:shadow-xl overflow-hidden flex flex-col justify-between text-slate-900 dark:text-white ${
                  isStoreActive
                    ? 'border-purple-150 dark:border-white/15 hover:border-purple-400 dark:hover:border-pink-500/50'
                    : 'border-purple-100 dark:border-white/10 opacity-70 bg-zinc-50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Header do Card de Oferta */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-700 dark:bg-pink-600 text-white">
                      -{off.discountPercent}% OFF
                    </span>

                    {off.scope === 'GLOBAL' ? (
                      <Badge className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[9px] font-bold">
                        Padrão da Rede
                      </Badge>
                    ) : (
                      <Badge className="bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-[9px] font-bold">
                        Ação Local
                      </Badge>
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

                  {/* Preços De / Por */}
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
                    {off.couponCode && (
                      <div className="pt-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-white/10 text-purple-900 dark:text-pink-300 border border-purple-200 dark:border-white/15">
                          CUPOM: {off.couponCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Inferiores */}
                <div className="p-3.5 bg-purple-50/40 dark:bg-black/20 border-t border-purple-100 dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(off)}
                    className="cursor-pointer"
                  >
                    {isStoreActive ? (
                      <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold text-[10px]">
                        Ativa na Loja
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-zinc-200 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 font-bold text-[10px]">
                        Pausada
                      </Badge>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {(isSuperAdmin || off.scope === 'LOCAL') && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(off)}
                          className="h-8 w-8 p-0 text-purple-700 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white rounded-lg cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDelete(off)}
                          className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Criar / Editar Oferta */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#160228] border-purple-200 dark:border-white/15 text-slate-900 dark:text-white shadow-2xl rounded-3xl [&>button]:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-white/10">
            <DialogTitle className="text-base font-black text-purple-950 dark:text-white">
              {editingOffer ? 'Editar Oferta' : activeTab === 'GLOBAL' && isSuperAdmin ? 'Nova Campanha da Franqueadora' : 'Nova Promoção da Loja'}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white px-2 py-1 rounded-lg"
            >
              Fechar
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4 my-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Título da Oferta:</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Happy Hour de Açaí 350g"
                required
                className="h-9 rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Descrição do Benefício:</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="ex: 20% de desconto em dias úteis à tarde"
                className="h-9 rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Produto Vinculado:</Label>
              <select
                value={formData.productName}
                onChange={(e) => {
                  const pName = e.target.value
                  let pOrig = 9.0
                  if (pName === 'Açaí 250g') pOrig = 6.5
                  if (pName === 'Açaí 350g') pOrig = 9.0
                  if (pName === 'Açaí 500g') pOrig = 12.9
                  if (pName === 'Açaí 750g') pOrig = 18.9
                  if (pName === 'Açaí 1 Kg') pOrig = 25.9
                  setFormData({
                    ...formData,
                    productName: pName,
                    originalPrice: pOrig,
                    discountedPrice: Number((pOrig * 0.8).toFixed(2)),
                  })
                }}
                className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-purple-950 dark:text-white"
              >
                <option value="Açaí 250g">Açaí 250g (€ 6,50)</option>
                <option value="Açaí 350g">Açaí 350g (€ 9,00)</option>
                <option value="Açaí 500g">Açaí 500g (€ 12,90)</option>
                <option value="Açaí 750g">Açaí 750g (€ 18,90)</option>
                <option value="Açaí 1 Kg">Açaí 1 Kg (€ 25,90)</option>
                <option value="Todos os Copos">Todos os Copos / Geral</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço Original (€):</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                  className="h-9 rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Preço c/ Desconto (€):</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: Number(e.target.value) })}
                  className="h-9 rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 font-mono font-bold text-pink-600 dark:text-pink-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Dias Válidos:</Label>
                <select
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-purple-950 dark:text-white"
                >
                  <option value="Segunda a Sexta">Segunda a Sexta</option>
                  <option value="Todos os dias">Todos os dias</option>
                  <option value="Sábado e Domingo">Sábado e Domingo</option>
                  <option value="Terça e Quinta">Terça e Quinta</option>
                  <option value="Quarta-feira">Quarta-feira</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-purple-950 dark:text-white">Horário de Vigência:</Label>
                <select
                  value={formData.validHours}
                  onChange={(e) => setFormData({ ...formData, validHours: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-purple-200 dark:border-white/15 bg-white dark:bg-[#160228] text-purple-950 dark:text-white"
                >
                  <option value="14:00 às 18:00">14:00 às 18:00 (Tarde)</option>
                  <option value="17:00 às 21:00">17:00 às 21:00 (Sunset)</option>
                  <option value="Sempre ativo">Sempre ativo</option>
                  <option value="12:00 às 15:00">12:00 às 15:00 (Almoço)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-purple-950 dark:text-white">Código do Cupom (Opcional):</Label>
              <Input
                value={formData.couponCode}
                onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                placeholder="ex: HAPPYROSE ou LISBOA10"
                className="h-9 rounded-xl bg-white dark:bg-white/5 border-purple-200 dark:border-white/15 font-mono uppercase font-bold"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-purple-100 dark:border-white/10 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="h-9 rounded-xl border-purple-200 dark:border-white/15 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 px-5 rounded-xl bg-gradient-to-r from-purple-700 to-pink-600 dark:from-pink-600 dark:to-purple-600 text-white text-xs font-bold"
              >
                Guardar Oferta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão Segura */}
      <SafeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={deletingOffer?.title || 'esta oferta'}
        onConfirm={handleConfirmDelete}
        loading={deletingLoading}
      />
    </div>
  )
}
