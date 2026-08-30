'use client'

import React, { useState } from 'react'
import { Tenant } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MapPin, Phone, Clock, Star, ExternalLink, Heart, CheckCircle2, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

interface CustomerMenuMoreProps {
  tenant: Tenant | null
}

export default function CustomerMenuMore({ tenant }: CustomerMenuMoreProps) {
  const { theme, setTheme } = useTheme()
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
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-4 select-none">
      
      {/* 1. Card Nobre da Unidade Oficial com a Foto Real da Loja */}
      <div className="p-6 md:p-10 rounded-3xl bg-white border border-purple-100 shadow-md dark:bg-gradient-to-r dark:from-[#200336] dark:via-[#2d054d] dark:to-[#19022c] dark:border-white/15 dark:shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-slate-900 dark:text-white transition-colors duration-200">
        
        {/* Foto da Loja Real (Fachada) */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-purple-200 dark:border-white/20 shadow-md group">
          <img
            src="/images/official/loja_fachada.webp"
            alt="Loja Açaí da Rose Torres Novas"
            className="w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-pink-400 tracking-wider">Matriz Oficial</span>
              <div className="text-sm font-bold text-white">Torres Novas · Portugal</div>
            </div>
          </div>
        </div>

        {/* Dados Institucionais & Botões de Contato */}
        <div className="lg:col-span-7 space-y-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-pink-600 text-white font-bold text-xs">
              Visite-nos em Torres Novas
            </span>
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aberta agora · Fecha às {todayHours.close}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-500/30">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Fechada · Abre às {todayHours.open}</span>
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            O Autêntico Açaí Brasileiro ao seu Alcance
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200/85 leading-relaxed">
            Trabalhamos diariamente para levar a melhor experiência gastronômica com ingredientes selecionados, frutas frescas da época e o carinho que você merece.
          </p>

          <div className="space-y-2 text-xs text-slate-700 dark:text-purple-200/90 pt-1">
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-pink-500 flex-shrink-0" />
              <span><b>Morada:</b> {tenant?.address || 'Av. Manuel de Figueiredo 12'}, {tenant?.city || 'Torres Novas'}, Portugal</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span><b>Contacto / MB Way:</b> {tenant?.phone || '+351 911 050 264'}</span>
            </div>
          </div>

          {/* Links Rápidos Oficiais */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://wa.me/351911050264"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
            >
              <Phone className="h-4 w-4" />
              <span>Falar no WhatsApp</span>
            </a>

            <a
              href="https://instagram.com/acaidarose.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-102 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>@acaidarose.pt</span>
            </a>

            <a
              href="https://www.google.com/maps/place/A%C3%A7a%C3%AD+da+Rose+Torres+Novas/@39.483811,-8.538574,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white font-bold text-xs flex items-center gap-2 border border-purple-200 dark:border-white/20 transition-all cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-pink-500" />
              <span>Ver no Mapa</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Grid de Informações: Horários de Funcionamento & Avaliação de Atendimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Coluna 1: Horários Detalhados de Funcionamento */}
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-purple-100 shadow-md dark:bg-[#1e0333]/90 dark:border-white/10 dark:shadow-xl space-y-4 flex flex-col justify-between text-left text-slate-900 dark:text-white transition-colors duration-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Horários de Atendimento</h3>
                <span className="text-[11px] text-slate-500 dark:text-purple-200/70">Consulte os horários da nossa loja física</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between items-center py-0.5 border-b border-purple-100 dark:border-white/5">
                <span className="text-slate-600 dark:text-purple-300">Segunda – Quinta:</span>
                <span className="font-bold font-mono">13:00 – 22:00</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-purple-100 dark:border-white/5">
                <span className="text-slate-600 dark:text-purple-300">Sexta-feira:</span>
                <span className="font-bold text-pink-600 dark:text-pink-300 font-mono">13:00 – 20:00</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600 dark:text-purple-300">Sábado – Domingo:</span>
                <span className="font-bold text-amber-600 dark:text-amber-300 font-mono">15:00 – 22:00</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-purple-300/80 pt-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Atendimento no salão & take-away</span>
          </div>
        </div>

        {/* Coluna 2: Avaliações & Diga-nos o que achou */}
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-purple-100 shadow-md dark:bg-[#1e0333]/90 dark:border-white/10 dark:shadow-xl space-y-4 flex flex-col justify-between text-left text-slate-900 dark:text-white transition-colors duration-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Avaliação & Experiência</h3>
                <span className="text-[11px] text-slate-500 dark:text-purple-200/70">A sua opinião é muito importante para nós</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-purple-200">Classificação dos Clientes:</span>
                <span className="font-bold text-amber-600 dark:text-amber-300 text-sm">
                  {tenant?.ratingAverage ? tenant.ratingAverage.toFixed(1) : '4.9'} ({tenant?.reviewsCount || '500+'} avaliações)
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-purple-300/70 leading-relaxed">
                Adoramos saber como foi a sua experiência com os nossos açaís artesanais.
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setRatingOpen(true)}
            className="w-full h-11 rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-pink-600/20 cursor-pointer transition-all hover:scale-102"
          >
            <Heart className="h-4 w-4 fill-white" />
            <span>Avaliar Atendimento da Loja</span>
          </Button>
        </div>
      </div>

      {/* 2.5 Seletor de Aparência / Tema (Claro / Escuro) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-purple-100 shadow-md dark:bg-[#1e0333]/90 dark:border-white/10 dark:shadow-xl space-y-3 text-left text-slate-900 dark:text-white transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Aparência do Cardápio</h3>
            <span className="text-[11px] text-slate-500 dark:text-purple-200/70">Escolha o tema visual de sua preferência</span>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-2xl bg-purple-50 border border-purple-200 dark:bg-white/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-purple-200/70 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Escuro</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                theme === 'light'
                  ? 'bg-white text-purple-950 shadow-md border border-purple-200'
                  : 'text-slate-600 dark:text-purple-200/70 hover:text-purple-950 dark:hover:text-white'
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>Claro</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Selos de Conformidade Alimentar & Tabela Nutricional Oficial */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-purple-100 shadow-md dark:bg-[#1f0333]/90 dark:border-white/15 dark:shadow-2xl space-y-6 text-slate-900 dark:text-white text-left transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">Qualidade & Selos de Conformidade Oficial</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-purple-200/70 mt-0.5">
              Polpa de açaí pura, sustentável e com alto valor nutricional
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-[10px] uppercase px-3 py-1 self-start sm:self-auto border-0">
            Padrão Oficial Açaí da Rose
          </Badge>
        </div>

        {/* 6 Selos de Qualidade */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[11px] font-bold">100% VEGAN</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[11px] font-bold">Antioxidantes</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[11px] font-bold">Sem Leite</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[11px] font-bold">Sem Glúten</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[11px] font-bold">Sem Conservantes</div>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 dark:bg-white/5 dark:border-white/10 text-center">
            <div className="text-[11px] font-bold">Origem Pará</div>
          </div>
        </div>

        {/* Ingredientes & Tabela Nutricional */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Ingredientes */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-xs font-black uppercase text-pink-400 tracking-wider">
              Ingredientes Oficiais (PT):
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed font-medium">
              Polpa de Açaí premium, Água, Glucose, Açúcar demerara, Extrato natural de Guaraná, Estabilizante (goma de guar, goma tara, Carboximetilcelulose), Dextrose, Maltodextrina e Ácido cítrico.
            </p>
          </div>

          {/* Tabela Nutricional */}
          <div className="lg:col-span-7 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/10 text-purple-200 text-[10px] uppercase font-black">
                <tr>
                  <th className="p-2.5">Componente (Porção 100g)</th>
                  <th className="p-2.5 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                <tr className="bg-white/5 font-black text-pink-300">
                  <td className="p-2.5">Valor Energético / Energia</td>
                  <td className="p-2.5 text-right font-mono">111 kcal / 469 kJ</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-200">Proteínas</td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">0,5 g</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-200">Lípidos (dos quais saturados)</td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">2,3 g (0,6 g)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-200">Hidratos de Carbono (dos quais açúcares)</td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">20,9 g (20,7 g)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-200">Fibra Alimentar</td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">2,5 g</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-200">Cálcio / Vitamina C / Potássio</td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">103 mg / 13 mg / 28,2 mg</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-200">Sal</td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">0,05 g</td>
                </tr>
              </tbody>
            </table>
          </div>
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
                  className="p-1 transition hover:scale-125 cursor-pointer"
                >
                  <Star
                    className={`h-8 w-8 sm:h-9 sm:w-9 ${
                      star <= ratingStars ? 'fill-amber-400 text-amber-400' : 'text-purple-300/40 hover:text-purple-200'
                    }`}
                  />
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
