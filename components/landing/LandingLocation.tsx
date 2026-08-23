'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Clock, Instagram, ExternalLink, Navigation } from 'lucide-react'

export default function LandingLocation() {
  return (
    <section id="loja" className="max-w-[1536px] mx-auto px-6 sm:px-12 lg:px-16 py-16">
      <div className="p-8 sm:p-12 lg:p-16 rounded-[2.5rem] bg-gradient-to-r from-[#1d0232] via-[#2b044a] to-[#150123] border border-white/15 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
        
        {/* Foto da Loja Física Oficial com Altura Expandida */}
        <div className="lg:col-span-6 relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl group flex flex-col min-h-[420px] sm:min-h-[500px] lg:min-h-[560px]">
          <img
            src="/images/official/loja_fachada.webp"
            alt="Loja Física Açaí da Rose Torres Novas"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-6 sm:p-8">
            <div className="space-y-1 text-left">
              <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
                Matriz Oficial
              </span>
              <div className="text-lg sm:text-xl font-black text-white">Torres Novas · Portugal</div>
            </div>
          </div>
        </div>

        {/* Informações da Loja & Contatos com Tipografia Expandida */}
        <div className="lg:col-span-6 space-y-6 text-left flex flex-col justify-center">
          <div className="space-y-3">
            <Badge className="bg-pink-600 text-white border-0 font-black text-xs py-1.5 px-4 rounded-full w-fit">
              Visite a Nossa Loja em Torres Novas
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Venha Sentir o Sabor que Abraça a Alma
            </h2>

            <p className="text-sm sm:text-base text-purple-200/85 leading-relaxed max-w-xl">
              Ambiente acolhedor, atendimento caloroso e o açaí mais fresco de Portugal. Estamos prontos para receber você e sua família para uma experiência inesquecível.
            </p>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-purple-200/90">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
              <MapPin className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block text-sm">Morada:</span>
                <span className="text-purple-200/90 text-xs sm:text-sm">
                  Av. Manuel de Figueiredo 12, 2350-771 Torres Novas, Portugal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="font-bold text-white text-sm block">Horário:</span>
                </div>
                <div className="text-xs text-purple-200/90 pl-6 space-y-1">
                  <div>Segunda – Quinta: 13:00 – 22:00</div>
                  <div>Sexta: 13:00 – 20:00</div>
                  <div>Sábado – Domingo: 15:00 – 22:00</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
                <Phone className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white block text-sm">WhatsApp & Contacto:</span>
                  <span className="text-pink-300 font-mono font-bold text-sm block mt-0.5">
                    +351 911 050 264
                  </span>
                  <div className="text-[11px] text-purple-300/80 mt-0.5">contato@acaidarose.pt</div>
                </div>
              </div>
            </div>
          </div>

          {/* Links e Rotas Rápidas */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <a
              href="https://wa.me/351911050264"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-600/30 transition hover:scale-105"
            >
              <Phone className="h-4 w-4" />
              <span>Falar no WhatsApp</span>
            </a>

            <a
              href="https://instagram.com/acaidarose.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg transition hover:scale-105"
            >
              <Instagram className="h-4 w-4" />
              <span>@acaidarose.pt</span>
            </a>

            <a
              href="https://www.google.com/maps/place/A%C3%A7a%C3%AD+da+Rose+Torres+Novas/@39.483811,-8.538574,17z"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2.5 border border-white/20 transition hover:scale-105"
            >
              <Navigation className="h-4 w-4 text-pink-400" />
              <span>Abrir no Google Maps</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
