'use client'

import React from 'react'
import Link from 'next/link'
import { Heart, Instagram, Phone, MapPin } from 'lucide-react'

export default function LandingFooter() {
  return (
    <footer className="bg-[#0e0117] border-t border-white/10 text-white/80 py-12 px-6 sm:px-12 lg:px-16 mt-16">
      <div className="max-w-[1536px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Coluna 1: Marca & Slogan */}
        <div className="space-y-3 text-left md:col-span-2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Açaí da Rose" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-base font-black text-white uppercase tracking-tight">
                Açaí da Rose
              </div>
              <div className="text-xs text-pink-400 font-bold">
                O sabor que abraça a alma
              </div>
            </div>
          </div>
          <p className="text-xs text-purple-200/70 max-w-md leading-relaxed">
            Açaí não se explica: se experimenta, se apaixona e repete. Levando o verdadeiro sabor e energia do açaí artesanal brasileiro a Portugal.
          </p>
          <div className="text-[11px] text-pink-300 font-mono">
            Torres Novas
          </div>
        </div>

        {/* Coluna 2: Links Rápidos */}
        <div className="space-y-2 text-left">
          <div className="text-xs font-black text-white uppercase tracking-wider">
            Navegação
          </div>
          <ul className="space-y-1.5 text-xs text-purple-200/70">
            <li>
              <a href="#produtos" className="hover:text-pink-300 transition">
                Copos & Taças Artesanais
              </a>
            </li>
            <li>
              <a href="#sobre" className="hover:text-pink-300 transition">
                Nossa História & Fundadores
              </a>
            </li>
            <li>
              <a href="#especiais" className="hover:text-pink-300 transition">
                Milkshakes & Crepiocas
              </a>
            </li>
            <li>
              <a href="#franquia" className="hover:text-pink-300 transition">
                Seja um Franchisado
              </a>
            </li>
            <li>
              <a href="#loja" className="hover:text-pink-300 transition">
                Nossa Casa em Torres Novas
              </a>
            </li>
          </ul>
        </div>

        {/* Coluna 3: Contactos Oficiais */}
        <div className="space-y-2 text-left">
          <div className="text-xs font-black text-white uppercase tracking-wider">
            Atendimento
          </div>
          <ul className="space-y-1.5 text-xs text-purple-200/70">
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>+351 911 050 264</span>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="h-3.5 w-3.5 text-pink-400" />
              <span>@acaidarose.pt</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-fuchsia-400" />
              <span>Torres Novas, Portugal</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1536px] mx-auto border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-purple-200/60">
        <div>
          © {new Date().getFullYear()} Açaí da Rose. Todos os direitos reservados.
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-pink-300/90">
            <span>Feito com</span>
            <Heart className="h-3 w-3 fill-pink-400 text-pink-400 inline" />
            <span>para os amantes de açaí</span>
          </div>

          <span className="text-white/20 hidden sm:inline">•</span>

          <div>
            Desenvolvido por{' '}
            <a
              href="https://www.hljdev.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 font-bold hover:underline transition"
            >
              HLJDEV
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
