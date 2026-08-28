'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Home, UtensilsCrossed } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0A0612] text-white p-6 overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Luzes de Fundo Animadas (Ambient Glow) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-900/15 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      {/* Grid de Linhas Sutis */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2A1E3D15_1px,transparent_1px),linear-gradient(to_bottom,#2A1E3D15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        {/* Logo Oficial */}
        <div className="flex justify-center mb-2">
          <img
            src="/logo.png"
            alt="Açaí da Rose"
            className="h-12 w-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* 404 Tipográfico com Efeito Iluminado */}
        <div className="relative inline-block">
          <span className="text-8xl sm:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-200 to-purple-900/60 select-none font-mono">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-[#160F24]/90 border border-[#2A1E3D] text-purple-300 font-semibold shadow-xl backdrop-blur-md">
              Página Não Encontrada
            </span>
          </div>
        </div>

        {/* Mensagem Acolhedora em PT-PT */}
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Ups! Esta página parece ter evaporado
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
            O endereço que tentou aceder pode ter sido alterado, transferido ou já não se encontra disponível.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Voltar ao Início</span>
          </Link>

          <Link
            href="/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#160F24] hover:bg-[#2A1E3D] border border-[#2A1E3D] text-gray-200 font-medium text-xs transition-all cursor-pointer"
          >
            <UtensilsCrossed className="h-4 w-4 text-purple-400" />
            <span>Ver Ementa Digital</span>
          </Link>
        </div>

        {/* Rodapé Discreto */}
        <div className="pt-8 border-t border-[#2A1E3D]/50 text-[11px] text-gray-400">
          Açaí da Rose · Aveiro & Torres Novas, Portugal
        </div>
      </div>
    </div>
  )
}
