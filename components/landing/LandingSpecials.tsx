'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Heart, CheckCircle2 } from 'lucide-react'

export default function LandingSpecials() {
  return (
    <section id="especiais" className="max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 py-12 space-y-8">
      <div className="border-b border-white/10 pb-4 text-left">
        <span className="text-pink-400 text-xs font-black uppercase tracking-wider">
          Além da Tigela Tradicional
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
          Especialidades da Casa
        </h2>
        <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
          Descubra criações exclusivas preparadas diariamente com o mesmo padrão artesanal e ingredientes de excelência.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Milkshake de Açaí */}
        <motion.div
          whileHover={{ y: -6 }}
          className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-pink-500/40 hover:bg-white/[0.05] shadow-xl flex flex-col sm:flex-row items-center gap-6 group transition-all"
        >
          <div className="relative w-40 sm:w-44 h-48 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-pink-500/15 rounded-full blur-xl" />
            <img
              src="/images/official/milkshake_acai.png"
              alt="Milkshake de Açaí da Rose"
              className="relative z-10 h-full w-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="space-y-2.5 text-left flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-pink-600/20 border border-pink-500/30 text-pink-300 font-bold text-[11px] uppercase">
              Refrescante & Proteico
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">Milkshake de Açaí</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              Refrescante, leve e com proteína! O milkshake de açaí é a escolha perfeita para matar a vontade de doce com saúde e sabor puro.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-pink-400 font-medium">
              <CheckCircle2 className="h-4 w-4 text-pink-400" />
              <span>Preparado com açaí artesanal e frutas</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Crepioca Recheada */}
        <motion.div
          whileHover={{ y: -6 }}
          className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.05] shadow-xl flex flex-col sm:flex-row items-center gap-6 group transition-all"
        >
          <div className="relative w-40 sm:w-44 h-48 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-xl" />
            <img
              src="/images/official/crepioca_delicia.png"
              alt="Crepioca Recheada da Rose"
              className="relative z-10 h-full w-auto object-contain group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="space-y-2.5 text-left flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] uppercase">
              Receita Tradicional
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">Crepioca Recheada</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              A autêntica crepioca brasileira crocante por fora e macia por dentro, com deliciosas opções de recheios doces ou salgados.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-amber-300 font-medium">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Massa leve e rica em nutrientes</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
