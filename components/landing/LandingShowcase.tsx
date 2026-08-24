'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Heart, QrCode, CheckCircle2 } from 'lucide-react'

const SIZES = [
  {
    weight: 250,
    name: 'Copo 250gr',
    desc: '2 frutas frescas + 3 toppings + 1 creme especial opcional',
    img: '/images/official/acai_copo_250g.jpg',
    rule: '2 Frutas + 3 Toppings',
    tag: 'Ideal para um lanche leve',
  },
  {
    weight: 350,
    name: 'Copo 350gr',
    desc: '3 frutas frescas + 4 toppings + 1 creme especial opcional',
    img: '/images/official/acai_copo_350g.jpg',
    rule: '3 Frutas + 4 Toppings',
    tag: 'Tamanho perfeito para o dia a dia',
  },
  {
    weight: 500,
    name: 'Copo 500gr',
    desc: 'Frutas & Toppings livres à vontade + 1 creme especial opcional',
    img: '/images/official/acai_copo_500g.jpg',
    rule: 'Frutas & Toppings Livres',
    popular: true,
    tag: 'O campeão de pedidos',
  },
  {
    weight: 750,
    name: 'Tigela 750gr',
    desc: 'Frutas & Toppings livres à vontade + 1 creme especial opcional',
    img: '/images/official/acai_tigela_750g.jpg',
    rule: 'Frutas & Toppings Livres',
    tag: 'Para quem ama açaí de verdade',
  },
  {
    weight: 1000,
    name: 'Balde 1 Kg',
    desc: 'Frutas & Toppings livres à vontade + 1 creme especial opcional',
    img: '/images/official/acai_balde_1kg.jpg',
    rule: 'Frutas & Toppings Livres',
    tag: 'Perfeito para partilhar com a família',
  },
]

export default function LandingShowcase() {
  return (
    <section id="produtos" className="max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 py-16 space-y-10">
      {/* Cabeçalho da Seção */}
      <div className="text-left border-b border-white/10 pb-6">
        <span className="text-sm font-black uppercase tracking-wider text-pink-400">
          Catálogo Oficial
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-1.5">
          Copos & Tigelas Artesanais
        </h2>
        <p className="text-sm sm:text-base text-purple-200/80 mt-2 max-w-2xl">
          Monte a sua combinação ideal com frutas frescas cortadas na hora, cremes artesanais e toppings selecionados.
        </p>
      </div>

      {/* Grade de Tamanhos com Design Clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {SIZES.map((item, index) => (
          <motion.div
            key={item.weight}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            whileHover={{ y: -6 }}
            className={`p-5 rounded-3xl bg-white/[0.03] backdrop-blur-md border ${
              item.popular ? 'border-pink-500/50 shadow-lg shadow-pink-600/10' : 'border-white/10'
            } hover:border-pink-500/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between group`}
          >
            <div>
              {/* Foto do Copo */}
              <div className="relative h-52 w-full rounded-2xl overflow-hidden bg-purple-950/40 mb-4 border border-white/10">
                <img
                  src={item.img}
                  alt={item.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {item.popular ? (
                  <Badge className="absolute top-3 right-3 bg-pink-600 text-white font-black text-xs py-1 px-3 rounded-full border-0 shadow-lg">
                    Mais Pedido
                  </Badge>
                ) : (
                  <Badge className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-pink-300 font-bold text-[11px] py-1 px-2.5 rounded-full border border-pink-500/30">
                    {item.rule}
                  </Badge>
                )}

                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs font-bold text-white">
                  {item.weight >= 1000 ? '1 Kg' : `${item.weight}g`}
                </div>
              </div>

              {/* Título & Descrição */}
              <div className="font-black text-xl text-white group-hover:text-pink-300 transition-colors uppercase tracking-tight text-left">
                {item.name}
              </div>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-1.5 leading-relaxed text-left">
                {item.desc}
              </p>
            </div>

            {/* Rodapé do Card com Regra & Slogan */}
            <div className="mt-4 pt-3 border-t border-white/10 text-left space-y-1">
              <div className="text-[11px] text-pink-300 font-semibold">
                {item.tag}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                <Heart className="h-3 w-3 fill-pink-400/80 text-pink-400/80" />
                <span>O sabor que abraça a alma</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Aviso de Pedido na Loja Física via QR Code */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              Pedidos Exclusivos na Loja & Take-Away
            </div>
            <div className="text-xs text-purple-200/70">
              Faça a sua combinação diretamente na mesa via QR Code na nossa unidade em Torres Novas.
            </div>
          </div>
        </div>

        <div className="text-xs text-pink-300 font-semibold flex items-center gap-2 flex-shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Ingredientes frescos todos os dias</span>
        </div>
      </div>
    </section>
  )
}
