'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Smartphone, Award, TrendingUp } from 'lucide-react'

export default function LandingAboutAcai() {
  return (
    <section id="sobre" className="max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 py-16 sm:py-20 space-y-12">

      {/* Título da Seção */}
      <div className="text-left space-y-2 border-b border-white/10 pb-4">
        <span className="text-sm font-black uppercase tracking-wider text-pink-400">
          Nossa História
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Sobre Nós
        </h2>
      </div>

      {/* Grid Principal com UX Aprimorada */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

        {/* Coluna Visual: Foto com Enquadramento Focado e Bordas Premium */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-5 relative space-y-4"
        >
          <div className="relative rounded-3xl overflow-hidden border-2 border-pink-500/40 shadow-2xl shadow-purple-950/70 ring-1 ring-white/15 group h-[400px] sm:h-[480px] lg:h-[520px]">
            <img
              src="/images/official/banner_sobre_nos.jpg"
              onError={(e) => {
                ; (e.target as HTMLImageElement).src = '/images/acai_500g.jpg'
              }}
              alt="Rose e Valdair - Fundadores do Açaí da Rose"
              className="w-full h-full object-cover object-[63%_center] group-hover:scale-105 transition-transform duration-700 block"
            />

            {/* Gradiente sutil para legibilidade dos badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Badge Flutuante Superior */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                <span>🇧🇷</span>
                <span className="text-pink-300 font-semibold">Do Brasil para Portugal</span>
                <span>🇵🇹</span>
              </span>
            </div>

            {/* Card Flutuante Inferior com Informações dos Fundadores */}
            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 shadow-xl text-left space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-white">Valdair & Rose</h4>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-md">
                  <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                  Fundadores
                </span>
              </div>
              <p className="text-xs text-purple-200/90 leading-snug">
                Oferecendo a experiência autêntica do açaí brasileiro puro com cuidado e carinho.
              </p>
            </div>
          </div>

          {/* Mini-Badges de Destaque */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-base sm:text-lg font-black text-pink-400">2023</div>
              <div className="text-[11px] text-purple-200/80 font-medium">Fundação</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-base sm:text-lg font-black text-white">100%</div>
              <div className="text-[11px] text-purple-200/80 font-medium">Fruta Pura</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-base sm:text-lg font-black text-emerald-400">App</div>
              <div className="text-[11px] text-purple-200/80 font-medium">Cashback</div>
            </div>
          </div>
        </motion.div>

        {/* Coluna de Texto & Linha do Tempo */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:col-span-7 space-y-6 text-left"
        >
          <div className="space-y-3">
            <h3 className="text-2xl sm:text-3xl font-black text-pink-200 leading-snug">
              O sabor do Brasil no coração de Portugal, com sabor autêntico, irresistível e cheio de personalidade.
            </h3>
            <p className="text-sm sm:text-base text-purple-200/90 leading-relaxed font-normal">
              Fundado por <b>Rose e Valdair</b>, o negócio começou com um propósito enorme: oferecer uma experiência única com o açaí — aquele que respeita as raízes brasileiras, a tradição da fruta pura e um cuidado artesanal em cada detalhe.
            </p>
          </div>

          {/* Cards de Etapas / Diferenciais de UX */}
          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400 flex-shrink-0 mt-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-sm font-black text-white">Sabor Puro & Conexão</h4>
                <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                  Conquistamos o paladar e o carinho dos clientes mantendo a integridade da fruta e receitas originais sem misturas artificiais.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 flex-shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-sm font-black text-white">Inovação com App & Fidelidade (2024)</h4>
                <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                  Lançamos nosso próprio aplicativo com cashback, pontos e benefícios exclusivos para premiar cada visita.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-sm font-black text-white">Expansão & Franquias</h4>
                <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                  Hoje somos um estilo de vida em expansão por Portugal e Europa, com modelo de franquias validado e rentável.
                </p>
              </div>
            </div>
          </div>

          {/* Faixa Conclusiva */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-pink-600/25 via-fuchsia-600/20 to-purple-600/25 border border-pink-500/40 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-between gap-4">
            <span>Açaí da Rose · Do Brasil para a Europa com amor, inovação e propósito.</span>
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400 flex-shrink-0 hidden sm:block" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
