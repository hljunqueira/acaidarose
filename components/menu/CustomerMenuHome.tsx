'use client'

import React, { useMemo } from 'react'
import { CatalogData, ProductContainer } from '@/types'
import { formatCurrency } from '@/lib/i18n/formatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import CustomerPromoCarousel from '@/components/menu/CustomerPromoCarousel'
import { 
  Plus, 
  Heart, 
  ShieldCheck, 
  Leaf, 
  Award,
  ExternalLink, 
} from 'lucide-react'

interface CustomerMenuHomeProps {
  catalog: CatalogData
  tenantId?: string
  onSelectContainer: (c: ProductContainer) => void
  isTable?: boolean
}

const CUP_IMAGES: Record<number, string> = {
  250: '/images/official/acai_copo_250g.jpg',
  350: '/images/official/acai_copo_350g.jpg',
  500: '/images/official/acai_copo_500g.jpg',
  750: '/images/official/acai_tigela_750g.jpg',
  1000: '/images/official/acai_balde_1kg.jpg',
}

export default function CustomerMenuHome({
  catalog,
  tenantId = 'tenant-torres-novas',
  onSelectContainer,
  isTable = false,
}: CustomerMenuHomeProps) {
  // Filtra itens visíveis e ordenados
  const containers = useMemo(() => {
    return (catalog.containers || [])
      .filter((c) => c.active !== false && c.isAvailableInStore !== false)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [catalog.containers])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Handler para cliques no carrossel de promoções (rola suavemente até o catálogo)
  const handleSelectPromo = (promoId: string) => {
    if (promoId === 'hl-4') {
      scrollToSection('especiais-rose')
    } else {
      scrollToSection('cardapio-acai')
    }
  }

  return (
    <div className="space-y-8 pt-4 pb-32 select-none overflow-hidden">
      
      {/* ========================================================
          1. CARROSSEL DE DESTAQUES & COMBOS CAMPEÕES
      ======================================================== */}
      <section className="space-y-3">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <span className="text-base">🔥</span>
            <span className="text-xs font-black uppercase tracking-wider text-pink-400">
              Destaques & Mais Pedidos
            </span>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection('cardapio-acai')}
            className="text-[11px] text-pink-300 hover:text-pink-200 font-semibold cursor-pointer transition-colors"
          >
            Ver todos os tamanhos ↓
          </button>
        </div>

        <CustomerPromoCarousel onSelectPromo={handleSelectPromo} />
      </section>

      {/* ========================================================
          2. BENTO GRID: SELOS OFICIAIS & DIFERENCIAIS DE QUALIDADE
      ======================================================== */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          
          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#230438] to-[#150122] border border-white/10 flex items-center gap-3 shadow-lg"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-black text-white">100% VEGAN</div>
              <div className="text-[11px] text-purple-200/70">Rico em Ômegas & Fibras</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#230438] to-[#150122] border border-white/10 flex items-center gap-3 shadow-lg"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-black text-white">Sem Glúten & Lactose</div>
              <div className="text-[11px] text-purple-200/70">Dairy Free Natural</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#230438] to-[#150122] border border-white/10 flex items-center gap-3 shadow-lg"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-pink-500/20 text-pink-300 flex items-center justify-center flex-shrink-0 border border-pink-500/30">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-black text-white">Cremosidade Pura</div>
              <div className="text-[11px] text-purple-200/70">Receita Original do Brasil</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-b from-[#230438] to-[#150122] border border-white/10 flex items-center gap-3 shadow-lg"
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-500/30">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs md:text-sm font-black text-white">O Sabor da Rose</div>
              <div className="text-[11px] text-purple-200/70">O sabor que abraça a alma</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          3. SHOWCASE INTERATIVO DOS AÇAÍS (SCROLL ANIMATIONS)
      ======================================================== */}
      <section id="cardapio-acai" className="max-w-6xl mx-auto px-4 md:px-8 space-y-6 pt-4">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
              <span>Catálogo Oficial & Personalizável</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
              Escolha o seu Tamanho de Açaí
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1 max-w-xl">
              Selecione o tamanho para adicionar as suas bases geladas, frutas frescas e acompanhamentos favoritos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-fuchsia-300 bg-fuchsia-950/60 px-3 py-1.5 rounded-xl border border-fuchsia-500/30">
              {containers.length} tamanhos disponíveis
            </span>
          </div>
        </div>

        {/* Grade com Animações de Scroll nos Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {containers.map((c, index) => {
            const isFree = c.weightGrams >= 500
            const img = CUP_IMAGES[c.weightGrams] || c.image || '/images/official/acai_copo_500g.jpg'

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => onSelectContainer(c)}
                className="p-4 rounded-3xl bg-gradient-to-b from-[#24043b]/90 to-[#160226]/90 border border-white/15 hover:border-pink-500/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-pink-600/20"
              >
                <div>
                  {/* Foto do Copo com Zoom no Hover */}
                  <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-purple-950/50 mb-3 border border-white/10">
                    <img
                      src={img}
                      alt={c.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Badge de Destaque */}
                    {isFree ? (
                      <Badge className="absolute top-2.5 right-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[9px] py-0.5 px-2.5 rounded-full border-0 shadow-lg">
                        Frutas & Toppings Livres
                      </Badge>
                    ) : (
                      <Badge className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-pink-300 font-black text-[9px] py-0.5 px-2 rounded-full border border-pink-500/30">
                        Até {c.limiteFrutas || 2} Frutas
                      </Badge>
                    )}

                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                      {c.weightGrams}g
                    </div>
                  </div>

                  {/* Nome & Descrição */}
                  <div className="font-black text-lg text-white group-hover:text-pink-300 transition-colors uppercase tracking-tight">
                    {c.name}
                  </div>
                  
                  <p className="text-[11px] text-purple-200/70 mt-1 line-clamp-2 leading-relaxed">
                    {isFree
                      ? 'Açaí cremoso batido na hora com frutas frescas e acompanhamentos à vontade.'
                      : `Inclui 1 base gelada, até ${c.limiteFrutas || 2} frutas e ${c.limiteToppings || 3} complementos.`}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-pink-400 font-semibold">
                    <Heart className="h-3 w-3 fill-pink-400" />
                    <span>O sabor que abraça a alma</span>
                  </div>
                </div>

                {/* Preço e Botão de Montar */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold">A partir de</div>
                    <div className="text-lg font-black text-pink-300 font-mono">
                      {formatCurrency(c.precoBase)}
                    </div>
                  </div>

                  <span className="h-10 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 group-hover:from-pink-500 group-hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-pink-600/30 transition-all">
                    <Plus className="h-4 w-4" />
                    <span>{isTable ? 'Montar Pedido' : 'Personalizar'}</span>
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ========================================================
          4. SEÇÃO ESPECIAL: MILKSHAKES DE AÇAÍ & CREPIOCAS
      ======================================================== */}
      <section id="especiais-rose" className="max-w-6xl mx-auto px-4 md:px-8 space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="text-pink-400 text-xs font-bold uppercase tracking-wider">
            🥤 Além da Tigela Tradicional
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
            Outras Delícias da Rose
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
            Descubra criações exclusivas preparadas com o mesmo padrão artesanal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Milkshake de Açaí */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#2a0445] to-[#170126] border border-white/15 shadow-xl flex flex-col sm:flex-row items-center gap-6 group"
          >
            <div className="relative w-40 h-44 flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl" />
              <img
                src="/images/official/milkshake_acai.png"
                alt="Milkshake de Açaí da Rose"
                className="relative z-10 h-full w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="space-y-3 text-left">
              <span className="px-3 py-1 rounded-full bg-pink-600/30 border border-pink-500/40 text-pink-300 font-black text-[10px] uppercase">
                Refrescante & Proteico
              </span>
              <h3 className="text-xl font-black text-white">Milkshake de Açaí</h3>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                Refrescante, leve e com proteína! O milkshake de açaí é a escolha perfeita para matar a vontade de doce sem culpa.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-lg font-black text-pink-300 font-mono">€ 4,50</span>
                <Button 
                  onClick={() => {
                    if (containers.length > 0) onSelectContainer(containers[0])
                  }}
                  className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs cursor-pointer"
                >
                  Pedir no Balcão
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Crepioca da Rose */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#2a0445] to-[#170126] border border-white/15 shadow-xl flex flex-col sm:flex-row items-center gap-6 group"
          >
            <div className="relative w-40 h-44 flex-shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl" />
              <img
                src="/images/official/crepioca_delicia.png"
                alt="Crepioca da Rose"
                className="relative z-10 h-full w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </div>

            <div className="space-y-3 text-left">
              <span className="px-3 py-1 rounded-full bg-amber-600/30 border border-amber-500/40 text-amber-300 font-black text-[10px] uppercase">
                Receita Tradicional
              </span>
              <h3 className="text-xl font-black text-white">Crepioca Recheada</h3>
              <p className="text-xs text-purple-200/80 leading-relaxed">
                A autêntica crepioca brasileira crocante por fora e macia por dentro, com opções de recheios doces ou salgados.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-lg font-black text-amber-300 font-mono">€ 4,00</span>
                <Button 
                  onClick={() => {
                    if (containers.length > 0) onSelectContainer(containers[0])
                  }}
                  className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs cursor-pointer"
                >
                  Pedir no Balcão
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          5. PROGRAMA DE FIDELIDADE & S2 CASHBACK OFICIAL
      ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative overflow-hidden p-6 sm:p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#2a0448] via-[#3d0663] to-[#1a012d] border-2 border-pink-500/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
          
          {/* Glows de Fundo */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Conteúdo & Proposta de Valor do Cashback */}
          <div className="relative z-10 space-y-3 text-left max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-purple-950 tracking-wider shadow-md font-['Outfit']">
                S2 CASHBACK OFICIAL
              </span>
              <span className="text-xs font-bold text-pink-300">
                ★ Programa de Fidelidade Açaí da Rose
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight font-['Outfit']">
              Ganhe Dinheiro de Volta em Cada Pedido!
            </h3>

            <p className="text-xs sm:text-sm md:text-base text-purple-200/85 leading-relaxed">
              Acumule saldo em cashback a cada compra realizada e troque seus pontos por copos de açaí, adicionais grátis e promoções exclusivas na sua conta <b>S2 Cashback</b>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-amber-300 font-bold">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <span>💰</span>
                <span>Acumule pontos em euros</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <span>🍨</span>
                <span>Troque por açaí grátis</span>
              </div>
            </div>
          </div>

          {/* Botão de Acesso ao S2 Cashback */}
          <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <a
              href="https://s2cashback.com/acai-da-rose/?utm_source=menu_app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto h-13 sm:h-14 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-purple-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xl shadow-amber-400/30 hover:scale-105 cursor-pointer font-['Outfit'] tracking-tight"
            >
              <span>Aceder ao S2 Cashback</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <span className="text-[11px] text-purple-200/70 font-semibold">
              Disponível para iOS & Android
            </span>
          </div>
        </div>
      </section>

    </div>
  )
}
