'use client'

import React, { useState } from 'react'
import { Tenant } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Store, MapPin, Phone, Wifi, Clock, Star, Copy, ExternalLink, Heart, Gift, Coins, CheckCircle2 } from 'lucide-react'

interface CustomerMenuMoreProps {
  tenant: Tenant | null
}

export default function CustomerMenuMore({ tenant }: CustomerMenuMoreProps) {
  const [ratingOpen, setRatingOpen] = useState(false)
  const [ratingStars, setRatingStars] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  const handleCopyWifi = () => {
    if (tenant?.wifiPassword) {
      navigator.clipboard.writeText(tenant.wifiPassword)
      toast.success('Senha do Wi-Fi copiada para a área de transferência!')
    }
  }

  const handleSendRating = async () => {
    setSubmittingRating(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id || 'tenant-torres-novas',
          stars: ratingStars,
          comment: ratingComment,
        }),
      })

      if (!res.ok) throw new Error('Falha ao registar avaliação')

      toast.success('Obrigado pela sua avaliação! A sua opinião é muito importante para o Açaí da Rose.')
      setRatingOpen(false)
      setRatingComment('')
    } catch {
      toast.error('Erro ao enviar avaliação. Tente novamente.')
    } finally {
      setSubmittingRating(false)
    }
  }

  // Horários de funcionamento
  const now = new Date()
  const currentHour = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const dayKey = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][now.getDay()]
  const todayHours = tenant?.openingHours?.[dayKey] || { open: '12:00', close: '22:00' }
  const isOpen = currentHour >= todayHours.open && currentHour <= todayHours.close

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-28">
      {/* 1. Header com Banner da Unidade */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#280447] via-[#3a065f] to-[#1a012e] border border-white/15 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-fuchsia-600 text-white tracking-wider">
              UNIDADE OFICIAL
            </span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aberta agora · Fecha às {todayHours.close}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Fechada · Abre às {todayHours.open}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {tenant?.name || 'Açaí da Rose'}
          </h1>

          <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
            {tenant?.aboutText || 'O autêntico açaí brasileiro servido em Portugal com frutas frescas selecionadas, cremes artesanais e acompanhamentos de alta qualidade.'}
          </p>
        </div>

        <div className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="Açaí da Rose"
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* 2. Banner Oficial: S2 Cashback & Programa de Fidelidade */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-fuchsia-950/90 via-purple-900/90 to-pink-950/90 border-2 border-fuchsia-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30 flex-shrink-0">
            <Coins className="h-8 w-8 text-amber-300" />
          </div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-purple-950">
                S2 CASHBACK OFICIAL
              </span>
              <span className="text-xs font-bold text-fuchsia-300">Ganhe Pontos a Cada Pedido!</span>
            </div>
            <h2 className="text-lg font-black text-white">Programa de Fidelidade Açaí da Rose</h2>
            <p className="text-xs text-purple-200/80 max-w-xl">
              Acumule saldo em cashback e troque seus pontos por copos de açaí, adicionais grátis e promoções exclusivas na sua conta S2 Cashback.
            </p>
          </div>
        </div>

        <a
          href="https://s2cashback.com/acai-da-rose/?utm_source=menu_app"
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-purple-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 hover:scale-105 flex-shrink-0 cursor-pointer"
        >
          <Gift className="h-4 w-4" />
          <span>Aceder ao S2 Cashback</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* 3. Grid de Informações em 3 Colunas no Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Coluna 1: Morada & Localização */}
        <div className="p-6 rounded-3xl bg-[#1e0333]/90 border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-fuchsia-600/20 text-fuchsia-400">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Morada & Localização</h3>
                <span className="text-[11px] text-purple-200/70">Venha nos visitar</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
              <div className="font-bold text-white">{tenant?.address || 'Av. Principal, Loja Açaí da Rose'}</div>
              <div className="text-purple-200/80">{tenant?.city || 'Torres Novas'}, Portugal</div>
            </div>
          </div>

          <a
            href={tenant?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((tenant?.name || 'Açaí da Rose') + ' ' + (tenant?.city || 'Torres Novas'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>Abrir no Google Maps</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Coluna 2: Wi-Fi do Salão & Horários */}
        <div className="p-6 rounded-3xl bg-[#1e0333]/90 border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Wi-Fi do Salão</h3>
                <span className="text-[11px] text-purple-200/70">Internet gratuita para clientes</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-300">Segunda – Quinta:</span>
                <span className="font-bold text-white font-mono">13:00 – 22:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Sexta:</span>
                <span className="font-bold text-fuchsia-300 font-mono">13:00 – 20:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-300">Sábado – Domingo:</span>
                <span className="font-bold text-amber-300 font-mono">15:00 – 22:00</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-purple-300">Wi-Fi Clientes:</span>
                <span className="font-bold text-white">{tenant?.wifiNetwork || 'Acai_da_Rose_WiFi'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">Senha:</span>
                <span className="font-mono font-bold text-cyan-300">{tenant?.wifiPassword || 'acai2026'}</span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCopyWifi}
            className="w-full h-11 rounded-2xl bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copiar Palavra-passe do Wi-Fi</span>
          </Button>
        </div>

        {/* Coluna 3: Contactos & Avaliações */}
        <div className="p-6 rounded-3xl bg-[#1e0333]/90 border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-white">Avaliação & Contactos</h3>
                <span className="text-[11px] text-purple-200/70">Diga-nos o que achou</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-purple-200">
                <span>MB Way & Tel:</span>
                <span className="font-bold text-emerald-400">{tenant?.phone || '+351 911 000 000'}</span>
              </div>
              <div className="flex justify-between text-purple-200">
                <span>Classificação:</span>
                <span className="font-black text-amber-300">
                  ★ {tenant?.ratingAverage ? tenant.ratingAverage.toFixed(1) : '4.9'} ({tenant?.reviewsCount || '500+'} avaliações)
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setRatingOpen(true)}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Heart className="h-3.5 w-3.5" />
            <span>Avaliar Atendimento da Loja</span>
          </Button>
        </div>
      </div>

      {/* Modal de Avaliação Corrigido com Botões Perfeitos */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="max-w-md p-6 bg-[#160228] text-white border border-white/20 rounded-3xl shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-black text-white">
              Como foi a sua experiência?
            </DialogTitle>
            <p className="text-xs text-purple-200/70 mt-1">
              {tenant?.name || 'Açaí da Rose'}
            </p>
          </DialogHeader>

          <div className="my-4 space-y-4 text-center">
            {/* Estrelas */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="text-3xl sm:text-4xl transition hover:scale-125 cursor-pointer"
                >
                  {star <= ratingStars ? '⭐' : '☆'}
                </button>
              ))}
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Deixe um comentário opcional (ex: atendimento excelente, açaí muito saboroso)..."
              rows={3}
              className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-purple-300/40 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRatingOpen(false)}
              className="h-11 rounded-2xl px-5 text-xs font-bold bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={submittingRating}
              onClick={handleSendRating}
              className="h-11 rounded-2xl px-6 bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-black text-xs shadow-lg shadow-fuchsia-600/30 cursor-pointer"
            >
              {submittingRating ? 'A enviar...' : 'Enviar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
