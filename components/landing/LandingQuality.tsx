'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Leaf, ShieldCheck, Heart, Award } from 'lucide-react'

const PILLARS = [
  {
    icon: Leaf,
    title: '100% Vegano & Natural',
    desc: 'Sem aditivos artificiais, rico em antioxidantes, ômegas e fibras para nutrir o corpo com saúde.',
    accent: 'emerald',
  },
  {
    icon: ShieldCheck,
    title: 'Sem Glúten & Sem Lactose',
    desc: 'Livre de laticínios e glúten. Seguro e leve para quem possui restrições ou busca alta performance.',
    accent: 'purple',
  },
  {
    icon: Award,
    title: 'Cremosidade Artesanal',
    desc: 'Batido na consistência perfeita com a receita autêntica brasileira que conquistou Portugal.',
    accent: 'pink',
  },
  {
    icon: Heart,
    title: 'Carinho em Cada Detalhe',
    desc: 'Frutas frescas da época selecionadas e cortadas diariamente com todo o carinho da Rose.',
    accent: 'amber',
  },
]

export default function LandingQuality() {
  return (
    <section id="qualidade" className="max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 py-16">
      <div className="text-left max-w-3xl space-y-3 mb-10 border-b border-white/10 pb-6">
        <span className="text-xs font-black uppercase tracking-wider text-pink-400">
          O Nosso Compromisso com a Sua Saúde
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Por que o Açaí da Rose é Diferente?
        </h2>
        <p className="text-xs sm:text-sm text-purple-200/80">
          Trabalhamos com polpas puras selecionadas da Amazônia para entregar a melhor experiência nutritiva em Portugal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PILLARS.map((p, idx) => {
          const Icon = p.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              className="p-6 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-pink-500/30 hover:bg-white/[0.05] shadow-xl space-y-4 text-left transition-all"
            >
              <div className="h-12 w-12 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">{p.title}</h3>
                <p className="text-xs text-purple-200/70 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
